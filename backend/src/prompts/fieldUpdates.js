/**
 * Prompt template for extracting structured Biography field updates from a user chat message.
 * The model must return ONLY JSON.
 */

import { assemblePrompt } from './promptBuilder.js';

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
 * @param {string} [params.system]
 * @param {boolean} [params.includeSystemInPrompt]
 */
export function proposeFieldUpdatesPrompt({ currentFields, userMessage, system, includeSystemInPrompt = true }) {
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

  const allowedFields = [
    'jobTitle (string)',
    'department (string)',
    `businessFunction (one of: ${ALLOWED_BUSINESS_FUNCTIONS.join(', ')})`,
    'businessFunctionOther (string; only when businessFunction is "Other")',
    'location (string)',
    'yearsExperience (number)',
    'contactInfo.email (string)',
    'contactInfo.phone (string)',
    'contactInfo.linkedin (string)'
  ].join('\n');

  return assemblePrompt({
    system,
    includeSystemInPrompt,
    task: [
      'Identify explicit profile field updates requested in the user message.',
      'Only include changes clearly stated. Do not infer missing values.',
      'If there are no requested changes, return empty updates.'
    ].join('\n'),
    dataSections: [
      { title: 'CURRENT_FIELDS_TRUTH', content: JSON.stringify(safeCurrent, null, 2) },
      { title: 'USER_MESSAGE', content: userMessage },
      { title: 'ALLOWED_FIELDS', content: allowedFields }
    ],
    outputRules: [
      'Return ONLY valid JSON with this shape:',
      '{"updates":{ },"explanations":[ ]}',
      'If there are no updates, return: {"updates":{},"explanations":[]}'
    ].join('\n')
  });
}
