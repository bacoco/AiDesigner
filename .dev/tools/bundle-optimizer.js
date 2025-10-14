/**
 * Bundle Size Optimizer for AiDesigner
 *
 * Analyzes and optimizes the repository size by:
 * - Cleaning up unnecessary files
 * - Optimizing dependencies
 * - Removing build artifacts that can be regenerated
 * - Identifying large files and directories
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleOptimizer {
  constructor() {
    this.rootDir = process.cwd();
    this.sizeBefore = 0;
    this.sizeAfter = 0;
    this.optimizations = [];
  }

  // Get directory size in bytes
  getDirectorySize(dirPath) {
    try {
      const output = execSync(`du -sb "${dirPath}"`, { encoding: 'utf8' });
      return parseInt(output.split('\t')[0], 10);
    } catch (error) {
      console.warn(`Could not get size for ${dirPath}:`, error.message);
      return 0;
    }
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  // Analyze current bundle size
  analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...\n');

    const totalSize = this.getDirectorySize(this.rootDir);
    this.sizeBefore = totalSize;

    console.log(`Total repository size: ${this.formatBytes(totalSize)}\n`);

    // Analyze major directories
    const majorDirs = ['node_modules', 'dist', '.git', 'lolo', 'packages', 'docs'];
    const dirSizes = {};

    for (const dir of majorDirs) {
      const dirPath = path.join(this.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        dirSizes[dir] = this.getDirectorySize(dirPath);
      }
    }

    // Sort by size
    const sortedDirs = Object.entries(dirSizes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.log('📂 Largest directories:');
    for (const [dir, size] of sortedDirs) {
      const percentage = ((size / totalSize) * 100).toFixed(1);
      console.log(`   ${dir}: ${this.formatBytes(size)} (${percentage}%)`);
    }

    return { totalSize, dirSizes };
  }

  // Clean up test projects and temporary files
  cleanupTestProjects() {
    const testDirs = ['lolo/node_modules', 'tmp', 'test-output'];
    let cleaned = 0;

    for (const testDir of testDirs) {
      const fullPath = path.join(this.rootDir, testDir);
      if (fs.existsSync(fullPath)) {
        const size = this.getDirectorySize(fullPath);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          cleaned += size;
          this.optimizations.push(`Removed ${testDir}: ${this.formatBytes(size)}`);
          console.log(`✅ Cleaned ${testDir}: ${this.formatBytes(size)}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove ${testDir}:`, error.message);
        }
      }
    }

    return cleaned;
  }

  // Clean up build artifacts that can be regenerated
  cleanupBuildArtifacts() {
    const buildDirs = ['dist'];
    let cleaned = 0;

    for (const buildDir of buildDirs) {
      const fullPath = path.join(this.rootDir, buildDir);
      if (fs.existsSync(fullPath)) {
        const size = this.getDirectorySize(fullPath);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          cleaned += size;
          this.optimizations.push(`Removed build artifacts ${buildDir}: ${this.formatBytes(size)}`);
          console.log(`✅ Cleaned build artifacts ${buildDir}: ${this.formatBytes(size)}`);
        } catch (error) {
          console.warn(`⚠️  Could not remove ${buildDir}:`, error.message);
        }
      }
    }

    return cleaned;
  }

  // Rebuild essential artifacts
  rebuildArtifacts() {
    console.log('🔨 Rebuilding essential artifacts...');

    try {
      // Rebuild dist directory
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Rebuilt dist directory');

      // Rebuild MCP server
      execSync('npm run build:mcp', { stdio: 'inherit' });
      console.log('✅ Rebuilt MCP server');
    } catch (error) {
      console.error('❌ Error rebuilding artifacts:', error.message);
      throw error;
    }
  }

  // Optimize package.json dependencies
  optimizeDependencies() {
    console.log('📦 Analyzing dependencies...');

    try {
      // Check for unused dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});

      console.log(`   Production dependencies: ${deps.length}`);
      console.log(`   Development dependencies: ${devDeps.length}`);

      // Note: We don't automatically remove dependencies as that could break functionality
      console.log(
        '   💡 Consider running `npm audit` and `depcheck` to identify unused dependencies',
      );
    } catch (error) {
      console.warn('⚠️  Could not analyze dependencies:', error.message);
    }
  }

  // Generate optimization report
  generateReport() {
    this.sizeAfter = this.getDirectorySize(this.rootDir);
    const savings = this.sizeBefore - this.sizeAfter;
    const savingsPercent = ((savings / this.sizeBefore) * 100).toFixed(1);

    console.log('\n📋 Bundle Optimization Report');
    console.log('============================');
    console.log(`Size before: ${this.formatBytes(this.sizeBefore)}`);
    console.log(`Size after:  ${this.formatBytes(this.sizeAfter)}`);
    console.log(`Savings:     ${this.formatBytes(savings)} (${savingsPercent}%)\n`);

    if (this.optimizations.length > 0) {
      console.log('🎯 Optimizations applied:');
      for (const optimization of this.optimizations) {
        console.log(`   • ${optimization}`);
      }
    } else {
      console.log('ℹ️  No optimizations were applied');
    }

    console.log('\n💡 Additional recommendations:');
    console.log('   • Run `npm audit fix` to update vulnerable dependencies');
    console.log('   • Consider using `npm ci` instead of `npm install` in CI/CD');
    console.log('   • Use `.npmignore` to exclude unnecessary files from npm package');
    console.log('   • Consider splitting large dependencies into separate packages');

    return {
      sizeBefore: this.sizeBefore,
      sizeAfter: this.sizeAfter,
      savings,
      savingsPercent: parseFloat(savingsPercent),
      optimizations: this.optimizations,
    };
  }

  // Run full optimization
  async optimize() {
    console.log('🚀 Starting bundle optimization...\n');

    // Analyze current state
    this.analyzeBundleSize();
    console.log();

    // Clean up test projects
    console.log('🧹 Cleaning up test projects and temporary files...');
    this.cleanupTestProjects();
    console.log();

    // Clean up build artifacts
    console.log('🧹 Cleaning up build artifacts...');
    this.cleanupBuildArtifacts();
    console.log();

    // Rebuild essential artifacts
    this.rebuildArtifacts();
    console.log();

    // Optimize dependencies
    this.optimizeDependencies();
    console.log();

    // Generate final report
    const report = this.generateReport();

    console.log('\n✅ Bundle optimization complete!');
    return report;
  }
}

// Main execution
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.optimize().catch((error) => {
    console.error('❌ Bundle optimization failed:', error.message);
    process.exit(1);
  });
}

module.exports = BundleOptimizer;
