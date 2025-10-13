import type { ComponentMap } from '@aidesigner/shared-types';

type ComponentInferenceInput = {
  domSnapshot?: unknown;
  accessibilityTree?: unknown;
  cssom?: unknown;
};

type AttributeMap = Record<string, string>;

const MAX_CLASSES_LIKE_BUTTON = 12;
const MAX_CLASSES_LIKE_CARD = 10;
const MAX_CLASSES_LIKE_INPUT = 10;
const MIN_CONTENT_LENGTH_FOR_LABELLED = 3;

export function detectComponents(input: ComponentInferenceInput): ComponentMap {
  const html = extractHtml(input.domSnapshot);
  const css = extractCssText(input.cssom);
  const rolesFromTree = extractRoles(input.accessibilityTree);

  const components: ComponentMap = {};

  const button = analyzeButtons(html, css, rolesFromTree);
  if (button) {
    components.Button = button;
  }

  const card = analyzeCards(html);
  if (card) {
    components.Card = card;
  }

  const inputComponent = analyzeInputs(html, css);
  if (inputComponent) {
    components.Input = inputComponent;
  }

  return components;
}

function extractHtml(domSnapshot: unknown): string {
  if (typeof domSnapshot === 'string') {
    return domSnapshot;
  }
  if (domSnapshot && typeof domSnapshot === 'object') {
    if ('html' in domSnapshot && typeof (domSnapshot as { html?: unknown }).html === 'string') {
      return (domSnapshot as { html: string }).html;
    }
    if ('content' in domSnapshot && typeof (domSnapshot as { content?: unknown }).content === 'string') {
      return (domSnapshot as { content: string }).content;
    }
  }
  return '';
}

function extractCssText(cssom: unknown): string {
  if (typeof cssom === 'string') {
    return cssom;
  }
  if (cssom && typeof cssom === 'object') {
    if ('aggregated' in cssom && typeof (cssom as { aggregated?: unknown }).aggregated === 'string') {
      return (cssom as { aggregated: string }).aggregated;
    }
    if ('content' in cssom && typeof (cssom as { content?: unknown }).content === 'string') {
      return (cssom as { content: string }).content;
    }
  }
  return '';
}

function extractRoles(accessibilityTree: unknown): Set<string> {
  const roles = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    const role = (node as { role?: unknown }).role;
    if (typeof role === 'string') {
      roles.add(role.toLowerCase());
    }
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children)) {
      for (const child of children) {
        visit(child);
      }
    }
  };

  if (Array.isArray(accessibilityTree)) {
    for (const node of accessibilityTree) {
      visit(node);
    }
  } else {
    visit(accessibilityTree);
  }

  return roles;
}

function analyzeButtons(html: string, css: string, rolesFromTree: Set<string>): ComponentMap['Button'] | undefined {
  const buttonRegex = /<(button|a|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const roles = new Set<string>();
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  const intents = new Set<string>();
  const sizes = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = buttonRegex.exec(html))) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const content = match[3] ?? '';
    const roleAttr = attrs.role?.toLowerCase();
    const isSemanticButton = tag === 'button';
    const isInteractiveAnchor = tag === 'a' && roleAttr === 'button';
    const isInteractiveDiv = tag === 'div' && roleAttr === 'button';
    const hasButtonClass = classLooksLikeButton(attrs.class);
    if (!(isSemanticButton || isInteractiveAnchor || isInteractiveDiv || hasButtonClass)) {
      continue;
    }

    found = true;
    if (isSemanticButton || isInteractiveAnchor || isInteractiveDiv || roleAttr) {
      roles.add('button');
    }
    collectButtonMetadata(attrs, content, classTokens, patterns, intents, sizes);
  }

  if (!found && rolesFromTree.has('button')) {
    roles.add('button');
  }

  if (!found && roles.size === 0 && classTokens.size === 0) {
    return undefined;
  }

  const detect: ComponentMap['Button']['detect'] = {};
  if (roles.size > 0) {
    detect.role = Array.from(roles);
  }
  if (classTokens.size > 0) {
    detect.classesLike = Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_BUTTON);
  }
  if (patterns.size > 0) {
    detect.patterns = Array.from(patterns);
  }

  const states = detectStates(css, classTokens, ['hover', 'focus', 'active', 'disabled']);

  const variants =
    intents.size > 0 || sizes.size > 0
      ? {
          ...(intents.size > 0 ? { intent: Array.from(intents) } : {}),
          ...(sizes.size > 0 ? { size: Array.from(sizes) } : {}),
        }
      : undefined;

  return {
    detect,
    variants,
    states: states.length > 0 ? states : undefined,
    mappings: buildButtonMappings(intents.size > 0, sizes.size > 0),
  };
}

function collectButtonMetadata(
  attrs: AttributeMap,
  content: string,
  classTokens: Set<string>,
  patterns: Set<string>,
  intents: Set<string>,
  sizes: Set<string>,
) {
  const classes = (attrs.class ?? '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  for (const cls of classes) {
    classTokens.add(cls);
    if (/(primary|secondary|danger|success|warning|info|outline|ghost|link)/i.test(cls)) {
      const match = cls.match(/(primary|secondary|danger|success|warning|info|outline|ghost|link)/i);
      if (match) {
        intents.add(match[1].toLowerCase());
      }
    }
    if (/(xs|sm|md|lg|xl|2xl|3xl|small|large)/i.test(cls)) {
      const match = cls.match(/(xs|sm|md|lg|xl|2xl|3xl|small|large)/i);
      if (match) {
        sizes.add(normalizeSize(match[1].toLowerCase()));
      }
    }
    if (/rounded|pill|circle/i.test(cls)) {
      patterns.add('rounded');
    }
    if (/shadow/i.test(cls)) {
      patterns.add('shadow');
    }
  }

  if (/border-radius/i.test(attrs.style ?? '')) {
    patterns.add('rounded');
  }
  if (/box-shadow/i.test(attrs.style ?? '')) {
    patterns.add('shadow');
  }
  if (content.trim().length > MIN_CONTENT_LENGTH_FOR_LABELLED) {
    patterns.add('labelled');
  }
}

