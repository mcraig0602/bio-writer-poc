/**
 * Prompt template for extracting keywords from text
 * Focuses on extracting skills, talents, and relevant experience
 * @returns {string} The formatted prompt
 */
import { assemblePrompt } from './promptBuilder.js';

/**
 * @param {object} params
 * @param {string} params.text
 * @param {string} [params.system]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function extractKeywordsPrompt({ text, system, includeSystemInPrompt = true }) {
  return assemblePrompt({
    system,
    includeSystemInPrompt,
    task: [
      'Extract 5–10 keywords representing skills, tools, technologies, and domain expertise from the text.',
      'Prefer concrete capabilities over generic descriptors. Avoid company names, locations, and dates.'
    ].join('\n'),
    dataSections: [
      { title: 'TEXT', content: text }
    ],
    outputRules: [
      'Return ONLY valid JSON in this shape:',
      '{"keywords":["...","..."]}',
      'Rules: 5–10 items, unique, each item is a short string.'
    ].join('\n')
  });
}
