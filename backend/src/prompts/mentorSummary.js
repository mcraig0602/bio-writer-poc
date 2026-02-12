/**
 * Prompt template for generating a mentoring-focused summary from structured context
 * @param {string} rawInput - The structured context used to generate the biography
 * @returns {string} The formatted prompt
 */
export function generateMentorSummaryPrompt(rawInput) {
  return `You are helping draft a mentor-oriented summary of a professional profile.

Given the profile context below, write a concise mentor summary that helps someone understand how this person can mentor others.

CONTEXT:
${rawInput}

OUTPUT FORMAT (plain text only):
- Start with a short intro paragraph (2-4 sentences).
- Then include 3-6 bullet points. Each bullet must start with a SINGLE "- ".
  - Do NOT start bullets with "- -" or "--".

CONTENT GUIDELINES:
- Focus on coaching strengths, areas of expertise, mentoring style, and what a mentee can expect.
- Keep it professional and specific to the context.
- Do not invent personal details that are not supported by the context.

IMPORTANT:
- Return ONLY the mentor summary text. No headings, no extra commentary.`;
}