function buildButtonMappings(hasIntent: boolean, hasSize: boolean): { [target: string]: string } {
  const variantProp = hasIntent ? ' variant="{intent}"' : '';
  const sizeProp = hasSize ? ' size="{size}"' : '';
  return {
    shadcn: `<Button${variantProp}${sizeProp}>{slot}</Button>`,
    mui: `<Button${hasIntent ? ' color="{intent}"' : ''}${hasSize ? ' size="{size}"' : ''}>{slot}</Button>`,
  };
}

function analyzeCards(html: string): ComponentMap['Card'] | undefined {
  const containerRegex = /<div([^>]*)>([\s\S]*?)<\/div>/gi;
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = containerRegex.exec(html))) {
    const attrs = parseAttributes(match[1] ?? '');
    const classes = (attrs.class ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (classes.some((cls) => /(card|panel|box|tile|surface|container)/i.test(cls))) {
      found = true;
      for (const cls of classes) {
        if (/shadow/i.test(cls)) {
          patterns.add('shadow');
        }
        if (/rounded|radius/i.test(cls)) {
          patterns.add('rounded');
        }
        classTokens.add(cls);
      }
      if (/border-radius/i.test(attrs.style ?? '')) {
        patterns.add('rounded');
      }
      if (/box-shadow/i.test(attrs.style ?? '')) {
        patterns.add('shadow');
      }
    }
  }

  if (!found) {
    return undefined;
  }

  return {
    detect: {
      classesLike: Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_CARD),
      patterns: Array.from(patterns),
    },
    mappings: {
      shadcn:
        '<Card><CardHeader>{header}</CardHeader><CardContent>{content}</CardContent></Card>',
      mui: '<Card><CardHeader title={header} /><CardContent>{content}</CardContent></Card>',
    },
  };
}

function analyzeInputs(html: string, css: string): ComponentMap['Input'] | undefined {
  const inputRegex = /<(input|textarea)([^>]*)>/gi;
  const classTokens = new Set<string>();
  const patterns = new Set<string>();
  const roles = new Set<string>();
  let found = false;

  let match: RegExpExecArray | null;
  while ((match = inputRegex.exec(html))) {
    const tag = match[1].toLowerCase();
    const attrs = parseAttributes(match[2] ?? '');
    const type = attrs.type?.toLowerCase();
    if (tag === 'textarea' || ['text', 'email', 'password', 'search', 'number'].includes(type ?? '')) {
      found = true;
      roles.add(tag === 'textarea' ? 'textbox' : 'input');
      const classes = (attrs.class ?? '')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
      for (const cls of classes) {
        classTokens.add(cls);
        if (/rounded|pill/i.test(cls)) {
          patterns.add('rounded');
        }
        if (/shadow/i.test(cls)) {
          patterns.add('shadow');
        }
      }
      if (/border-radius/i.test(attrs.style ?? '')) {
        patterns.add('rounded');
      }
    }
  }

  if (!found) {
    return undefined;
  }

  const states = detectStates(css, classTokens, ['focus', 'disabled']);

  return {
    detect: {
      role: Array.from(roles),
      classesLike: Array.from(classTokens).slice(0, MAX_CLASSES_LIKE_INPUT),
      patterns: Array.from(patterns),
    },
    states: states.length > 0 ? states : undefined,
    mappings: {
      shadcn: '<Input placeholder="{placeholder}" />',
      mui: '<TextField label={label} placeholder={placeholder} />',
    },
  };
}

function detectStates(css: string, classTokens: Set<string>, states: string[]): string[] {
  const detected = new Set<string>();
  for (const state of states) {
    const regexes: RegExp[] = [];
    for (const cls of classTokens) {
      // Escape the literal dot and add word boundaries to prevent over-matching
      regexes.push(new RegExp(`\\.${escapeRegExp(cls)}:${state}\\b`, 'i'));
      regexes.push(new RegExp(`\\.${escapeRegExp(cls)}\\.${state}\\b`, 'i'));
    }
    regexes.push(new RegExp(`\\bbutton:${state}\\b`, 'i'));
    regexes.push(new RegExp(`\\binput:${state}\\b`, 'i'));
    regexes.push(new RegExp(`\\btextarea:${state}\\b`, 'i'));
    if (regexes.some((re) => re.test(css))) {
      detected.add(state);
    }
  }
  return Array.from(detected);
}

function parseAttributes(fragment: string): AttributeMap {
  const attributes: AttributeMap = {};
  const attrRegex = /([\w-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(fragment))) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes[key.toLowerCase()] = value;
  }
  return attributes;
}

function classLooksLikeButton(classAttr: string | undefined): boolean {
  if (!classAttr) {
    return false;
  }
  return /(btn|button|cta|primary|secondary)/i.test(classAttr);
}

function normalizeSize(token: string): string {
  switch (token) {
    case 'small':
      return 'sm';
    case 'large':
      return 'lg';
    default:
      return token;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
