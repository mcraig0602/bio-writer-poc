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

function previewText(text, maxLen = 80) {
  if (!text) return '';
  const trimmed = String(text).trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}…`;
}

async function handleChatMessage(req, res) {
  try {
    const { biographyId } = req.params;
    const { message } = req.body;

    logger.debug('Chat message received', {
      biographyId,
      route: req.originalUrl,
      messageLength: typeof message === 'string' ? message.length : null,
      messagePreview: previewText(message, 60)
    });

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const biography = await Biography.findById(biographyId);

    if (!biography) {
      logger.info('Chat message for missing biography', { biographyId, route: req.originalUrl });
      return res.status(404).json({ error: 'Biography not found' });
    }

    const hasPendingUpdate = Boolean(biography.pendingUpdate?.updates);

    logger.debug('Chat biography loaded', {
      biographyId,
      route: req.originalUrl,
      hasPendingUpdate,
      hasSummary: Boolean(biography.summary),
      hasCurrentBiography: Boolean(biography.currentBiography)
    });

    // Save user message (always persisted)
    const userMessage = new ChatMessage({
      role: 'user',
      content: message,
      biographyId
    });
    await userMessage.save();

    logger.debug('Chat user message saved', {
      biographyId,
      route: req.originalUrl,
      chatMessageId: userMessage._id
    });

    // If there's a pending structured update, treat this message as yes/no confirmation.
    if (hasPendingUpdate) {
      const intent = detectYesNoIntent(message);

      logger.info('Chat pendingUpdate confirmation flow', {
        biographyId,
        route: req.originalUrl,
        intent,
        pendingHasExplanations: Array.isArray(biography.pendingUpdate?.explanations)
          ? biography.pendingUpdate.explanations.length
          : 0
      });

      if (intent === 'unknown') {
        const assistantMessage = new ChatMessage({
          role: 'assistant',
          content: 'Please reply with “yes” to apply the proposed profile updates, or “no” to cancel.',
          biographyId
        });
        await assistantMessage.save();

        logger.debug('Chat confirmation requested (unknown intent)', {
          biographyId,
          route: req.originalUrl,
          assistantMessageId: assistantMessage._id
        });

        return res.json({
          biography: biography.currentBiography || biography.summary || '',
          summary: biography.summary || '',
          skills: biography.skills || [],
          contactInfo: biography.contactInfo || {},
          pendingUpdate: biography.pendingUpdate || null,
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

        logger.info('Chat pendingUpdate canceled', {
          biographyId,
          route: req.originalUrl
        });

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
          pendingUpdate: null,
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

      logger.info('Chat pendingUpdate applying', {
        biographyId,
        route: req.originalUrl,
        fields: Object.keys(pendingUpdates || {})
      });

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
        route: req.originalUrl,
        fieldsUpdated: topLevelFields
      });

      return res.json({
        biography: biography.currentBiography || biography.summary || '',
        summary: biography.summary || '',
        skills: biography.skills || [],
        contactInfo: biography.contactInfo || {},
        pendingUpdate: null,
        jobTitle: biography.jobTitle,
        department: biography.department,
        businessFunction: biography.businessFunction,
        businessFunctionOther: biography.businessFunctionOther,
        location: biography.location,
        yearsExperience: biography.yearsExperience,
        message: assistantMessage.content
      });
    }

    // First: check if the user is trying to update profile fields (e.g., LinkedIn).
    // If we detect structured updates, do NOT refine the biography text in the same request.
    // This avoids polluting the biography with contact details.
    const proposalRaw = await ollamaService.proposeBiographyFieldUpdates({
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo || {}
    }, message);

    logger.debug('Chat profile update proposal complete (pre-refine)', {
      biographyId,
      route: req.originalUrl,
      proposalReturned: Boolean(proposalRaw),
      proposalLength: proposalRaw ? proposalRaw.length : 0,
      proposalPreview: proposalRaw ? previewText(proposalRaw, 120) : ''
    });

    if (proposalRaw) {
      const parsed = parseFieldUpdatesJson(proposalRaw);
      const { updates: normalizedUpdates } = normalizeProposedFieldUpdates(parsed?.updates);

      logger.debug('Chat profile update proposal parsed (pre-refine)', {
        biographyId,
        route: req.originalUrl,
        parsedOk: Boolean(parsed),
        normalizedKeys: normalizedUpdates ? Object.keys(normalizedUpdates) : [],
        willCreatePendingUpdate: hasAnyUpdates(normalizedUpdates)
      });

      if (hasAnyUpdates(normalizedUpdates)) {
        const explanations = buildUpdateExplanations(normalizedUpdates);
        biography.pendingUpdate = {
          updates: normalizedUpdates,
          explanations
        };

        logger.info('Chat pendingUpdate created (pre-refine)', {
          biographyId,
          route: req.originalUrl,
          explanationCount: explanations.length,
          fields: Object.keys(normalizedUpdates || {})
        });

        await biography.save();

        const assistantContent = `I can update your profile fields:\n- ${explanations.join('\n- ')}\n\nReply “yes” to apply these updates, or “no” to cancel.`;

        const assistantMessage = new ChatMessage({
          role: 'assistant',
          content: assistantContent,
          biographyId
        });
        await assistantMessage.save();

        logger.info('Chat message processed (profile-only)', {
          biographyId,
          route: req.originalUrl,
          messageLength: message.length,
          assistantMessageId: assistantMessage._id,
          hasPendingUpdate: true
        });

        return res.json({
          biography: biography.currentBiography || biography.summary || '',
          summary: biography.summary || '',
          skills: biography.skills || [],
          contactInfo: biography.contactInfo || {},
          pendingUpdate: biography.pendingUpdate || null,
          jobTitle: biography.jobTitle,
          department: biography.department,
          businessFunction: biography.businessFunction,
          businessFunctionOther: biography.businessFunctionOther,
          location: biography.location,
          yearsExperience: biography.yearsExperience,
          message: assistantMessage.content
        });
      }
    }

    // Validate that biography has valid content before attempting refinement
    const biographyText = biography.currentBiography || biography.summary || '';

    if (!biographyText || !isValidBiographyText(biographyText)) {
      logger.warn('Attempted to refine invalid biography', {
        biographyId,
        route: req.originalUrl,
        currentBiography: biographyText.substring(0, 100)
      });
      return res.status(400).json({ 
        error: 'Biography has no valid content. Please generate a biography first.',
        suggestion: 'Use the main form to generate an initial biography from your input text.'
      });
    }

    // Get conversation history for context (exclude the just-saved user message)
    const conversationHistory = await ChatMessage.find({ biographyId, _id: { $ne: userMessage._id } })
      .sort({ timestamp: 1 })
      .limit(20);

    logger.debug('Chat conversation context loaded', {
      biographyId,
      route: req.originalUrl,
      messageCount: conversationHistory.length
    });

    // Refine biography using Ollama with full conversation context
    // Use currentBiography if set, otherwise fall back to summary
    const currentText = biography.currentBiography || biography.summary || '';
    
    const refinedBio = await ollamaService.refineBiography(
      currentText,
      message,
      conversationHistory
    );

    logger.info('Chat biography refined', {
      biographyId,
      route: req.originalUrl,
      refinedLength: refinedBio?.length ?? null
    });

    // Only regenerate skills if not manually managed
    let skills = biography.skills || [];
    if (!biography.manuallyManagedTags) {
      skills = await keywordService.extractFromText(refinedBio);
      biography.skills = skills;

      logger.debug('Chat skills regenerated', {
        biographyId,
        route: req.originalUrl,
        skillCount: Array.isArray(skills) ? skills.length : null
      });
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

    let assistantContent = 'Updated the biography text based on your request.';

    await biography.save();

    logger.debug('Chat biography saved', {
      biographyId,
      route: req.originalUrl,
      hasPendingUpdate: Boolean(biography.pendingUpdate?.updates)
    });

    const assistantMessage = new ChatMessage({
      role: 'assistant',
      content: assistantContent,
      biographyId
    });
    await assistantMessage.save();

    logger.info('Chat message processed', {
      biographyId,
      route: req.originalUrl,
      messageLength: message.length,
      assistantMessageId: assistantMessage._id,
      hasPendingUpdate: Boolean(biography.pendingUpdate?.updates)
    });

    res.json({
      biography: biography.currentBiography,
      summary: biography.summary,
      skills: biography.skills || [],
      contactInfo: biography.contactInfo || {},
      pendingUpdate: biography.pendingUpdate || null,
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      message: assistantMessage.content
    });
  } catch (error) {
    logger.logError(error, { route: req.originalUrl });
    res.status(500).json({ error: 'Failed to refine biography' });
  }
}

// New chat endpoint (preferred)
router.post('/:biographyId/message', handleChatMessage);

// Legacy: refine biography through chat
router.post('/:biographyId/refine', handleChatMessage);

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
