import axios from 'axios';
import tracingService from './tracing.js';
import logger from '../config/logging.js';
import { getAIConfig } from '../config/ai.js';
import { generateBiographyPrompt } from '../prompts/biography.js';
import { generateMentorSummaryPrompt } from '../prompts/mentorSummary.js';
import { extractKeywordsPrompt } from '../prompts/keywords.js';
import { refineBiographyPrompt } from '../prompts/refinement.js';
import { proposeFieldUpdatesPrompt } from '../prompts/fieldUpdates.js';
import { parseKeywords, buildConversationContext } from '../utils/parsers.js';
import { isValidBiographyText } from '../utils/validators.js';
import { normalizeMentorSummary } from '../utils/mentorSummary.js';

const OLLAMA_GENERATE_ENDPOINT = '/api/generate';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function joinUrl(baseUrl, path) {
  const trimmedBase = String(baseUrl).replace(/\/$/, '');
  const trimmedPath = String(path).startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function buildOllamaGenerateBody({ model, prompt, temperature, maxTokens }) {
  const body = {
    model,
    prompt,
    stream: false,
  };

  const options = {};
  if (temperature !== undefined) {
    options.temperature = temperature;
  }

  // OpenAI-style max tokens mapped to Ollama's num_predict
  if (maxTokens !== undefined) {
    options.num_predict = maxTokens;
  }

  if (Object.keys(options).length > 0) {
    body.options = options;
  }

  return body;
}

function shouldRetryError(error) {
  if (!error) return false;
  if (!error.response) return true;

  const status = error.response.status;
  return status >= 500;
}

async function postWithRetry(url, body, axiosConfig, retryConfig) {
  const maxRetries = retryConfig?.maxRetries ?? 0;
  const initialDelayMs = retryConfig?.initialDelayMs ?? 250;
  const backoffMultiplier = retryConfig?.backoffMultiplier ?? 2;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (axiosConfig && Object.keys(axiosConfig).length > 0) {
        return await axios.post(url, body, axiosConfig);
      }
      return await axios.post(url, body);
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetryError(error)) {
        throw error;
      }

      attempt += 1;
      const delayMs = Math.round(initialDelayMs * Math.pow(backoffMultiplier, attempt - 1));
      await sleep(delayMs);
    }
  }
}

