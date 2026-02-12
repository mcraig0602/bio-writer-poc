import { validateBusinessFunction, validateContactInfo } from './validators.js';

function safeTrim(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseFieldUpdatesJson(text) {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();

  // Be tolerant of accidental code fences.
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(withoutFences);
    if (!isPlainObject(parsed)) return null;

    const updates = isPlainObject(parsed.updates) ? parsed.updates : {};
    const explanations = Array.isArray(parsed.explanations)
      ? parsed.explanations.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean)
      : [];

    return { updates, explanations };
  } catch {
    return null;
  }
}

export function normalizeProposedFieldUpdates(rawUpdates) {
  if (!isPlainObject(rawUpdates)) {
    return { updates: {}, errors: [] };
  }

  const errors = [];
  const updates = {};

  const jobTitle = safeTrim(rawUpdates.jobTitle);
  if (jobTitle !== undefined) updates.jobTitle = jobTitle;

  const department = safeTrim(rawUpdates.department);
  if (department !== undefined) updates.department = department;

  const location = safeTrim(rawUpdates.location);
  if (location !== undefined) updates.location = location;

  if (rawUpdates.yearsExperience !== undefined && rawUpdates.yearsExperience !== null) {
    const years = Number(rawUpdates.yearsExperience);
    if (Number.isFinite(years) && years >= 0) {
      updates.yearsExperience = years;
    } else {
      errors.push('Invalid yearsExperience');
    }
  }

  const businessFunction = safeTrim(rawUpdates.businessFunction);
  const businessFunctionOther = safeTrim(rawUpdates.businessFunctionOther);

  if (businessFunction !== undefined) {
    const result = validateBusinessFunction(businessFunction, businessFunctionOther);
    if (result.valid) {
      updates.businessFunction = businessFunction;
      if (businessFunction === 'Other' && businessFunctionOther) {
        updates.businessFunctionOther = businessFunctionOther;
      }
      if (businessFunction !== 'Other') {
        updates.businessFunctionOther = undefined;
      }
    } else {
      errors.push(result.error || 'Invalid businessFunction');
    }
  }

  if (rawUpdates.contactInfo !== undefined) {
    if (isPlainObject(rawUpdates.contactInfo)) {
      const candidate = {
        email: safeTrim(rawUpdates.contactInfo.email),
        phone: safeTrim(rawUpdates.contactInfo.phone),
        linkedin: safeTrim(rawUpdates.contactInfo.linkedin)
      };

      // Remove undefined keys so validation doesn't see empty values.
      Object.keys(candidate).forEach((key) => {
        if (candidate[key] === undefined) delete candidate[key];
      });

      const result = validateContactInfo(candidate);
      if (result.valid) {
        if (Object.keys(candidate).length > 0) {
          updates.contactInfo = candidate;
        }
      } else {
        errors.push('Invalid contactInfo');
      }
    } else {
      errors.push('Invalid contactInfo');
    }
  }

  // Strip any undefined values (e.g., businessFunctionOther clearing)
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  return { updates, errors };
}

export function hasAnyUpdates(updates) {
  if (!isPlainObject(updates)) return false;
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;

  // If the only key is contactInfo but it's empty, treat as none.
  if (keys.length === 1 && keys[0] === 'contactInfo') {
    return isPlainObject(updates.contactInfo) && Object.keys(updates.contactInfo).length > 0;
  }

  return true;
}

export function buildUpdateExplanations(updates) {
  if (!isPlainObject(updates)) return [];

  const lines = [];
  if (updates.jobTitle !== undefined) lines.push(`Set job title to: ${updates.jobTitle}`);
  if (updates.department !== undefined) lines.push(`Set department to: ${updates.department}`);
  if (updates.businessFunction !== undefined) {
    const suffix = updates.businessFunction === 'Other' && updates.businessFunctionOther
      ? ` (Other: ${updates.businessFunctionOther})`
      : '';
    lines.push(`Set business function to: ${updates.businessFunction}${suffix}`);
  }
  if (updates.location !== undefined) lines.push(`Set location to: ${updates.location}`);
  if (updates.yearsExperience !== undefined) lines.push(`Set years of experience to: ${updates.yearsExperience}`);

  if (isPlainObject(updates.contactInfo)) {
    if (updates.contactInfo.email !== undefined) lines.push(`Set email to: ${updates.contactInfo.email}`);
    if (updates.contactInfo.phone !== undefined) lines.push(`Set phone to: ${updates.contactInfo.phone}`);
    if (updates.contactInfo.linkedin !== undefined) lines.push(`Set LinkedIn to: ${updates.contactInfo.linkedin}`);
  }

  return lines;
}

export function detectYesNoIntent(message) {
  if (!message || typeof message !== 'string') return 'unknown';
  const text = message.trim().toLowerCase();

  if (['yes', 'y', 'yep', 'yeah', 'apply', 'confirm', 'ok', 'okay', 'sure', 'do it'].includes(text)) {
    return 'yes';
  }

  if (['no', 'n', 'nope', 'cancel', 'stop', 'don\'t', 'dont', 'discard'].includes(text)) {
    return 'no';
  }

  return 'unknown';
}

export function applyFieldUpdatesToBiography(biographyDoc, updates) {
  if (!biographyDoc || !isPlainObject(updates)) return;

  if (updates.jobTitle !== undefined) biographyDoc.jobTitle = updates.jobTitle;
  if (updates.department !== undefined) biographyDoc.department = updates.department;
  if (updates.businessFunction !== undefined) biographyDoc.businessFunction = updates.businessFunction;
  if (updates.businessFunctionOther !== undefined) biographyDoc.businessFunctionOther = updates.businessFunctionOther;
  if (updates.location !== undefined) biographyDoc.location = updates.location;
  if (updates.yearsExperience !== undefined) biographyDoc.yearsExperience = updates.yearsExperience;

  if (isPlainObject(updates.contactInfo)) {
    const existing = biographyDoc.contactInfo?.toObject?.() ?? biographyDoc.contactInfo ?? {};
    biographyDoc.contactInfo = {
      ...existing,
      ...updates.contactInfo
    };
  }
}
