import ollamaService from '../src/services/ollama.js';

describe('OllamaService', () => {
  test('should have generateBiography method', () => {
    expect(typeof ollamaService.generateBiography).toBe('function');
  });

  test('should have extractKeywords method', () => {
    expect(typeof ollamaService.extractKeywords).toBe('function');
  });

  test('should have refineBiography method', () => {
    expect(typeof ollamaService.refineBiography).toBe('function');
  });

  test('should have proposeBiographyFieldUpdates method', () => {
    expect(typeof ollamaService.proposeBiographyFieldUpdates).toBe('function');
  });

  test('should have generateMentorSummary method', () => {
    expect(typeof ollamaService.generateMentorSummary).toBe('function');
  });
});
