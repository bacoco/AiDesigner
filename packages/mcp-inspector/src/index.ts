import http from 'node:http';
import https from 'node:https';
import type {
  AccessibilitySummary,
  ConsoleMessage,
  InspectionArtifacts,
  StyleRuleSummary,
  StylesheetSummary,
} from '@aidesigner/shared-types';

export type InspectOptions = {
  /**
   * URL to capture.
   */
  url: string;
  /**
   * Visual states to request from the caller (recorded for downstream steps).
   */
  states?: string[];
  /**
   * Timeout in milliseconds for network fetches.
   */
  timeoutMs?: number;
};

export type InspectionErrorStage = 'fetch-html' | 'fetch-stylesheet';

export type InspectionError = {
  stage: InspectionErrorStage;
  message: string;
  resource?: string;
};

export type InspectResult = InspectionArtifacts & {
  errors: InspectionError[];
};

const DEFAULT_TIMEOUT_MS = 8000;

export async function analyzeWithMCP(opts: InspectOptions): Promise<InspectResult> {
  const errors: InspectionError[] = [];

  let targetUrl: URL;
  try {
    targetUrl = new URL(opts.url);
  } catch (error) {
    throw new Error(`Invalid URL: ${formatErrorMessage(error)}`);
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const html = await fetchText(targetUrl, timeoutMs).catch((error) => {
    throw new Error(`Failed to fetch HTML: ${formatErrorMessage(error)}`);
  });

  const stylesheets = await extractStylesheets(html, targetUrl, timeoutMs, errors);
  const aggregatedCss = stylesheets.map((sheet) => sheet.content).join('\n');
  const computedStyles = buildComputedStyles(aggregatedCss, html);
  const accessibility = buildAccessibilitySummaries(html);

  const artifacts: InspectionArtifacts = {
    url: targetUrl.href,
    states: opts.states ?? [],
    fetchedAt: new Date().toISOString(),
    domSnapshot: { html },
    cssom: { stylesheets, aggregated: aggregatedCss },
    computedStyles,
    accessibility,
    console: [] satisfies ConsoleMessage[],
  };

  return {
    ...artifacts,
    errors,
  };
}

async function fetchText(url: URL, timeoutMs: number, redirectCount = 0): Promise<string> {
  if (redirectCount > 5) {
    throw new Error('Too many redirects while fetching resource');
  }

  const client = url.protocol === 'https:' ? https : http;

  return new Promise<string>((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'AiDesigner-MCP-Inspector/1.0',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        const { statusCode = 0, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          response.resume();
          const nextUrl = new URL(headers.location, url);
          fetchText(nextUrl, timeoutMs, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Unexpected status ${statusCode}`));
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
        response.on('error', reject);
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Request timed out'));
    });

    request.on('error', reject);
    request.end();
  });
}

async function extractStylesheets(
  html: string,
  baseUrl: URL,
  timeoutMs: number,
  errors: InspectionError[],
): Promise<StylesheetSummary[]> {
  const stylesheets: StylesheetSummary[] = [];

  const inlineRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlineRegex.exec(html))) {
    const content = inlineMatch[1]?.trim() ?? '';
    if (content) {
      stylesheets.push({ href: null, content });
    }
  }

  const linkRegex = /<link[^>]+rel=(?:"|')?stylesheet(?:"|')?[^>]*>/gi;
  const fetches: Promise<void>[] = [];
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html))) {
    const tag = linkMatch[0];
    const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    if (!hrefMatch) {
      continue;
    }

    const rawHref = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3];
    try {
      const resolved = new URL(rawHref, baseUrl);
      const fetchPromise = fetchText(resolved, timeoutMs)
        .then((content) => {
          if (content.trim()) {
            stylesheets.push({ href: resolved.href, content });
          }
        })
        .catch((error) => {
          errors.push({
            stage: 'fetch-stylesheet',
            resource: resolved.href,
            message: formatErrorMessage(error),
          });
        });
      fetches.push(fetchPromise);
    } catch (error) {
      errors.push({
        stage: 'fetch-stylesheet',
        resource: rawHref,
        message: `Invalid stylesheet URL: ${formatErrorMessage(error)}`,
      });
    }
  }

  await Promise.all(fetches);
  return stylesheets;
}

function buildComputedStyles(css: string, html: string): StyleRuleSummary[] {
  const cleanedCss = stripCssComments(css);
  const rules: StyleRuleSummary[] = [];

  const walker = createCssWalker(cleanedCss);
  for (const block of walker) {
    if (block.selector.startsWith('@')) {
      const nested = buildComputedStyles(block.declarationsText, html);
      rules.push(...nested);
      continue;
    }

    const declarations = parseDeclarations(block.declarationsText);
    if (Object.keys(declarations).length > 0) {
      rules.push({ selector: block.selector, declarations });
    }
  }

  const inlineRules = extractInlineStyles(html);
  rules.push(...inlineRules);

  return rules;
}

type CssBlock = { selector: string; declarationsText: string };

function* createCssWalker(css: string): Generator<CssBlock> {
  let index = 0;
  const length = css.length;

  while (index < length) {
    const openIndex = css.indexOf('{', index);
    if (openIndex === -1) {
      break;
    }

    const selector = css.slice(index, openIndex).trim();
    let depth = 1;
    let cursor = openIndex + 1;

    while (cursor < length && depth > 0) {
      const char = css[cursor];
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      }
      cursor += 1;
    }

    const declarationsText = css.slice(openIndex + 1, cursor - 1).trim();
    if (selector) {
      yield { selector, declarationsText };
    }

    index = cursor;
  }
}

function stripCssComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseDeclarations(block: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const segments = block.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }
    const prop = trimmed.slice(0, colonIndex).trim();
    const val = trimmed.slice(colonIndex + 1).trim();
    if (prop && val) {
      declarations[prop] = val;
    }
  }
  return declarations;
}

function extractInlineStyles(html: string): StyleRuleSummary[] {
  const results: StyleRuleSummary[] = [];
  const regex = /<([a-zA-Z0-9-]+)([^>]*?)style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const styleText = match[3] ?? match[4] ?? '';
    const declarations = parseDeclarations(styleText);
    if (Object.keys(declarations).length === 0) {
      continue;
    }

    const classTokens = (attrs.class ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const selectorParts = [tag];
    if (attrs.id) {
      selectorParts.push(`#${attrs.id}`);
    }
    for (const cls of classTokens) {
      selectorParts.push(`.${cls}`);
    }
    const selector = selectorParts.join('');
    results.push({ selector: selector || tag, declarations });
  }
  return results;
}

function parseAttributes(input: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrRegex = /([\w-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(input))) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (name) {
      attributes[name] = value;
    }
  }
  return attributes;
}

function buildAccessibilitySummaries(html: string): AccessibilitySummary[] {
  const summaries = new Map<string, { count: number; tagNames: Set<string> }>();
  const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html))) {
    const rawTag = match[0];
    if (rawTag.startsWith('</')) {
      continue;
    }

    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const role = attrs.role || inferImplicitRole(tag, attrs);
    if (!role) {
      continue;
    }
    const entry = summaries.get(role) ?? { count: 0, tagNames: new Set<string>() };
    entry.count += 1;
    entry.tagNames.add(tag);
    summaries.set(role, entry);
  }

  return Array.from(summaries.entries())
    .map<AccessibilitySummary>(([role, data]) => ({
      role,
      count: data.count,
      tagNames: Array.from(data.tagNames).sort(),
    }))
    .sort((a, b) => b.count - a.count);
}

