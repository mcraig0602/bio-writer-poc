import express from 'express';
import Biography from '../models/Biography.js';
import ChatMessage from '../models/ChatMessage.js';
import ollamaService from '../services/ollama.js';
import keywordService from '../services/keywords.js';
import logger from '../config/logging.js';
import { isValidBiographyText } from '../utils/validators.js';
import {
  applyFieldUpdatesToBiography,
  buildUpdateExplanations,
  detectYesNoIntent,
  hasAnyUpdates,
  normalizeProposedFieldUpdates,
  parseFieldUpdatesJson
} from '../utils/fieldUpdates.js';

const router = express.Router();

// TODO: Add Authorization header support for multi-user authentication

// Refine biography through chat
router.post('/:biographyId/refine', async (req, res) => {
  try {
    const { biographyId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const biography = await Biography.findById(biographyId);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    const hasPendingUpdate = Boolean(biography.pendingUpdate?.updates);

    // Save user message (always persisted)
    const userMessage = new ChatMessage({
      role: 'user',
      content: message,
      biographyId
    });
    await userMessage.save();

    // If there's a pending structured update, treat this message as yes/no confirmation.
    if (hasPendingUpdate) {
      const intent = detectYesNoIntent(message);

      if (intent === 'unknown') {
        const assistantMessage = new ChatMessage({
          role: 'assistant',
          content: 'Please reply with “yes” to apply the proposed profile updates, or “no” to cancel.',
          biographyId
        });
        await assistantMessage.save();

        return res.json({
          biography: biography.currentBiography || biography.summary || '',
          summary: biography.summary || '',
          skills: biography.skills || [],
          contactInfo: biography.contactInfo || {},
          jobTitle: biography.jobTitle,
          department: biography.department,
          businessFunction: biography.businessFunction,
          businessFunctionOther: biography.businessFunctionOther,
          location: biography.location,
          yearsExperience: biography.yearsExperience,
          message: assistantMessage.content
        });
      }

      if (intent === 'no') {
        biography.pendingUpdate = undefined;
        await biography.save();

        const assistantMessage = new ChatMessage({
          role: 'assistant',
          content: 'Canceled — no profile fields were changed.',
          biographyId
        });
        await assistantMessage.save();

        return res.json({
          biography: biography.currentBiography || biography.summary || '',
          summary: biography.summary || '',
          skills: biography.skills || [],
          contactInfo: biography.contactInfo || {},
          jobTitle: biography.jobTitle,
          department: biography.department,
          businessFunction: biography.businessFunction,
          businessFunctionOther: biography.businessFunctionOther,
          location: biography.location,
          yearsExperience: biography.yearsExperience,
          message: assistantMessage.content
        });
      }

      // intent === 'yes'
      const pendingUpdates = biography.pendingUpdate?.updates?.toObject?.() ?? biography.pendingUpdate?.updates ?? {};
      const pendingExplanations = biography.pendingUpdate?.explanations || [];

      applyFieldUpdatesToBiography(biography, pendingUpdates);

      // Add history entries per updated top-level field
      const topLevelFields = Object.keys(pendingUpdates || {});
      topLevelFields.forEach((field) => {
        biography.history.push({
          biography: biography.summary || '',
          tags: biography.tags || [],
          skills: biography.skills || [],
          source: 'field-update',
          field,
          timestamp: new Date()
        });
      });

      biography.pendingUpdate = undefined;
      await biography.save();

      const appliedLines = pendingExplanations.length > 0
        ? pendingExplanations
        : buildUpdateExplanations(pendingUpdates);

      const assistantContent = appliedLines.length > 0
        ? `Applied profile updates:\n- ${appliedLines.join('\n- ')}`
        : 'Applied profile updates.';

      const assistantMessage = new ChatMessage({
        role: 'assistant',
        content: assistantContent,
        biographyId
      });
      await assistantMessage.save();

      logger.info('Pending profile updates applied via chat confirmation', {
        biographyId,
        fieldsUpdated: topLevelFields
      });

      return res.json({
        biography: biography.currentBiography || biography.summary || '',
        summary: biography.summary || '',
        skills: biography.skills || [],
        contactInfo: biography.contactInfo || {},
        jobTitle: biography.jobTitle,
        department: biography.department,
        businessFunction: biography.businessFunction,
        businessFunctionOther: biography.businessFunctionOther,
        location: biography.location,
        yearsExperience: biography.yearsExperience,
        message: assistantMessage.content
      });
    }

    // Validate that biography has valid content before attempting refinement
    const biographyText = biography.currentBiography || biography.summary || '';

    if (!biographyText || !isValidBiographyText(biographyText)) {
      logger.warn('Attempted to refine invalid biography', {
        biographyId,
        currentBiography: biographyText.substring(0, 100)
      });
      return res.status(400).json({ 
        error: 'Biography has no valid content. Please generate a biography first.',
        suggestion: 'Use the main form to generate an initial biography from your input text.'
      });
    }

    // Get conversation history for context
    const conversationHistory = await ChatMessage.find({ biographyId })
      .sort({ timestamp: 1 })
      .limit(20);

    // Refine biography using Ollama with full conversation context
    // Use currentBiography if set, otherwise fall back to summary
    const currentText = biography.currentBiography || biography.summary || '';
    
    const refinedBio = await ollamaService.refineBiography(
      currentText,
      message,
      conversationHistory
    );

    // Only regenerate skills if not manually managed
    let skills = biography.skills || [];
    if (!biography.manuallyManagedTags) {
      skills = await keywordService.extractFromText(refinedBio);
      biography.skills = skills;
    }

    // Update both currentBiography and summary to keep them in sync
    biography.currentBiography = refinedBio;
    biography.summary = refinedBio;

    // Add to history
    biography.history.push({
      biography: refinedBio,
      tags: biography.tags || [],
      skills: skills,
      source: 'chat',
      timestamp: new Date()
    });

    // Attempt to propose structured profile updates based on this message.
    const proposalRaw = await ollamaService.proposeBiographyFieldUpdates({
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo || {}
    }, message);

    let assistantContent = 'Updated the biography text based on your request.';

    if (proposalRaw) {
      const parsed = parseFieldUpdatesJson(proposalRaw);
      const { updates: normalizedUpdates } = normalizeProposedFieldUpdates(parsed?.updates);

      if (hasAnyUpdates(normalizedUpdates)) {
        const explanations = buildUpdateExplanations(normalizedUpdates);
        biography.pendingUpdate = {
          updates: normalizedUpdates,
          explanations
        };

        assistantContent = `I can also update your profile fields:\n- ${explanations.join('\n- ')}\n\nReply “yes” to apply these updates, or “no” to cancel.`;
      }
    }

    await biography.save();

    const assistantMessage = new ChatMessage({
      role: 'assistant',
      content: assistantContent,
      biographyId
    });
    await assistantMessage.save();

    logger.info('Biography refined via chat', { biographyId, messageLength: message.length });

    res.json({
      biography: biography.currentBiography,
      summary: biography.summary,
      skills: biography.skills || [],
      contactInfo: biography.contactInfo || {},
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      message: assistantMessage.content
    });
  } catch (error) {
    logger.logError(error, { route: `/api/chat/${req.params.biographyId}/refine` });
    res.status(500).json({ error: 'Failed to refine biography' });
  }
});

// Get chat messages for specific biography
router.get('/:biographyId/messages', async (req, res) => {
  try {
    const { biographyId } = req.params;

    const biography = await Biography.findById(biographyId);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    const messages = await ChatMessage.find({ biographyId })
      .sort({ timestamp: 1 });

    res.json({ messages });
  } catch (error) {
    logger.logError(error, { route: `/api/chat/${req.params.biographyId}/messages` });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Clear chat history for specific biography
router.delete('/:biographyId/clear', async (req, res) => {
  try {
    const { biographyId } = req.params;

    const biography = await Biography.findById(biographyId);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    await ChatMessage.deleteMany({ biographyId });

    logger.info('Chat history cleared', { biographyId });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    logger.logError(error, { route: `/api/chat/${req.params.biographyId}/clear` });
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
