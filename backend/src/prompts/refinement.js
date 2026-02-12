/**
 * Prompt template for refining a biography based on user feedback
 * @param {string} currentBiography - The current biography text
 * @param {string} userMessage - The user's refinement request
 * @param {string} conversationContext - The formatted conversation history
 * @returns {string} The formatted prompt
 */
export function refineBiographyPrompt(currentBiography, userMessage, conversationContext) {
  return `You are helping refine a professional biography. The biography text is provided below.

CURRENT BIOGRAPHY:
${currentBiography}

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n` : ''}
USER REQUEST: ${userMessage}

INSTRUCTIONS:
- You MUST update the biography text based on the user's request
- The biography text is provided above - use it as your starting point
- Return ONLY the updated biography text
- Do NOT ask for the biography or say you need more information
- Do NOT add commentary, explanations, or meta-text
- Keep the biography professional and polished
- Make the specific changes the user requested

Updated biography:`;
}
