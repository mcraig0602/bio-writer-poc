import axios from 'axios';

// TODO: Add Authorization header support for multi-user authentication
// Example: axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class BiographyAPI {
  async generateBiography(biographyData) {
    const response = await axios.post(`${API_BASE_URL}/biography/generate`, biographyData);
    return response.data;
  }

  async listBiographies() {
    const response = await axios.get(`${API_BASE_URL}/biography/list`);
    return response.data;
  }

  async getBiography(id) {
    const response = await axios.get(`${API_BASE_URL}/biography/${id}`);
    return response.data;
  }

  async getCurrentBiography() {
    try {
      const response = await axios.get(`${API_BASE_URL}/biography/current`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async editBiography(id, biographyData) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/edit`, biographyData);
    return response.data;
  }

  async updateField(id, fieldName, value) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/field/${fieldName}`, {
      value
    });
    return response.data;
  }

  async updateContactInfo(id, contactInfo) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/contact`, {
      contactInfo
    });
    return response.data;
  }

  async addEducation(id, educationEntry) {
    const response = await axios.post(`${API_BASE_URL}/biography/${id}/education`, educationEntry);
    return response.data;
  }

  async updateEducation(id, index, educationEntry) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/education/${index}`, educationEntry);
    return response.data;
  }

  async deleteEducation(id, index) {
    const response = await axios.delete(`${API_BASE_URL}/biography/${id}/education/${index}`);
    return response.data;
  }

  async addExperience(id, experienceEntry) {
    const response = await axios.post(`${API_BASE_URL}/biography/${id}/experience`, experienceEntry);
    return response.data;
  }

  async updateExperience(id, index, experienceEntry) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/experience/${index}`, experienceEntry);
    return response.data;
  }

  async deleteExperience(id, index) {
    const response = await axios.delete(`${API_BASE_URL}/biography/${id}/experience/${index}`);
    return response.data;
  }

  async updateTitle(id, title) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/title`, {
      title
    });
    return response.data;
  }

  async updateTags(id, tags) {
    const response = await axios.put(`${API_BASE_URL}/biography/${id}/tags`, {
      tags
    });
    return response.data;
  }

  async regenerateKeywords(id) {
    const response = await axios.post(`${API_BASE_URL}/biography/${id}/regenerate/skills`);
    return response.data;
  }

  async regenerateMentorSummary(id) {
    const response = await axios.post(`${API_BASE_URL}/biography/${id}/regenerate/mentorSummary`);
    return response.data;
  }

  async regenerateSummary(id) {
    const response = await axios.post(`${API_BASE_URL}/biography/${id}/regenerate/summary`);
    return response.data;
  }

  async getHistory(id) {
    const response = await axios.get(`${API_BASE_URL}/biography/${id}/history`);
    return response.data;
  }

  async deleteBiography(id) {
    const response = await axios.delete(`${API_BASE_URL}/biography/${id}`);
    return response.data;
  }

  // Legacy chat methods (may be deprecated in future)
  async refineBiography(biographyId, message) {
    const response = await axios.post(`${API_BASE_URL}/chat/${biographyId}/refine`, {
      message
    });
    return response.data;
  }

  async getChatMessages(biographyId) {
    const response = await axios.get(`${API_BASE_URL}/chat/${biographyId}/messages`);
    return response.data;
  }

  async clearChat(biographyId) {
    const response = await axios.delete(`${API_BASE_URL}/chat/${biographyId}/clear`);
    return response.data;
  }
}

export default new BiographyAPI();
