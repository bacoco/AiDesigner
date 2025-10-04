function normalizeConfigTarget(value) {
  if (!value) {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === 'bmad') {
    return 'agilai';
  }

  return normalized;
}

module.exports = {
  normalizeConfigTarget,
};
