import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TagsDisplay from '../src/components/TagsDisplay';

describe('TagsDisplay', () => {
  it('renders tags correctly', () => {
    const tags = ['JavaScript', 'React', 'Node.js'];
    render(<TagsDisplay tags={tags} />);

    expect(screen.getByText('JavaScript')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
    expect(screen.getByText('Node.js')).toBeDefined();
  });

  it('shows message when no tags', () => {
    render(<TagsDisplay tags={[]} />);
    expect(screen.getByText('No skills yet')).toBeDefined();
  });
});
