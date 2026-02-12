import { getAIConfig } from '../src/config/ai.js';

describe('getAIConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };

    // Ensure a clean state for each test
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_MAX_TOKENS;
    delete process.env.AI_TIMEOUT_MS;
    delete process.env.AI_MAX_RETRIES;
    delete process.env.AI_RETRY_INITIAL_DELAY_MS;
    delete process.env.AI_RETRY_BACKOFF_MULTIPLIER;

    delete process.env.OLLAMA_URL;
    delete process.env.OLLAMA_MODEL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses OLLAMA_* values when AI_* values are not set', () => {
    process.env.OLLAMA_URL = 'http://example-ollama:11434';
    process.env.OLLAMA_MODEL = 'llama3.1';

    const config = getAIConfig({ reload: true });
    expect(config.provider).toBe('ollama');
    expect(config.baseUrl).toBe('http://example-ollama:11434');
    expect(config.model).toBe('llama3.1');
  });

  test('AI_* values override OLLAMA_* values', () => {
    process.env.OLLAMA_URL = 'http://example-ollama:11434';
    process.env.OLLAMA_MODEL = 'llama3.1';

    process.env.AI_BASE_URL = 'http://example-ai:9999';
    process.env.AI_MODEL = 'future-model';

    const config = getAIConfig({ reload: true });
    expect(config.baseUrl).toBe('http://example-ai:9999');
    expect(config.model).toBe('future-model');
  });

  test('fails fast on invalid AI_TEMPERATURE when any AI_* var is set', () => {
    process.env.AI_MODEL = 'llama3.1';
    process.env.AI_TEMPERATURE = '3';

    expect(() => getAIConfig({ reload: true })).toThrow(/AI_TEMPERATURE/);
  });

  test('fails fast on invalid AI_BASE_URL when any AI_* var is set', () => {
    process.env.AI_MODEL = 'llama3.1';
    process.env.AI_BASE_URL = 'not-a-url';

    expect(() => getAIConfig({ reload: true })).toThrow(/AI_BASE_URL/);
  });
});
