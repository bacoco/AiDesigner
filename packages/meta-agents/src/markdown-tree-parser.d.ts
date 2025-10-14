declare module '@kayvan/markdown-tree-parser' {
  export interface MarkdownTreeParser {
    parse(content: string): any;
    getHeadingsList(tree: any): Array<{ level: number; text: string }>;
    extractAllSections(tree: any, level: number): Array<{
      tree: any;
      headingText?: string;
      heading?: { depth: number }
    }>;
    stringify(tree: any): Promise<string>;
  }

  export default function createParser(): MarkdownTreeParser;
}
