/**
 * Prompt template for generating a biography from raw input
 * @param {string} rawInput - The raw text to transform into a biography
 * @returns {string} The formatted prompt
 */
export function generateBiographyPrompt(rawInput) {
  return `Transform the following information into a polished, professional biography (aim for 200-400 words). Make it engaging, well-structured, and highlight key strengths and achievements:

${rawInput}

IMPORTANT:
- Return ONLY the biography text without any additional commentary
- Keep it between 200-400 words
- Make it professional and impactful
- Focus on achievements and expertise`;
}
