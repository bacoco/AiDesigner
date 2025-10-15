/**
 * Synchronizes shadcn registries across all components.json files
 *
 * This script reads the canonical registry list from common/shadcn-registries.json
 * and updates all project components.json files to match.
 *
 * Usage: node tools/sync-shadcn-registries.js
 *
 * Exit codes:
 *   0 - Success
 *   1 - Failed to read registries file or other critical error
 */

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const registriesPath = path.join(projectRoot, 'common/shadcn-registries.json');

// Read and parse the canonical registries file
let registries;
try {
  const registriesContent = fs.readFileSync(registriesPath, 'utf8');
  registries = JSON.parse(registriesContent);

  // Validate that registries is an object
  if (typeof registries !== 'object' || registries === null || Array.isArray(registries)) {
    throw new Error('Registries file must contain a JSON object');
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`❌ Registries file not found: ${registriesPath}`);
  } else if (error instanceof SyntaxError) {
    console.error(`❌ Invalid JSON in registries file: ${error.message}`);
  } else {
    console.error(`❌ Failed to read registries: ${error.message}`);
  }
  process.exit(1);
}

const targets = [
  path.join(projectRoot, 'front-end/components.json'),
  path.join(projectRoot, 'lolo/components.json'),
];

let hasErrors = false;

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(fileContents);
    config.registries = registries;
    const output = JSON.stringify(config, null, 2) + '\n';
    fs.writeFileSync(filePath, output);

    // Verify the write succeeded by reading back
    const verification = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (JSON.stringify(verification.registries) !== JSON.stringify(registries)) {
      throw new Error('Registry verification failed after write');
    }

    console.log(`✅ Updated registries in ${path.relative(projectRoot, filePath)}`);
  } catch (error) {
    hasErrors = true;
    const relPath = path.relative(projectRoot, filePath);
    if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON in ${relPath}: ${error.message}`);
    } else if (error.code === 'EACCES') {
      console.error(`❌ Permission denied: ${relPath}`);
    } else if (error.code === 'ENOSPC') {
      console.error(`❌ No disk space available for ${relPath}`);
    } else {
      console.error(`❌ Failed to update ${relPath}: ${error.message}`);
    }
  }
}

if (hasErrors) {
  console.error('\n⚠️  Some files failed to update');
  process.exit(1);
}
