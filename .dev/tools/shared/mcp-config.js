/**
 * Normalizes MCP config target names, mapping legacy aliases to current values.
 * @param {string|undefined|null} value - The config target value to normalize
 * @returns {string|undefined|null} The normalized config target ('aidesigner' if 'bmad', otherwise lowercase)
 * @example
 * normalizeConfigTarget('bmad') // returns 'aidesigner'
 * normalizeConfigTarget('CLAUDE') // returns 'claude'
 * normalizeConfigTarget(null) // returns null
 */
function normalizeConfigTarget(value) {
  if (!value) {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === 'bmad') {
    return 'aidesigner';
  }

  return normalized;
}

module.exports = {
  normalizeConfigTarget,
};
