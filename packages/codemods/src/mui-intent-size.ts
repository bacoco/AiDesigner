// Convert canonical intent/size props to MUI color/size
import { Project, SyntaxKind, JsxAttribute } from 'ts-morph';

const intentToColor: Record<string, string> = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'error',
};
const sizeMap: Record<string, string> = { sm: 'small', md: 'medium', lg: 'large' };

export async function run(glob: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(glob);

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxOpeningElement) {
        const el = node.asKind(SyntaxKind.JsxOpeningElement);
        if (!el) return;

        if (el.getTagNameNode().getText() === 'Button') {
          const intentAttr = el.getAttribute('intent');
          if (intentAttr && intentAttr.getKind() === SyntaxKind.JsxAttribute) {
            const intent = intentAttr as JsxAttribute;
            const initializer = intent.getInitializer();
            if (initializer) {
              // Strip quotes from the initializer text (e.g., '"primary"' -> 'primary')
              const rawValue = initializer.getText().replace(/^["']|["']$/g, '');
              const colorValue = intentToColor[rawValue] || 'primary';
              el.addAttribute({
                name: 'color',
                initializer: `"${colorValue}"`,
              });
            }
            intent.remove();
          }

          const sizeAttr = el.getAttribute('size');
          if (sizeAttr && sizeAttr.getKind() === SyntaxKind.JsxAttribute) {
            const size = sizeAttr as JsxAttribute;
            const initializer = size.getInitializer();
            if (initializer) {
              // Strip quotes from the initializer text (e.g., '"md"' -> 'md')
              const rawValue = initializer.getText().replace(/^["']|["']$/g, '');
              const sizeValue = sizeMap[rawValue] || 'medium';
              el.addAttribute({
                name: 'size',
                initializer: `"${sizeValue}"`,
              });
            }
            size.remove();
          }
        }
      }
    });
  });
  await project.save();
}