class OllamaService {
  async generateBiography(rawInput) {
    const aiConfig = getAIConfig();
    const url = joinUrl(aiConfig.baseUrl, OLLAMA_GENERATE_ENDPOINT);

    const span = tracingService.startSpan('ollama.generateBiography', {
      inputLength: rawInput.length,
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpoint: OLLAMA_GENERATE_ENDPOINT,
      model: aiConfig.model,
      temperature: aiConfig.generation.temperature,
      maxTokens: aiConfig.generation.maxTokens,
      timeoutMs: aiConfig.http.timeoutMs,
      maxRetries: aiConfig.retry.maxRetries
    });

    try {
      const prompt = generateBiographyPrompt(rawInput);
      
      logger.debug('Generating biography with LLM', {
        model: aiConfig.model,
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...',
        inputLength: rawInput.length
      });

      const body = buildOllamaGenerateBody({
        model: aiConfig.model,
        prompt,
        temperature: aiConfig.generation.temperature,
        maxTokens: aiConfig.generation.maxTokens
      });

      const axiosConfig = {};
      if (aiConfig.http.timeoutMs !== undefined) {
        axiosConfig.timeout = aiConfig.http.timeoutMs;
      }

      const response = await postWithRetry(url, body, axiosConfig, aiConfig.retry);

      const biography = response.data.response.trim();
      
      logger.info('Biography generated successfully', {
        model: aiConfig.model,
        outputLength: biography.length,
        tokensUsed: response.data.eval_count || null,
        promptTokens: response.data.prompt_eval_count || null,
        outputPreview: biography.substring(0, 150) + '...'
      });

      await tracingService.endSpan(span, {
        outputLength: biography.length,
        tokensUsed: response.data.eval_count || null
      });

      return biography;
    } catch (error) {
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      };
      logger.error('Error generating biography:', errorInfo);
      await tracingService.endSpan(span, null, error);
      throw new Error('Failed to generate biography from Ollama');
    }
  }

  async generateMentorSummary(rawInput) {
    const aiConfig = getAIConfig();
    const url = joinUrl(aiConfig.baseUrl, OLLAMA_GENERATE_ENDPOINT);

    const span = tracingService.startSpan('ollama.generateMentorSummary', {
      inputLength: rawInput.length,
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpoint: OLLAMA_GENERATE_ENDPOINT,
      model: aiConfig.model,
      temperature: aiConfig.generation.temperature,
      maxTokens: aiConfig.generation.maxTokens,
      timeoutMs: aiConfig.http.timeoutMs,
      maxRetries: aiConfig.retry.maxRetries
    });

    try {
      const prompt = generateMentorSummaryPrompt(rawInput);

      logger.debug('Generating mentor summary with LLM', {
        model: aiConfig.model,
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...',
        inputLength: rawInput.length
      });

      const body = buildOllamaGenerateBody({
        model: aiConfig.model,
        prompt,
        temperature: aiConfig.generation.temperature,
        maxTokens: aiConfig.generation.maxTokens
      });

      const axiosConfig = {};
      if (aiConfig.http.timeoutMs !== undefined) {
        axiosConfig.timeout = aiConfig.http.timeoutMs;
      }

      const response = await postWithRetry(url, body, axiosConfig, aiConfig.retry);

      const mentorSummary = normalizeMentorSummary(response.data.response);

      logger.info('Mentor summary generated successfully', {
        model: aiConfig.model,
        outputLength: mentorSummary.length,
        tokensUsed: response.data.eval_count || null,
        promptTokens: response.data.prompt_eval_count || null,
        outputPreview: mentorSummary.substring(0, 150) + '...'
      });

      await tracingService.endSpan(span, {
        outputLength: mentorSummary.length,
        tokensUsed: response.data.eval_count || null
      });

      return mentorSummary;
    } catch (error) {
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      };
      logger.error('Error generating mentor summary:', errorInfo);
      await tracingService.endSpan(span, null, error);
      throw new Error('Failed to generate mentor summary from Ollama');
    }
  }

  async extractKeywords(text) {
    const aiConfig = getAIConfig();
    const url = joinUrl(aiConfig.baseUrl, OLLAMA_GENERATE_ENDPOINT);

    const span = tracingService.startSpan('ollama.extractKeywords', {
      inputLength: text.length,
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpoint: OLLAMA_GENERATE_ENDPOINT,
      model: aiConfig.model,
      temperature: aiConfig.generation.temperature,
      maxTokens: aiConfig.generation.maxTokens,
      timeoutMs: aiConfig.http.timeoutMs,
      maxRetries: aiConfig.retry.maxRetries
    });

    try {
      // TODO: Consider using Hugging Face Transformers library for more advanced keyword extraction
      const prompt = extractKeywordsPrompt(text);
      
      logger.debug('Extracting keywords with LLM', {
        model: aiConfig.model,
        promptLength: prompt.length,
        inputLength: text.length
      });

      const body = buildOllamaGenerateBody({
        model: aiConfig.model,
        prompt,
        temperature: aiConfig.generation.temperature,
        maxTokens: aiConfig.generation.maxTokens
      });

      const axiosConfig = {};
      if (aiConfig.http.timeoutMs !== undefined) {
        axiosConfig.timeout = aiConfig.http.timeoutMs;
      }

      const response = await postWithRetry(url, body, axiosConfig, aiConfig.retry);

      const rawResponse = response.data.response;
      logger.debug('Raw keyword extraction response', {
        rawResponse: rawResponse,
        responseLength: rawResponse.length
      });
      
      const keywords = parseKeywords(rawResponse);
      
      logger.info('Keywords extracted successfully', {
        model: aiConfig.model,
        keywordCount: keywords.length,
        keywords: keywords,
        tokensUsed: response.data.eval_count || null
      });

      await tracingService.endSpan(span, {
        keywordCount: keywords.length,
        tokensUsed: response.data.eval_count || null
      });

      return keywords;
    } catch (error) {
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      };
      logger.error('Error extracting keywords:', errorInfo);
      await tracingService.endSpan(span, null, error);
      throw new Error('Failed to extract keywords from Ollama');
    }
  }

  async proposeBiographyFieldUpdates(currentFields, userMessage) {
    const aiConfig = getAIConfig();
    const url = joinUrl(aiConfig.baseUrl, OLLAMA_GENERATE_ENDPOINT);

    const span = tracingService.startSpan('ollama.proposeBiographyFieldUpdates', {
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpoint: OLLAMA_GENERATE_ENDPOINT,
      model: aiConfig.model,
      temperature: 0,
      maxTokens: 400,
      timeoutMs: aiConfig.http.timeoutMs,
      maxRetries: aiConfig.retry.maxRetries,
      messageLength: (userMessage || '').length
    });

    try {
      const prompt = proposeFieldUpdatesPrompt({
        currentFields,
        userMessage
      });

      logger.debug('Proposing structured field updates with LLM', {
        model: aiConfig.model,
        promptLength: prompt.length,
        messageLength: (userMessage || '').length
      });

      const body = buildOllamaGenerateBody({
        model: aiConfig.model,
        prompt,
        temperature: 0,
        maxTokens: 400
      });

      const axiosConfig = {};
      if (aiConfig.http.timeoutMs !== undefined) {
        axiosConfig.timeout = aiConfig.http.timeoutMs;
      }

      const response = await postWithRetry(url, body, axiosConfig, aiConfig.retry);
      const text = String(response.data.response || '').trim();

      await tracingService.endSpan(span, {
        outputLength: text.length,
        tokensUsed: response.data.eval_count || null
      });

      return text;
    } catch (error) {
      await tracingService.endSpan(span, null, error);
      // Non-fatal: caller can proceed without structured updates.
      logger.warn('Failed to propose structured field updates', {
        message: error.message,
        status: error.response?.status,
        code: error.code
      });
      return null;
    }
  }

  async refineBiography(currentBiography, userMessage, conversationHistory) {
    const aiConfig = getAIConfig();
    const url = joinUrl(aiConfig.baseUrl, OLLAMA_GENERATE_ENDPOINT);

    const span = tracingService.startSpan('ollama.refineBiography', {
      biographyLength: currentBiography.length,
      userMessageLength: userMessage.length,
      conversationHistoryLength: conversationHistory?.length || 0,
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpoint: OLLAMA_GENERATE_ENDPOINT,
      model: aiConfig.model,
      temperature: aiConfig.generation.temperature,
      maxTokens: aiConfig.generation.maxTokens,
      timeoutMs: aiConfig.http.timeoutMs,
      maxRetries: aiConfig.retry.maxRetries
    });

    try {
      const conversationContext = buildConversationContext(conversationHistory);

      const prompt = refineBiographyPrompt(currentBiography, userMessage, conversationContext);
      
      logger.debug('Refining biography with LLM', {
        model: aiConfig.model,
        promptLength: prompt.length,
        userMessage: userMessage,
        conversationHistoryLength: conversationHistory?.length || 0,
        currentBiographyLength: currentBiography.length,
        promptPreview: prompt.substring(0, 200) + '...'
      });

      const body = buildOllamaGenerateBody({
        model: aiConfig.model,
        prompt,
        temperature: aiConfig.generation.temperature,
        maxTokens: aiConfig.generation.maxTokens
      });

      const axiosConfig = {};
      if (aiConfig.http.timeoutMs !== undefined) {
        axiosConfig.timeout = aiConfig.http.timeoutMs;
      }

      const response = await postWithRetry(url, body, axiosConfig, aiConfig.retry);

      const refinedBiography = response.data.response.trim();
      
      // Validate the response to ensure LLM understood the task
      if (!isValidBiographyText(refinedBiography)) {
        logger.warn('LLM returned invalid biography text', {
          response: refinedBiography.substring(0, 200),
          userMessage,
          currentBiographyPreview: currentBiography.substring(0, 100)
        });
        throw new Error('LLM failed to refine biography - returned invalid or confused response');
      }
      
      logger.info('Biography refined successfully', {
        model: aiConfig.model,
        originalLength: currentBiography.length,
        refinedLength: refinedBiography.length,
        lengthDelta: refinedBiography.length - currentBiography.length,
        tokensUsed: response.data.eval_count || null,
        outputPreview: refinedBiography.substring(0, 150) + '...'
      });

      await tracingService.endSpan(span, {
        outputLength: refinedBiography.length,
        tokensUsed: response.data.eval_count || null
      });

      return refinedBiography;
    } catch (error) {
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      };
      logger.error('Error refining biography:', errorInfo);
      await tracingService.endSpan(span, null, error);
      throw new Error('Failed to refine biography with Ollama');
    }
  }
}

export default new OllamaService();
