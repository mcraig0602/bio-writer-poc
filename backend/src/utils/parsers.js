/**
 * Utility functions for parsing and formatting data
 */

/**
 * Parse keywords from comma-separated response
 * @param {string} response - The raw response containing comma-separated keywords
 * @returns {string[]} Array of cleaned keywords
 */
export function parseKeywords(response) {
  return response
    .trim()
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
}

/**
 * Build conversation context from message history
 * @param {Array} conversationHistory - Array of message objects with role and content
 * @returns {string} Formatted conversation context
 */
export function buildConversationContext(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return '';
  }

  return conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

/**
 * Validate and sanitize tags array
 * @param {string[]} tags - Array of tags to validate
 * @returns {{valid: boolean, sanitized: string[], errors: string[]}} Validation result
 */
export function validateTags(tags) {
  const errors = [];
  
  if (!Array.isArray(tags)) {
    return { valid: false, sanitized: [], errors: ['Tags must be an array'] };
  }

  // Sanitize: trim, filter empty, remove duplicates
  const sanitized = [...new Set(
    tags
      .map(tag => typeof tag === 'string' ? tag.trim() : '')
      .filter(tag => tag.length > 0)
  )];

  // Validate count
  if (sanitized.length === 0) {
    errors.push('At least one tag is required');
  }

  if (sanitized.length > 20) {
    errors.push('Maximum 20 tags allowed');
  }

  // Validate individual tags
  sanitized.forEach(tag => {
    if (tag.length > 50) {
      errors.push(`Tag "${tag}" exceeds 50 characters`);
    }
  });

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}
