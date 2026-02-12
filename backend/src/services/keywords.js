import ollamaService from './ollama.js';

// TODO: Consider using Hugging Face Transformers library for more advanced keyword extraction
class KeywordService {
  async extractFromText(text) {
    return await ollamaService.extractKeywords(text);
  }
}

export default new KeywordService();
