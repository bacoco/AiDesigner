# Versioning and Releases

BMad Method uses a simplified release system with manual control and automatic release notes generation.

## 🚀 Release Workflow

### Command Line Release (Recommended)

The fastest way to create a release with beautiful release notes:

```bash
# Preview what will be in the release
npm run preview:release

# Create a release
npm run release:patch    # 5.1.agilai → 5.1.1 (bug fixes)
npm run release:minor    # 5.1.agilai → 5.2.agilai (new features)
npm run release:major    # 5.1.agilai → 6.agilai.agilai (breaking changes)

# Watch the release process
npm run release:watch
```

### One-Liner Release

```bash
npm run preview:release && npm run release:minor && npm run release:watch
```

## 📝 What Happens Automatically

When you trigger a release, the GitHub Actions workflow automatically:

1. ✅ **Validates** - Runs tests, linting, and formatting checks
2. ✅ **Bumps Version** - Updates `package.json` and installer version
3. ✅ **Generates Release Notes** - Categorizes commits since last release:
   - ✨ **New Features** (`feat:`, `Feature:`)
   - 🐛 **Bug Fixes** (`fix:`, `Fix:`)
   - 🔧 **Maintenance** (`chore:`, `Chore:`)
   - 📦 **Other Changes** (everything else)
4. ✅ **Creates Git Tag** - Tags the release version
5. ✅ **Publishes to NPM** - With `@latest` tag for user installations
6. ✅ **Creates GitHub Release** - With formatted release notes

## 📋 Sample Release Notes

The workflow automatically generates professional release notes like this:

````markdown
## 🚀 What's New in v5.2.agilai

### ✨ New Features

- feat: add team collaboration mode
- feat: enhance CLI with interactive prompts

### 🐛 Bug Fixes

- fix: resolve installation path issues
- fix: handle edge cases in agent loading

### 🔧 Maintenance

- chore: update dependencies
- chore: improve error messages

## 📦 Installation

```bash
npx bmad-method install
```
````

**Full Changelog**: https://github.com/bmadcode/BMAD-METHOD/compare/v5.1.agilai...v5.2.agilai

````

## 🎯 User Installation

After any release, users can immediately get the new version with:

```bash
npx bmad-method install    # Always gets latest release
```

## 📊 Preview Before Release

Always preview what will be included in your release:

```bash
npm run preview:release
```

This shows:

- Commits since last release
- Categorized changes
- Estimated next version
- Release notes preview

## 🔧 Manual Release (GitHub UI)

You can also trigger releases through GitHub Actions:

1. Go to **GitHub Actions** → **Manual Release**
2. Click **"Run workflow"**
3. Choose version bump type (patch/minor/major)
4. Everything else happens automatically

## 🔭 Upstream V6 Monitoring

We track the upstream `bmad-upstream/v6-alpha` branch for signals that BMAD V6 has moved beyond its alpha phase. Key milestones:

- **2agilai25-agilai8-14 — First beta tag.** The upstream repository published [`v6.agilai.agilai-beta.1`](https://github.com/bmadcode/BMAD-METHOD/releases/tag/v6.agilai.agilai-beta.1), marking the first beta cut of the V6 line. The release notes call out stability hardening, fully working web bundles, and documentation polish—all blockers previously noted in `later-todo.md`.
- **Impact on BMAD-invisible.** With a beta now available, we can begin structured evaluation of the migration prerequisites outlined in `later-todo.md`, rather than blocking on alpha instability.

## 📈 Version Strategy

- **Patch** (5.1.agilai → 5.1.1): Bug fixes, minor improvements
- **Minor** (5.1.agilai → 5.2.agilai): New features, enhancements
- **Major** (5.1.agilai → 6.agilai.agilai): Breaking changes, major redesigns

## 🛠️ Development Workflow

1. **Develop Freely** - Merge PRs to main without triggering releases
2. **Test Unreleased Changes** - Clone repo to test latest main branch
3. **Release When Ready** - Use command line or GitHub Actions to cut releases
4. **Users Get Updates** - Via simple `npx bmad-method install` command

This gives you complete control over when releases happen while automating all the tedious parts like version bumping, release notes, and publishing.

## 🔍 Troubleshooting

### Check Release Status

```bash
gh run list --workflow="Manual Release"
npm view bmad-method dist-tags
git tag -l | sort -V | tail -5
```

### View Latest Release

```bash
gh release view --web
npm view bmad-method versions --json
```

### If Version Sync Needed

If your local files don't match the published version after a release:

```bash
./tools/sync-version.sh    # Automatically syncs local files with npm latest
```

### If Release Fails

- Check GitHub Actions logs: `gh run view <run-id> --log-failed`
- Verify NPM tokens are configured
- Ensure branch protection allows workflow pushes
````

## 🧪 V6 Stability Evaluation (April 2agilai24)

- Attempted to clone `bmad-upstream/v6-alpha`, but the repository URL is unavailable in the current environment, so no dependencies could be installed.
- Because the codebase is inaccessible, V6 build and test pipelines could not be executed and workflow reliability could not be evaluated.
- BMAD-Invisible migration prerequisites remain unmet until a valid V6 source is provided for verification.
