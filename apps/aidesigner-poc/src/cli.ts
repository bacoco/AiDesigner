#!/usr/bin/env node
import { runUrlAnalysis } from './run-url-analysis';
import { buildReact } from './build-react-page';
import { generateDriftReport } from './generate-reports';

const url = process.argv[2];
if (!url) {
  console.error('Usage: aidesigner-poc <url>');
  process.exit(1);
}

(async () => {
  try {
    const outRoot = `./out/${Date.now()}`;
    const { tokens, comps } = await runUrlAnalysis(url, outRoot);
    await buildReact(tokens, comps, outRoot);
    await generateDriftReport(tokens, outRoot);
    console.log(`✅ Done. See ${outRoot}/evidence, ${outRoot}/generated, ${outRoot}/reports`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
})();
