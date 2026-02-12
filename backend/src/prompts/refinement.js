/**
 * Prompt template for refining a biography based on user feedback
 * @returns {string} The formatted prompt
 */
import { assemblePrompt } from './promptBuilder.js';

/**
 * @param {object} params
 * @param {string} params.currentBiography
 * @param {string} params.userMessage
 * @param {string} params.conversationContext
 * @param {string} [params.system]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function refineBiographyPrompt({
  currentBiography,
  userMessage,
  conversationContext,
  system,
  includeSystemInPrompt = true
}) {
  const dataSections = [
    { title: 'CURRENT_BIOGRAPHY', content: currentBiography }
  ];

  if (conversationContext) {
    dataSections.push({ title: 'PREVIOUS_CONVERSATION', content: conversationContext });
  }

  dataSections.push({ title: 'USER_REQUEST', content: userMessage });

  return assemblePrompt({
    system,
    includeSystemInPrompt,
    task: 'Update the biography text to satisfy the user request. Use the current biography as the starting point.',
    dataSections,
    outputRules: 'Return ONLY the updated biography text (plain text). No commentary.'
  });
}
