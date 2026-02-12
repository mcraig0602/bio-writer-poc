const DEFAULTS = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.1',
  // Keep retries disabled by default to preserve current behavior
  maxRetries: 0,
  retryInitialDelayMs: 250,
  retryBackoffMultiplier: 2,
};

let cachedConfig = null;

function hasAnyAIEnv() {
  return Object.keys(process.env).some((key) => key.startsWith('AI_'));
}

function optionalString(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalInt(name, value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const str = optionalString(value);
  if (str === undefined) return undefined;

  const parsed = Number.parseInt(str, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseOptionalFloat(name, value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const str = optionalString(value);
  if (str === undefined) return undefined;

  const parsed = Number.parseFloat(str);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseOptionalUrl(name, value) {
  const str = optionalString(value);
  if (str === undefined) return undefined;

  try {
    // eslint-disable-next-line no-new
    new URL(str);
    return str;
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

function parseOptionalBoolean(name, value) {
  const str = optionalString(value);
  if (str === undefined) return undefined;

  const normalized = str.toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;

  throw new Error(`${name} must be a boolean (true/false)`);
}

function resolveBaseUrl() {
  // OpenAI-style config takes precedence
  const aiBaseUrl = parseOptionalUrl('AI_BASE_URL', process.env.AI_BASE_URL);
  if (aiBaseUrl) return aiBaseUrl;

  // Backwards-compatible Ollama vars
  const ollamaUrl = parseOptionalUrl('OLLAMA_URL', process.env.OLLAMA_URL);
  if (ollamaUrl) return ollamaUrl;

  return DEFAULTS.baseUrl;
}

function resolveModel() {
  const aiModel = optionalString(process.env.AI_MODEL);
  if (aiModel) return aiModel;

  const ollamaModel = optionalString(process.env.OLLAMA_MODEL);
  if (ollamaModel) return ollamaModel;

  return DEFAULTS.model;
}

export function getAIConfig({ reload = false } = {}) {
  if (cachedConfig && !reload) {
    return cachedConfig;
  }

  // If any AI_* vars are present, we validate them strictly (fail fast).
  // We also validate the resolved baseUrl/model regardless, so invalid values
  // are caught early when explicitly provided.
  const strict = hasAnyAIEnv();

  const baseUrl = resolveBaseUrl();
  const model = resolveModel();

  const apiKey = optionalString(process.env.AI_API_KEY);

  const temperature = parseOptionalFloat('AI_TEMPERATURE', process.env.AI_TEMPERATURE, { min: 0, max: 2 });
  const maxTokens = parseOptionalInt('AI_MAX_TOKENS', process.env.AI_MAX_TOKENS, { min: 1, max: 1000000 });

  const timeoutMs = parseOptionalInt('AI_TIMEOUT_MS', process.env.AI_TIMEOUT_MS, { min: 1, max: 600000 });

  const maxRetries = parseOptionalInt('AI_MAX_RETRIES', process.env.AI_MAX_RETRIES, { min: 0, max: 20 });
  const retryInitialDelayMs = parseOptionalInt(
    'AI_RETRY_INITIAL_DELAY_MS',
    process.env.AI_RETRY_INITIAL_DELAY_MS,
    { min: 0, max: 600000 }
  );
  const retryBackoffMultiplier = parseOptionalFloat(
    'AI_RETRY_BACKOFF_MULTIPLIER',
    process.env.AI_RETRY_BACKOFF_MULTIPLIER,
    { min: 1, max: 10 }
  );

  const useOllamaSystem = parseOptionalBoolean('AI_USE_OLLAMA_SYSTEM', process.env.AI_USE_OLLAMA_SYSTEM);
  const useOllamaJsonFormat = parseOptionalBoolean(
    'AI_USE_OLLAMA_JSON_FORMAT',
    process.env.AI_USE_OLLAMA_JSON_FORMAT
  );

  if (strict) {
    // Temperature/max tokens etc are already validated above.
    // Enforce that API key is not accidentally set to an empty value.
    if (process.env.AI_API_KEY !== undefined && apiKey === undefined) {
      throw new Error('AI_API_KEY is set but empty');
    }
  }

  cachedConfig = {
    provider: 'ollama',
    baseUrl,
    model,
    apiKey,
    features: {
      useOllamaSystem: useOllamaSystem ?? false,
      useOllamaJsonFormat: useOllamaJsonFormat ?? false,
    },
    generation: {
      temperature,
      maxTokens,
    },
    http: {
      timeoutMs,
    },
    retry: {
      maxRetries: maxRetries ?? DEFAULTS.maxRetries,
      initialDelayMs: retryInitialDelayMs ?? DEFAULTS.retryInitialDelayMs,
      backoffMultiplier: retryBackoffMultiplier ?? DEFAULTS.retryBackoffMultiplier,
    },
  };

  return cachedConfig;
}
