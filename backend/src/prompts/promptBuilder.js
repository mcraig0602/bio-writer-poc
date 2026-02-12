function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function pushSection(parts, title, body) {
  const content = clean(body);
  if (!content) return;
  parts.push(`### ${title}\n${content}`);
}

/**
 * Assemble a single prompt string from separate blocks.
 *
 * Keep persona/system separate from data where possible. If the caller is using
 * Ollama's request-body `system` field, set includeSystemInPrompt=false.
 *
 * @param {object} params
 * @param {string} [params.system]
 * @param {string} [params.task]
 * @param {Array<{title: string, content: string}>} [params.dataSections]
 * @param {string} [params.outputRules]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function assemblePrompt({
  system,
  task,
  dataSections = [],
  outputRules,
  includeSystemInPrompt = true
}) {
  const parts = [];

  if (includeSystemInPrompt) {
    pushSection(parts, 'SYSTEM', system);
  }

  pushSection(parts, 'TASK', task);

  if (Array.isArray(dataSections)) {
    dataSections.forEach((section) => {
      if (!section) return;
      const title = clean(section.title);
      const content = clean(section.content);
      if (!title || !content) return;
      pushSection(parts, `DATA: ${title}`, content);
    });
  }

  pushSection(parts, 'OUTPUT', outputRules);

  return parts.join('\n\n').trim();
}