function inferImplicitRole(tag: string, attrs: Record<string, string>): string | undefined {
  if (tag === 'button') {
    return 'button';
  }
  if (tag === 'a' && typeof attrs.href === 'string' && attrs.href.length > 0) {
    return 'link';
  }
  if (tag === 'img') {
    return 'img';
  }
  if (tag === 'input') {
    const type = (attrs.type ?? '').toLowerCase();
    if (type === 'button' || type === 'submit' || type === 'reset') {
      return 'button';
    }
    if (type === 'checkbox') {
      return 'checkbox';
    }
    if (type === 'radio') {
      return 'radio';
    }
    if (type === 'text' || type === 'email' || type === 'search' || type === 'tel' || type === 'url') {
      return 'textbox';
    }
  }
  if (tag === 'textarea') {
    return 'textbox';
  }
  if (tag === 'select') {
    return 'listbox';
  }
  if (tag === 'nav') {
    return 'navigation';
  }
  if (tag === 'header') {
    return 'banner';
  }
  if (tag === 'footer') {
    return 'contentinfo';
  }
  if (tag === 'main') {
    return 'main';
  }
  if (tag === 'form') {
    return 'form';
  }
  if (tag === 'aside') {
    return 'complementary';
  }
  if (tag === 'section') {
    return 'region';
  }
  return undefined;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}
