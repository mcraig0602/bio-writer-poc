import {
  applyFieldUpdatesToBiography,
  buildUpdateExplanations,
  detectYesNoIntent,
  hasAnyUpdates,
  normalizeProposedFieldUpdates,
  parseFieldUpdatesJson
} from '../src/utils/fieldUpdates.js';

describe('fieldUpdates utils', () => {
  test('detectYesNoIntent recognizes yes/no', () => {
    expect(detectYesNoIntent('yes')).toBe('yes');
    expect(detectYesNoIntent('Y')).toBe('yes');
    expect(detectYesNoIntent('no')).toBe('no');
    expect(detectYesNoIntent('cancel')).toBe('no');
    expect(detectYesNoIntent('maybe')).toBe('unknown');
  });

  test('parseFieldUpdatesJson parses json and strips code fences', () => {
    const payload = {
      updates: { jobTitle: 'Senior Developer' },
      explanations: ['Set job title']
    };

    const fenced = '```json\n' + JSON.stringify(payload) + '\n```';
    const parsed = parseFieldUpdatesJson(fenced);

    expect(parsed).not.toBeNull();
    expect(parsed.updates.jobTitle).toBe('Senior Developer');
    expect(parsed.explanations).toEqual(['Set job title']);
  });

  test('normalizeProposedFieldUpdates trims strings and validates fields', () => {
    const { updates, errors } = normalizeProposedFieldUpdates({
      jobTitle: '  Senior PM  ',
      department: ' Product ',
      businessFunction: 'Product Manager',
      yearsExperience: '10',
      contactInfo: { email: 'Test@Example.com' }
    });

    expect(errors).toEqual([]);
    expect(updates.jobTitle).toBe('Senior PM');
    expect(updates.department).toBe('Product');
    expect(updates.businessFunction).toBe('Product Manager');
    expect(updates.yearsExperience).toBe(10);
    expect(updates.contactInfo.email).toBe('Test@Example.com');
  });

  test('hasAnyUpdates detects empty updates', () => {
    expect(hasAnyUpdates({})).toBe(false);
    expect(hasAnyUpdates({ contactInfo: {} })).toBe(false);
    expect(hasAnyUpdates({ location: 'Austin' })).toBe(true);
    expect(hasAnyUpdates({ contactInfo: { email: 'a@b.com' } })).toBe(true);
  });

  test('buildUpdateExplanations builds bullets', () => {
    const lines = buildUpdateExplanations({
      jobTitle: 'Senior Engineer',
      contactInfo: { email: 'a@b.com' },
      yearsExperience: 7
    });

    expect(lines.some((l) => l.includes('Set job title'))).toBe(true);
    expect(lines.some((l) => l.includes('Set email'))).toBe(true);
    expect(lines.some((l) => l.includes('Set years of experience'))).toBe(true);
  });

  test('applyFieldUpdatesToBiography applies updates onto doc-like object', () => {
    const bio = {
      jobTitle: 'Old',
      contactInfo: { email: 'old@b.com' }
    };

    applyFieldUpdatesToBiography(bio, {
      jobTitle: 'New',
      contactInfo: { phone: '1234567890' }
    });

    expect(bio.jobTitle).toBe('New');
    expect(bio.contactInfo.email).toBe('old@b.com');
    expect(bio.contactInfo.phone).toBe('1234567890');
  });
});
