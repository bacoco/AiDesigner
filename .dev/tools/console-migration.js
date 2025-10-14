/**
 * Console.log Migration Tool
 *
 * Helps identify and migrate console.log statements to structured logging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all JS files with console statements
function findConsoleUsage() {
  try {
    const output = execSync(
      `find . -name "*.js" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./lolo/*" | xargs grep -n "console\\." 2>/dev/null || true`,
      { encoding: 'utf8', cwd: process.cwd() },
    );

    const lines = output.trim().split('\n').filter(Boolean);
    const usage = {};

    lines.forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;

      const filePath = line.substring(0, colonIndex);
      const rest = line.substring(colonIndex + 1);

      if (!usage[filePath]) {
        usage[filePath] = [];
      }
      usage[filePath].push(rest);
    });

    return usage;
  } catch (error) {
    console.error('Error finding console usage:', error.message);
    return {};
  }
}

// Categorize console usage
function categorizeConsoleUsage(usage) {
  const categories = {
    tools: {}, // .dev/tools/ - mostly appropriate CLI output
    bin: {}, // bin/ - CLI binaries, mostly appropriate
    core: {}, // core application files - candidates for migration
    other: {}, // everything else
  };

  for (const [file, statements] of Object.entries(usage)) {
    if (file.includes('.dev/tools/')) {
      categories.tools[file] = statements;
    } else if (file.includes('bin/')) {
      categories.bin[file] = statements;
    } else if (file.includes('common/') || file.includes('aidesigner-core/')) {
      categories.core[file] = statements;
    } else {
      categories.other[file] = statements;
    }
  }

  return categories;
}

// Generate migration report
function generateMigrationReport() {
  const usage = findConsoleUsage();
  const categories = categorizeConsoleUsage(usage);
  const files = Object.keys(usage);

  console.log('📊 Console.log Migration Report');
  console.log('================================\n');

  let totalStatements = 0;
  files.forEach((file) => {
    totalStatements += usage[file].length;
  });

  console.log(`📁 Files with console statements: ${files.length}`);
  console.log(`📝 Total console statements: ${totalStatements}\n`);

  // Show breakdown by category
  console.log('📂 By Category:');
  const categoryStats = {};
  for (const [category, categoryFiles] of Object.entries(categories)) {
    const fileCount = Object.keys(categoryFiles).length;
    const statementCount = Object.values(categoryFiles).reduce(
      (sum, statements) => sum + statements.length,
      0,
    );
    categoryStats[category] = { fileCount, statementCount };

    const icon = {
      tools: '🔧',
      bin: '🚀',
      core: '⚙️',
      other: '📄',
    }[category];

    console.log(`   ${icon} ${category}: ${fileCount} files, ${statementCount} statements`);
  }

  // Show migration candidates (core files)
  console.log('\n🎯 Migration Candidates (Core Application):');
  const coreFiles = Object.entries(categories.core);
  if (coreFiles.length === 0) {
    console.log('   ✅ No core files with console statements found!');
  } else {
    coreFiles.forEach(([file, statements]) => {
      console.log(`   ${file}: ${statements.length} statements`);
    });
  }

  console.log('\n💡 Migration Strategy:');
  console.log('   1. ✅ Tools and binaries: Keep console.log for CLI output');
  console.log('   2. 🔄 Core application: Migrate to structured logging');
  console.log('   3. 📊 Focus on error/warn statements first');

  return { usage, categories, totalStatements, categoryStats };
}

// Migrate a specific file
function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if logger is already imported
  const hasLoggerImport = content.includes('structured-logger') || content.includes('./logger');

  if (!hasLoggerImport) {
    // Add logger import at the top after existing requires
    const requireRegex = /^((?:.*require\(.*\).*\n)*)/m;
    const match = content.match(requireRegex);
    if (match) {
      const loggerImport = "const logger = require('../../.dev/tools/structured-logger');\n";
      content = content.replace(requireRegex, match[1] + loggerImport);
      modified = true;
    }
  }

  // Replace console.warn with logger.warn (preserve context)
  const warnReplacements = content.match(/console\.warn\([^)]+\)/g);
  if (warnReplacements) {
    for (const replacement of warnReplacements) {
      // Simple replacement - more sophisticated parsing could be added
      const newReplacement = replacement.replace('console.warn', 'logger.warn');
      content = content.replace(replacement, newReplacement);
      modified = true;
    }
  }

  // Replace console.error with logger.error (but be careful about CLI errors)
  const errorReplacements = content.match(/console\.error\([^)]+\)/g);
  if (errorReplacements) {
    for (const replacement of errorReplacements) {
      // Only replace if it's not a user-facing CLI error (heuristic)
      if (!replacement.includes('❌') && !replacement.includes('⚠️')) {
        const newReplacement = replacement.replace('console.error', 'logger.error');
        content = content.replace(replacement, newReplacement);
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  console.log('🔍 Analyzing console.log usage in AiDesigner...\n');

  const report = generateMigrationReport();

  // Migrate core files if any exist
  const coreFiles = Object.keys(report.categories.core);
  if (coreFiles.length > 0) {
    console.log('\n🔄 Migrating core files...');
    let migratedCount = 0;
    for (const file of coreFiles.slice(0, 3)) {
      // Migrate first 3 files
      if (migrateFile(file)) {
        migratedCount++;
      }
    }
    console.log(`\n✅ Migration complete! Migrated ${migratedCount} files`);
  }

  console.log('\n📄 Run this script anytime to check progress');
}

module.exports = {
  findConsoleUsage,
  generateMigrationReport,
  migrateFile,
};
