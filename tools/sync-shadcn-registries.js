const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const registriesPath = path.join(projectRoot, 'common/shadcn-registries.json');

const registries = JSON.parse(fs.readFileSync(registriesPath, 'utf8'));

const targets = [
  path.join(projectRoot, 'front-end/components.json'),
  path.join(projectRoot, 'lolo/components.json'),
];

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const config = JSON.parse(fileContents);
  config.registries = registries;
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');
  console.log(`✅ Updated registries in ${path.relative(projectRoot, filePath)}`);
}
