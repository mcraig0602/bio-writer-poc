export function normalizeMentorSummary(text) {
  const raw = typeof text === 'string' ? text : '';
  if (!raw.trim()) return raw;

  const normalized = raw
    .split('\n')
    .map((line) => {
      // Collapse accidental double-hyphen markdown bullets like "- - item" into "- item".
      let updated = line.replace(/^\s*-\s*-\s*/, '- ');
      // Also accept "-- item".
      updated = updated.replace(/^\s*--\s*/, '- ');
      // Convert bullet dots to standard hyphen bullets.
      updated = updated.replace(/^\s*•\s*/, '- ');
      return updated;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized;
}
