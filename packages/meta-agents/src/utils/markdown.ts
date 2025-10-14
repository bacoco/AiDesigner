import type { MarkdownTreeParser } from '@kayvan/markdown-tree-parser';
import type { DirectiveSection, MetaAgentDirective } from '../types';

export const slugifyHeading = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export interface ParseDirectiveOptions {
  parser?: MarkdownTreeParser;
}

export const parseDirective = async (
  markdown: string,
  options: ParseDirectiveOptions = {},
): Promise<MetaAgentDirective> => {
  const parser = await resolveParser(options.parser);
  const tree = await parser.parse(markdown);
  const headings = parser.getHeadingsList(tree);
  const title = headings.find((heading) => heading.level === 1)?.text ?? 'Directive';
  const sections: DirectiveSection[] = [];
  const sectionTrees = parser.extractAllSections(tree, 2);

  for (const section of sectionTrees) {
    const content = (await parser.stringify(section.tree)).trim();
    sections.push({
      heading: section.headingText || 'Untitled',
      depth: section.heading?.depth || 2,
      slug: slugifyHeading(section.headingText || 'untitled'),
      content,
    });
  }

  return {
    title,
    sections,
    raw: markdown,
  };
};

export const findDirectiveSection = (
  directive: MetaAgentDirective,
  heading: string,
): DirectiveSection | undefined => {
  const normalized = slugifyHeading(heading);
  return (
    directive.sections.find((section) => section.slug === normalized) ??
    directive.sections.find((section) =>
      slugifyHeading(section.heading).includes(normalized),
    )
  );
};

export const listDirectiveHeadings = (directive: MetaAgentDirective): string[] =>
  directive.sections.map((section) => section.heading);

type MarkdownTreeParserConstructor = new (options?: Record<string, unknown>) => MarkdownTreeParser;

let cachedConstructor: MarkdownTreeParserConstructor | undefined;
let fallbackParserInstance: MarkdownTreeParser | undefined;

const loadParserConstructor = async (): Promise<MarkdownTreeParserConstructor> => {
  if (!cachedConstructor) {
    const dynamicImport = new Function(
      'specifier',
      'return import(specifier);',
    ) as <TModule>(specifier: string) => Promise<TModule>;
    const module = await dynamicImport<typeof import('@kayvan/markdown-tree-parser')>(
      '@kayvan/markdown-tree-parser',
    );
    const candidate = (module as { MarkdownTreeParser?: MarkdownTreeParserConstructor }).MarkdownTreeParser;
    if (candidate) {
      cachedConstructor = candidate;
    } else if ((module as { default?: unknown }).default) {
      cachedConstructor = (module as { default: unknown }).default as MarkdownTreeParserConstructor;
    } else {
      throw new Error('Failed to load MarkdownTreeParser from @kayvan/markdown-tree-parser.');
    }
  }
  return cachedConstructor;
};

const resolveParser = async (parser?: MarkdownTreeParser): Promise<MarkdownTreeParser> => {
  if (parser) {
    return parser;
  }
  try {
    const ParserCtor = await loadParserConstructor();
    return new ParserCtor();
  } catch (error) {
    if (!fallbackParserInstance) {
      fallbackParserInstance = new BasicMarkdownParser() as unknown as MarkdownTreeParser;
    }
    return fallbackParserInstance;
  }
};

interface BasicMarkdownTree {
  lines: string[];
}

interface BasicSection {
  headingText: string;
  depth: number;
  start: number;
  end: number;
}

class BasicMarkdownParser {
  async parse(markdown: string): Promise<BasicMarkdownTree> {
    return { lines: splitLines(markdown) };
  }

  async stringify(tree: BasicMarkdownTree): Promise<string> {
    return tree.lines.join('\n');
  }

  getHeadingsList(tree: BasicMarkdownTree): { level: number; text: string }[] {
    return collectHeadings(tree.lines).map((section) => ({ level: section.depth, text: section.headingText }));
  }

  extractAllSections(tree: BasicMarkdownTree, level = 2): Array<{ heading: { depth: number }; headingText: string; tree: BasicMarkdownTree }> {
    const sections = collectHeadings(tree.lines, level);
    return sections.map((section) => ({
      heading: { depth: section.depth },
      headingText: section.headingText,
      tree: { lines: tree.lines.slice(section.start, section.end) },
    }));
  }
}

const splitLines = (markdown: string): string[] => markdown.replace(/\r\n/g, '\n').split('\n');

const collectHeadings = (lines: string[], targetLevel?: number): BasicSection[] => {
  const headings: BasicSection[] = [];
  const headingRegex = /^(#+)\s+(.*)$/;
  for (let index = 0; index < lines.length; index++) {
    const match = headingRegex.exec(lines[index]);
    if (!match) continue;
    const depth = match[1].length;
    if (targetLevel && depth !== targetLevel) continue;
    const headingText = match[2].trim();
    const start = index;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const nextMatch = headingRegex.exec(lines[cursor]);
      if (nextMatch && nextMatch[1].length <= depth) {
        end = cursor;
        break;
      }
    }
    headings.push({ headingText, depth, start, end });
  }
  return headings;
};
