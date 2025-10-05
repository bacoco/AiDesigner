#!/usr/bin/env bash
# import_aidesigner.sh — bring the aidesigner repo into the current repo without losing existing work

set -euo pipefail

UPSTREAM_URL="${1:-https://github.com/aidesignerHQ/aidesigner.git}"
UPSTREAM_REMOTE="aidesigner-upstream"
BASE_BRANCH="${2:-main}"
FEATURE_BRANCH="${3:-feature/import-aidesigner}"
BACKUP_BRANCH="${4:-backup/pre-aidesigner-import}"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "❌ Not inside a Git repository."
  exit 1
}

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Please commit or stash your local changes before running this script."
  exit 1
fi

git fetch origin "$BASE_BRANCH"

if ! git show-ref --verify --quiet "refs/heads/${BACKUP_BRANCH}"; then
  echo "👉 Creating safety backup branch ${BACKUP_BRANCH} from ${BASE_BRANCH}"
  git branch "${BACKUP_BRANCH}" "origin/${BASE_BRANCH}"
fi

echo "👉 Checking out ${BASE_BRANCH}"
git checkout "${BASE_BRANCH}"
git pull --ff-only origin "${BASE_BRANCH}"

if git show-ref --verify --quiet "refs/heads/${FEATURE_BRANCH}"; then
  echo "👉 Reusing existing feature branch ${FEATURE_BRANCH}"
  git checkout "${FEATURE_BRANCH}"
else
  echo "👉 Creating feature branch ${FEATURE_BRANCH}"
  git checkout -b "${FEATURE_BRANCH}"
fi

if git remote | grep -qx "${UPSTREAM_REMOTE}"; then
  echo "👉 Updating remote ${UPSTREAM_REMOTE} URL"
  git remote set-url "${UPSTREAM_REMOTE}" "${UPSTREAM_URL}"
else
  echo "👉 Adding remote ${UPSTREAM_REMOTE}"
  git remote add "${UPSTREAM_REMOTE}" "${UPSTREAM_URL}"
fi

git fetch "${UPSTREAM_REMOTE}"

DEFAULT_BRANCH="$(git remote show "${UPSTREAM_REMOTE}" | sed -n 's/.*HEAD branch: //p')"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

echo "👉 Merging ${UPSTREAM_REMOTE}/${DEFAULT_BRANCH} (allowing unrelated histories)"
git merge --allow-unrelated-histories "${UPSTREAM_REMOTE}/${DEFAULT_BRANCH}"

cat <<'EONOTE'

✅ Merge completed (or conflicts were staged). Next steps:
  1. Resolve any merge conflicts that Git reports.
  2. When satisfied, run:
       git add .
       git commit -m "Import aidesigner upstream sources"
  3. Push your branch:
       git push origin FEATURE_BRANCH
  4. Open a pull request comparing FEATURE_BRANCH with BASE_BRANCH.

EONOTE
