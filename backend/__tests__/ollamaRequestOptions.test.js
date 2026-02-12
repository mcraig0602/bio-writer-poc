import { jest } from '@jest/globals';

describe('OllamaService request options mapping', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };

    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_MAX_TOKENS;
    delete process.env.AI_TIMEOUT_MS;
    delete process.env.AI_MAX_RETRIES;

    delete process.env.OLLAMA_URL;
    delete process.env.OLLAMA_MODEL;

    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('default call does not include options or axios timeout', async () => {
    process.env.OLLAMA_URL = 'http://ollama.local:11434';
    process.env.OLLAMA_MODEL = 'llama3.1';

    const post = jest.fn().mockResolvedValue({
      data: {
        response: 'Hello world',
        eval_count: 10,
        prompt_eval_count: 3,
      },
    });

    jest.unstable_mockModule('axios', () => ({
      default: { post },
    }));

    const { default: ollamaService } = await import('../src/services/ollama.js');

    const result = await ollamaService.generateBiography('raw input');
    expect(result).toBe('Hello world');

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];

    expect(url).toBe('http://ollama.local:11434/api/generate');
    expect(body).toEqual({
      model: 'llama3.1',
      prompt: expect.any(String),
      stream: false,
    });
    expect(config).toBeUndefined();
  });

  test('AI_* settings map to Ollama options + axios timeout', async () => {
    process.env.AI_BASE_URL = 'http://ai.local:11434';
    process.env.AI_MODEL = 'llama3.1';
    process.env.AI_TEMPERATURE = '0.7';
    process.env.AI_MAX_TOKENS = '123';
    process.env.AI_TIMEOUT_MS = '5000';

    const post = jest.fn().mockResolvedValue({
      data: {
        response: 'Ok',
      },
    });

    jest.unstable_mockModule('axios', () => ({
      default: { post },
    }));

    const { default: ollamaService } = await import('../src/services/ollama.js');

    const result = await ollamaService.generateBiography('raw input');
    expect(result).toBe('Ok');

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];

    expect(url).toBe('http://ai.local:11434/api/generate');
    expect(body).toEqual({
      model: 'llama3.1',
      prompt: expect.any(String),
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 123,
      },
    });
    expect(config).toEqual({ timeout: 5000 });
  });
});
