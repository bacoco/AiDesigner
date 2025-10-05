const path = require('node:path');
const {
  refreshBaseline,
  computeCriticalHashes,
  CRITICAL_PATHS,
} = require('../../common/utils/integrity');

const rootDir = path.join(__dirname, '..', '..');

try {
  const { baselinePath } = refreshBaseline(rootDir);
  const hashes = computeCriticalHashes(rootDir);
  console.log('Updated aidesigner critical hash baseline.');
  console.log(` • Baseline file: ${path.relative(rootDir, baselinePath)}`);
  console.log(` • Files tracked: ${Object.keys(hashes).length}`);
  console.log(' • Critical scopes:');
  for (const item of CRITICAL_PATHS) {
    console.log(`   - ${item.path}`);
  }
} catch (error) {
  console.error('Failed to update aidesigner critical hash baseline:');
  console.error(error);
  process.exit(1);
}
