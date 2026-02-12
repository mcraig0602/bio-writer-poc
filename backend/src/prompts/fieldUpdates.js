/**
 * Prompt template for extracting structured Biography field updates from a user chat message.
 * The model must return ONLY JSON.
 */

const ALLOWED_BUSINESS_FUNCTIONS = [
  'Developer',
  'UI/UX',
  'Product Specialist',
  'Product Manager',
  'Other'
];

/**
 * @param {object} params
 * @param {object} params.currentFields
 * @param {string} params.userMessage
 */
export function proposeFieldUpdatesPrompt({ currentFields, userMessage }) {
  const safeCurrent = {
    jobTitle: currentFields?.jobTitle ?? '',
    department: currentFields?.department ?? '',
    businessFunction: currentFields?.businessFunction ?? '',
    businessFunctionOther: currentFields?.businessFunctionOther ?? '',
    location: currentFields?.location ?? '',
    yearsExperience: currentFields?.yearsExperience ?? null,
    contactInfo: {
      email: currentFields?.contactInfo?.email ?? '',
      phone: currentFields?.contactInfo?.phone ?? '',
      linkedin: currentFields?.contactInfo?.linkedin ?? ''
    }
  };

  return `You are extracting structured profile updates for a biography editor.

CURRENT FIELDS (truth):
${JSON.stringify(safeCurrent, null, 2)}

USER MESSAGE:
${userMessage}

TASK:
- Identify any explicit updates the user is asking to apply to these fields.
- Only include updates that are clearly stated in the USER MESSAGE.
- Do NOT invent or infer missing values.
- If the user did not request changes to these fields, return an empty updates object.

ALLOWED FIELDS:
- jobTitle (string)
- department (string)
- businessFunction (must be one of: ${ALLOWED_BUSINESS_FUNCTIONS.join(', ')})
- businessFunctionOther (string; only when businessFunction is "Other")
- location (string)
- yearsExperience (number)
- contactInfo.email (string)
- contactInfo.phone (string)
- contactInfo.linkedin (string)

OUTPUT FORMAT:
Return ONLY valid JSON with this shape:
{
  "updates": { /* only include fields that should change */ },
  "explanations": [ /* short bullets describing what would change */ ]
}

If there are no updates:
{"updates":{},"explanations":[]}`;
}
