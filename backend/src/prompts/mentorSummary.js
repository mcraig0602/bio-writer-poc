/**
 * Prompt template for generating a mentoring-focused summary from structured context
 * @returns {string} The formatted prompt
 */
import { assemblePrompt } from './promptBuilder.js';

/**
 * @param {object} params
 * @param {string} params.rawInput
 * @param {string} [params.system]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function generateMentorSummaryPrompt({ rawInput, system, includeSystemInPrompt = true }) {
  return assemblePrompt({
    system,
    includeSystemInPrompt,
    task: 'Write a concise mentor-oriented summary of the profile based only on the provided context.',
    dataSections: [
      { title: 'PROFILE_CONTEXT', content: rawInput }
    ],
    outputRules: [
      'Return ONLY plain text.',
      'Format: 2–4 sentence intro paragraph, then 3–6 bullets each starting with a single "- ".',
      'Do not invent details not supported by the context.'
    ].join('\n')
  });
}
