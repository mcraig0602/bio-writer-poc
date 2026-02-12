function stripCodeFences(text) {
  return String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function tryParse(candidate) {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function extractJsonSubstring(text) {
  const str = String(text);

  const firstObj = str.indexOf('{');
  const lastObj = str.lastIndexOf('}');
  const firstArr = str.indexOf('[');
  const lastArr = str.lastIndexOf(']');

  const objCandidate = firstObj !== -1 && lastObj !== -1 && lastObj > firstObj
    ? str.slice(firstObj, lastObj + 1)
    : null;

  const arrCandidate = firstArr !== -1 && lastArr !== -1 && lastArr > firstArr
    ? str.slice(firstArr, lastArr + 1)
    : null;

  // Prefer objects (our structured responses are typically objects).
  return objCandidate || arrCandidate;
}

/**
 * Tolerant JSON parser for LLM responses.
 * - Accepts accidental code fences
 * - Attempts to extract the first object/array substring if extra text is present
 */
export function parseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const trimmed = stripCodeFences(text);
  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  const substring = extractJsonSubstring(trimmed);
  if (!substring) return null;

  return tryParse(substring);
}
