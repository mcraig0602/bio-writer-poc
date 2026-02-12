/**
 * Prompt template for generating a biography from raw input
 * Keep persona/system separate from data where possible.
 * @returns {string} The formatted prompt
 */
import { assemblePrompt } from './promptBuilder.js';

/**
 * @param {object} params
 * @param {string} params.rawInput
 * @param {string} [params.system]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function generateBiographyPrompt({ rawInput, system, includeSystemInPrompt = true }) {
  return assemblePrompt({
    system,
    includeSystemInPrompt,
    task: 'Write a polished, professional biography (200–400 words) using only the provided input. Emphasize achievements and expertise.',
    dataSections: [
      { title: 'RAW_INPUT', content: rawInput }
    ],
    outputRules: 'Return ONLY the biography text (plain text). No headings, no commentary.'
  });
}
