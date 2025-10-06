import { buildShadcnPage } from '../../../packages/codegen/src/react-shadcn';
import { Tokens, ComponentMap } from './types';
import path from 'node:path';

export async function buildReact(tokens: Tokens, comps: ComponentMap, outRoot: string) {
  const outDir = path.join(outRoot, 'generated', 'shadcn-app', 'src', 'app');
  await buildShadcnPage(tokens, comps, outDir);
}
