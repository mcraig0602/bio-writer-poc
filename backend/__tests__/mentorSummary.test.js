import { normalizeMentorSummary } from '../src/utils/mentorSummary.js';

describe('normalizeMentorSummary', () => {
  test('collapses "- -" bullets to a single hyphen', () => {
    const input = `Intro paragraph\n\n- - One\n- - Two`;
    const output = normalizeMentorSummary(input);

    expect(output).toContain('\n- One');
    expect(output).toContain('\n- Two');
    expect(output).not.toContain('\n- - ');
  });

  test('collapses "--" bullets to a single hyphen', () => {
    const input = `Intro\n-- One`;
    const output = normalizeMentorSummary(input);

    expect(output).toContain('\n- One');
    expect(output).not.toContain('\n--');
  });

  test('converts "•" bullets to hyphen bullets', () => {
    const input = `Intro\n• One`;
    const output = normalizeMentorSummary(input);

    expect(output).toContain('\n- One');
    expect(output).not.toContain('\n•');
  });
});
