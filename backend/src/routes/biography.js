import express from 'express';
import Biography from '../models/Biography.js';
import ChatMessage from '../models/ChatMessage.js';
import ollamaService from '../services/ollama.js';
import keywordService from '../services/keywords.js';
import logger from '../config/logging.js';
import { validateTags } from '../utils/parsers.js';
import { validateBiographyFields } from '../utils/validators.js';

const router = express.Router();

// TODO: Add Authorization header support for multi-user authentication

// Generate biography from structured input fields
router.post('/generate', async (req, res) => {
  try {
    const biographyData = req.body;

    // Validate structured fields
    const validation = validateBiographyFields(biographyData);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Build structured context for AI generation
    let contextForAI = `Job Title: ${biographyData.jobTitle}\nDepartment: ${biographyData.department}\n`;
    
    if (biographyData.location) {
      contextForAI += `Location: ${biographyData.location}\n`;
    }
    
    if (biographyData.yearsExperience) {
      contextForAI += `Years of Experience: ${biographyData.yearsExperience}\n`;
    }

    if (biographyData.experience && biographyData.experience.length > 0) {
      contextForAI += `\nExperience:\n`;
      biographyData.experience.forEach(exp => {
        contextForAI += `- ${exp.title} at ${exp.company}${exp.years ? ` (${exp.years})` : ''}\n`;
        if (exp.description) contextForAI += `  ${exp.description}\n`;
      });
    }

    if (biographyData.skills && biographyData.skills.length > 0) {
      contextForAI += `\nSkills: ${biographyData.skills.join(', ')}\n`;
    }

    if (biographyData.education && biographyData.education.length > 0) {
      contextForAI += `\nEducation:\n`;
      biographyData.education.forEach(edu => {
        contextForAI += `- ${edu.degree} from ${edu.university}${edu.year ? ` (${edu.year})` : ''}\n`;
      });
    }

    if (biographyData.certifications && biographyData.certifications.length > 0) {
      contextForAI += `\nCertifications: ${biographyData.certifications.join(', ')}\n`;
    }

    if (biographyData.notableAchievements && biographyData.notableAchievements.length > 0) {
      contextForAI += `\nNotable Achievements:\n`;
      biographyData.notableAchievements.forEach(achievement => {
        contextForAI += `- ${achievement}\n`;
      });
    }

    // If user provided a summary, include it as context
    if (biographyData.summary?.trim()) {
      contextForAI += `\nAdditional Context: ${biographyData.summary.trim()}\n`;
    }

    // Generate a professional summary using AI
    let generatedSummary = '';
    try {
      generatedSummary = await ollamaService.generateBiography(contextForAI);
      logger.info('AI summary generated', { 
        contextLength: contextForAI.length,
        summaryLength: generatedSummary.length 
      });
    } catch (aiError) {
      logger.warn('AI generation failed, using provided summary or default', { error: aiError.message });
      // Fallback to provided summary or a basic default
      generatedSummary = biographyData.summary?.trim() || 
        `${biographyData.jobTitle} with ${biographyData.yearsExperience || 'several'} years of experience in ${biographyData.department}.`;
    }

    // Optionally generate a mentor summary using AI (only when explicitly requested)
    const shouldGenerateMentorSummary = biographyData.generateMentorSummary === true;
    let mentorSummary = biographyData.mentorSummary?.trim();
    if (shouldGenerateMentorSummary && !mentorSummary) {
      try {
        mentorSummary = await ollamaService.generateMentorSummary(contextForAI);
        logger.info('AI mentor summary generated', {
          contextLength: contextForAI.length,
          mentorSummaryLength: mentorSummary.length
        });
      } catch (aiError) {
        logger.warn('Mentor summary generation failed, continuing without mentor summary', { error: aiError.message });
        mentorSummary = undefined;
      }
    }

    // Create new biography with structured data and AI-generated summary
    const biography = new Biography({
      title: biographyData.title?.trim() || 'Untitled Biography',
      jobTitle: biographyData.jobTitle.trim(),
      department: biographyData.department.trim(),
      businessFunction: biographyData.businessFunction,
      businessFunctionOther: biographyData.businessFunctionOther?.trim(),
      location: biographyData.location?.trim(),
      yearsExperience: biographyData.yearsExperience,
      contactInfo: biographyData.contactInfo || {},
      summary: generatedSummary,
      mentorSummary: mentorSummary,
      experience: biographyData.experience || [],
      skills: biographyData.skills || [],
      education: biographyData.education || [],
      certifications: biographyData.certifications || [],
      notableAchievements: biographyData.notableAchievements || [],
      rawInput: contextForAI, // Store the context for reference
      currentBiography: generatedSummary, // For compatibility with chat refinement
      isLegacyFormat: false
    });

    // Add to history
    biography.history.push({
      biography: generatedSummary,
      tags: biography.tags || [],
      skills: biography.skills || [],
      source: 'initial',
      timestamp: new Date()
    });

    await biography.save();

    logger.info('Structured biography created with AI-generated summary', { 
      biographyId: biography._id, 
      title: biography.title,
      jobTitle: biography.jobTitle,
      summaryLength: generatedSummary.length
    });

    res.json({
      id: biography._id,
      title: biography.title,
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo,
      pendingUpdate: biography.pendingUpdate || null,
      summary: biography.summary,
      mentorSummary: biography.mentorSummary,
      experience: biography.experience,
      skills: biography.skills,
      education: biography.education,
      certifications: biography.certifications,
      notableAchievements: biography.notableAchievements,
      createdAt: biography.createdAt,
      updatedAt: biography.updatedAt
    });
  } catch (error) {
    logger.logError(error, { route: '/api/biography/generate' });
    res.status(500).json({ error: 'Failed to create biography' });
  }
});

// List all biographies
router.get('/list', async (req, res) => {
  try {
    const biographies = await Biography.find()
      .select('_id title jobTitle department location yearsExperience skills createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json({
      count: biographies.length,
      biographies: biographies.map(bio => ({
        id: bio._id,
        title: bio.title,
        jobTitle: bio.jobTitle,
        department: bio.department,
        location: bio.location,
        yearsExperience: bio.yearsExperience,
        skills: bio.skills || [],
        createdAt: bio.createdAt,
        updatedAt: bio.updatedAt
      }))
    });
  } catch (error) {
    logger.logError(error, { route: '/api/biography/list' });
    res.status(500).json({ error: 'Failed to list biographies' });
  }
});

// Regenerate supported AI-derived fields via a single endpoint
// key must be a Biography schema field name (keyof Biography)
router.post('/:id/regenerate/:key', async (req, res) => {
  try {
    const { id, key } = req.params;

    const allowedKeys = ['summary', 'mentorSummary', 'skills'];

    // Ensure the key exists on the schema (best-effort runtime check)
    const schemaHasKey = Boolean(Biography?.schema?.path?.(key));
    if (!schemaHasKey) {
      return res.status(400).json({ error: 'Invalid key' });
    }

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({
        error: 'Key is not regeneratable',
        allowedKeys
      });
    }

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    if (key === 'skills') {
      // Build text from biography content for keyword extraction
      let textForExtraction = '';

      if (biography.summary) {
        textForExtraction += biography.summary + '\n\n';
      }

      if (biography.experience && biography.experience.length > 0) {
        biography.experience.forEach(exp => {
          textForExtraction += `${exp.title} at ${exp.company}. `;
          if (exp.description) {
            textForExtraction += `${exp.description} `;
          }
        });
        textForExtraction += '\n\n';
      }

      if (biography.education && biography.education.length > 0) {
        biography.education.forEach(edu => {
          textForExtraction += `${edu.degree} from ${edu.university}. `;
        });
        textForExtraction += '\n\n';
      }

      if (biography.notableAchievements && biography.notableAchievements.length > 0) {
        textForExtraction += biography.notableAchievements.join('. ') + '.';
      }

      let extractedSkills = [];
      try {
        const keywords = await keywordService.extractFromText(textForExtraction);
        logger.info('Keywords extracted from biography', { keywords });
        extractedSkills = keywords.map(k => k.trim()).filter(k => k.length > 0);
        logger.info('Keywords extracted from biography', {
          biographyId: biography._id,
          skillCount: extractedSkills.length
        });
      } catch (aiError) {
        logger.warn('Keyword extraction failed', { error: aiError.message });
        return res.status(500).json({ error: 'Failed to extract keywords' });
      }

      biography.skills = extractedSkills;

      // Add to history
      biography.history.push({
        biography: biography.summary || '',
        tags: biography.tags || [],
        skills: biography.skills,
        source: 'regenerate-keywords',
        timestamp: new Date()
      });

      await biography.save();

      logger.info('Biography keywords regenerated', {
        biographyId: biography._id,
        skillCount: extractedSkills.length
      });

      return res.json({ skills: biography.skills });
    }

    if (key === 'mentorSummary') {
      // Prefer the stored context used for AI generation; fall back to reconstructing from fields
      let contextForAI = biography.rawInput;
      if (!contextForAI || contextForAI.trim().length === 0) {
        contextForAI = `Job Title: ${biography.jobTitle || ''}\nDepartment: ${biography.department || ''}\n`;

        if (biography.location) {
          contextForAI += `Location: ${biography.location}\n`;
        }

        if (biography.yearsExperience !== undefined && biography.yearsExperience !== null) {
          contextForAI += `Years of Experience: ${biography.yearsExperience}\n`;
        }

        if (biography.experience && biography.experience.length > 0) {
          contextForAI += `\nExperience:\n`;
          biography.experience.forEach(exp => {
            contextForAI += `- ${exp.title} at ${exp.company}${exp.years ? ` (${exp.years})` : ''}\n`;
            if (exp.description) contextForAI += `  ${exp.description}\n`;
          });
        }

        if (biography.skills && biography.skills.length > 0) {
          contextForAI += `\nSkills: ${biography.skills.join(', ')}\n`;
        }

        if (biography.education && biography.education.length > 0) {
          contextForAI += `\nEducation:\n`;
          biography.education.forEach(edu => {
            contextForAI += `- ${edu.degree} from ${edu.university}${edu.year ? ` (${edu.year})` : ''}\n`;
          });
        }

        if (biography.certifications && biography.certifications.length > 0) {
          contextForAI += `\nCertifications: ${biography.certifications.join(', ')}\n`;
        }

        if (biography.notableAchievements && biography.notableAchievements.length > 0) {
          contextForAI += `\nNotable Achievements:\n`;
          biography.notableAchievements.forEach(achievement => {
            contextForAI += `- ${achievement}\n`;
          });
        }

        if (biography.summary?.trim()) {
          contextForAI += `\nAdditional Context: ${biography.summary.trim()}\n`;
        }
      }

      let regeneratedMentorSummary = '';
      try {
        regeneratedMentorSummary = await ollamaService.generateMentorSummary(contextForAI);
        logger.info('Mentor summary regenerated', {
          biographyId: biography._id,
          contextLength: contextForAI.length,
          mentorSummaryLength: regeneratedMentorSummary.length
        });
      } catch (aiError) {
        logger.warn('Mentor summary regeneration failed', { biographyId: biography._id, error: aiError.message });
        return res.status(500).json({ error: 'Failed to regenerate mentor summary' });
      }

      biography.mentorSummary = regeneratedMentorSummary;

      // Add to history
      biography.history.push({
        biography: biography.summary || '',
        tags: biography.tags || [],
        skills: biography.skills || [],
        source: 'field-update',
        field: 'mentorSummary',
        timestamp: new Date()
      });

      await biography.save();

      return res.json({ mentorSummary: biography.mentorSummary });
    }

    if (key === 'summary') {
      // Prefer the stored context used for AI generation; fall back to reconstructing from fields
      // Note: we intentionally exclude the current summary to avoid self-referential regeneration.
      let contextForAI = biography.rawInput;
      if (!contextForAI || contextForAI.trim().length === 0) {
        contextForAI = `Job Title: ${biography.jobTitle || ''}\nDepartment: ${biography.department || ''}\n`;

        if (biography.location) {
          contextForAI += `Location: ${biography.location}\n`;
        }

        if (biography.yearsExperience !== undefined && biography.yearsExperience !== null) {
          contextForAI += `Years of Experience: ${biography.yearsExperience}\n`;
        }

        if (biography.experience && biography.experience.length > 0) {
          contextForAI += `\nExperience:\n`;
          biography.experience.forEach(exp => {
            contextForAI += `- ${exp.title} at ${exp.company}${exp.years ? ` (${exp.years})` : ''}\n`;
            if (exp.description) contextForAI += `  ${exp.description}\n`;
          });
        }

        if (biography.skills && biography.skills.length > 0) {
          contextForAI += `\nSkills: ${biography.skills.join(', ')}\n`;
        }

        if (biography.education && biography.education.length > 0) {
          contextForAI += `\nEducation:\n`;
          biography.education.forEach(edu => {
            contextForAI += `- ${edu.degree} from ${edu.university}${edu.year ? ` (${edu.year})` : ''}\n`;
          });
        }

        if (biography.certifications && biography.certifications.length > 0) {
          contextForAI += `\nCertifications: ${biography.certifications.join(', ')}\n`;
        }

        if (biography.notableAchievements && biography.notableAchievements.length > 0) {
          contextForAI += `\nNotable Achievements:\n`;
          biography.notableAchievements.forEach(achievement => {
            contextForAI += `- ${achievement}\n`;
          });
        }
      }

      let regeneratedSummary = '';
      try {
        regeneratedSummary = await ollamaService.generateBiography(contextForAI);
        logger.info('Professional summary regenerated', {
          biographyId: biography._id,
          contextLength: contextForAI.length,
          summaryLength: regeneratedSummary.length
        });
      } catch (aiError) {
        logger.warn('Professional summary regeneration failed', { biographyId: biography._id, error: aiError.message });
        return res.status(500).json({ error: 'Failed to regenerate summary' });
      }

      biography.summary = regeneratedSummary;
      // Keep legacy chat compatibility in sync
      biography.currentBiography = regeneratedSummary;

      // Add to history
      biography.history.push({
        biography: biography.summary || '',
        tags: biography.tags || [],
        skills: biography.skills || [],
        source: 'field-update',
        field: 'summary',
        timestamp: new Date()
      });

      await biography.save();

      return res.json({ summary: biography.summary });
    }

    // Defensive fallback (should be unreachable due to allowlist)
    return res.status(400).json({ error: 'Invalid key' });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/regenerate/${req.params.key}` });
    res.status(500).json({ error: 'Failed to regenerate field' });
  }
});

// Update biography tags (manual keyword management)
router.put('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!tags) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    // Validate and sanitize tags
    const validation = validateTags(tags);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid tags', 
        details: validation.errors 
      });
    }

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    // Determine which tags are new (user-added)
    const existingAiTags = biography.tags || [];
    const existingUserTags = biography.userAddedTags || [];
    const allPreviousTags = [...existingAiTags, ...existingUserTags];
    
    const newUserTags = validation.sanitized.filter(tag => 
      !existingAiTags.includes(tag) && !existingUserTags.includes(tag)
    );

    // Separate tags into AI and user categories
    const updatedAiTags = validation.sanitized.filter(tag => existingAiTags.includes(tag));
    const updatedUserTags = validation.sanitized.filter(tag => 
      existingUserTags.includes(tag) || newUserTags.includes(tag)
    );

    // Update tags and mark as manually managed
    biography.tags = updatedAiTags;
    biography.userAddedTags = updatedUserTags;
    biography.manuallyManagedTags = true;

    // Add to history
    biography.history.push({
      biography: biography.currentBiography,
      tags: updatedAiTags,
      skills: biography.skills || [],
      source: 'manual',
      timestamp: new Date()
    });

    await biography.save();

    logger.info('Biography tags manually updated', { 
      biographyId: biography._id,
      aiTagCount: updatedAiTags.length,
      userTagCount: updatedUserTags.length
    });

    res.json({
      tags: biography.tags,
      userAddedTags: biography.userAddedTags
    });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/tags` });
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// Get current biography (most recently updated) - must be before /:id route
router.get('/current', async (req, res) => {
  try {
    const biography = await Biography.findOne()
      .sort({ updatedAt: -1 });

    if (!biography) {
      return res.status(404).json({ error: 'No biography found' });
    }

    res.json({
      id: biography._id,
      title: biography.title,
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo,
      pendingUpdate: biography.pendingUpdate || null,
      summary: biography.summary,
      mentorSummary: biography.mentorSummary,
      experience: biography.experience,
      skills: biography.skills,
      education: biography.education,
      certifications: biography.certifications,
      notableAchievements: biography.notableAchievements,
      createdAt: biography.createdAt,
      updatedAt: biography.updatedAt
    });
  } catch (error) {
    logger.logError(error, { route: '/api/biography/current' });
    res.status(500).json({ error: 'Failed to fetch biography' });
  }
});

// Get specific biography by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    res.json({
      id: biography._id,
      title: biography.title,
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo,
      summary: biography.summary,
      mentorSummary: biography.mentorSummary,
      experience: biography.experience,
      skills: biography.skills,
      education: biography.education,
      certifications: biography.certifications,
      notableAchievements: biography.notableAchievements,
      createdAt: biography.createdAt,
      updatedAt: biography.updatedAt
    });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}` });
    res.status(500).json({ error: 'Failed to fetch biography' });
  }
});

// Bulk update biography with structured data
router.put('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate structured fields
    const validation = validateBiographyFields(updateData);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    // Update all fields
    biography.title = updateData.title?.trim() || biography.title;
    biography.jobTitle = updateData.jobTitle.trim();
    biography.department = updateData.department.trim();
    biography.businessFunction = updateData.businessFunction;
    biography.businessFunctionOther = updateData.businessFunctionOther?.trim();
    biography.location = updateData.location?.trim();
    biography.yearsExperience = updateData.yearsExperience;
    biography.contactInfo = updateData.contactInfo || {};
    biography.summary = updateData.summary?.trim();
    biography.mentorSummary = updateData.mentorSummary?.trim();
    biography.experience = updateData.experience || [];
    biography.skills = updateData.skills || [];
    biography.education = updateData.education || [];
    biography.certifications = updateData.certifications || [];
    biography.notableAchievements = updateData.notableAchievements || [];

    // Add to history
    biography.history.push({
      biography: biography.summary || '',
      tags: biography.tags || [],
      skills: biography.skills || [],
      source: 'manual',
      timestamp: new Date()
    });

    await biography.save();

    logger.info('Biography bulk updated', { biographyId: biography._id });

    res.json({
      id: biography._id,
      title: biography.title,
      jobTitle: biography.jobTitle,
      department: biography.department,
      businessFunction: biography.businessFunction,
      businessFunctionOther: biography.businessFunctionOther,
      location: biography.location,
      yearsExperience: biography.yearsExperience,
      contactInfo: biography.contactInfo,
      summary: biography.summary,
      mentorSummary: biography.mentorSummary,
      experience: biography.experience,
      skills: biography.skills,
      education: biography.education,
      certifications: biography.certifications,
      notableAchievements: biography.notableAchievements
    });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/edit` });
    res.status(500).json({ error: 'Failed to update biography' });
  }
});

// Update biography title
router.put('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    biography.title = title.trim();
    await biography.save();

    logger.info('Biography title updated', { biographyId: biography._id, title: biography.title });

    res.json({
      title: biography.title,
      id: biography._id
    });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/title` });
    res.status(500).json({ error: 'Failed to update title' });
  }
});

// Update single field
router.put('/:id/field/:fieldName', async (req, res) => {
  try {
    const { id, fieldName } = req.params;
    const { value } = req.body;

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    // Allowed simple fields for update
    const allowedFields = ['jobTitle', 'department', 'businessFunction', 'businessFunctionOther', 'location', 'yearsExperience', 'summary', 'mentorSummary', 'skills', 'certifications', 'notableAchievements'];
    
    if (!allowedFields.includes(fieldName)) {
      return res.status(400).json({ error: 'Invalid field name' });
    }

    biography[fieldName] = value;

    // Add to history
    biography.history.push({
      biography: biography.summary || '',
      tags: biography.tags || [],
      skills: biography.skills || [],
      source: 'field-update',
      field: fieldName,
      timestamp: new Date()
    });

    await biography.save();

    logger.info('Biography field updated', { biographyId: biography._id, field: fieldName });

    res.json({ [fieldName]: biography[fieldName] });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/field/${req.params.fieldName}` });
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Update contact info
router.put('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactInfo } = req.body;

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    biography.contactInfo = contactInfo;

    // Add to history
    biography.history.push({
      biography: biography.summary || '',
      tags: biography.tags || [],
      skills: biography.skills || [],
      source: 'field-update',
      field: 'contactInfo',
      timestamp: new Date()
    });

    await biography.save();

    logger.info('Contact info updated', { biographyId: biography._id });

    res.json({ contactInfo: biography.contactInfo });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/contact` });
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});

// Add/update/delete education entries
router.post('/:id/education', async (req, res) => {
  try {
    const { id } = req.params;
    const educationEntry = req.body;

    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });

    biography.education.push(educationEntry);
    await biography.save();
    logger.info('Education entry added', { biographyId: biography._id });
    res.json({ education: biography.education });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/education` });
    res.status(500).json({ error: 'Failed to add education entry' });
  }
});

router.put('/:id/education/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const educationEntry = req.body;
    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });
    const idx = parseInt(index);
    if (idx < 0 || idx >= biography.education.length) {
      return res.status(400).json({ error: 'Invalid education index' });
    }
    biography.education[idx] = educationEntry;
    await biography.save();
    logger.info('Education entry updated', { biographyId: biography._id, index: idx });
    res.json({ education: biography.education });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/education/${req.params.index}` });
    res.status(500).json({ error: 'Failed to update education entry' });
  }
});

router.delete('/:id/education/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });
    const idx = parseInt(index);
    if (idx < 0 || idx >= biography.education.length) {
      return res.status(400).json({ error: 'Invalid education index' });
    }
    biography.education.splice(idx, 1);
    await biography.save();
    logger.info('Education entry deleted', { biographyId: biography._id, index: idx });
    res.json({ education: biography.education });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/education/${req.params.index}` });
    res.status(500).json({ error: 'Failed to delete education entry' });
  }
});

// Add/update/delete experience entries  
router.post('/:id/experience', async (req, res) => {
  try {
    const { id } = req.params;
    const experienceEntry = req.body;
    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });
    biography.experience.push(experienceEntry);
    await biography.save();
    logger.info('Experience entry added', { biographyId: biography._id });
    res.json({ experience: biography.experience });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/experience` });
    res.status(500).json({ error: 'Failed to add experience entry' });
  }
});

router.put('/:id/experience/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const experienceEntry = req.body;
    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });
    const idx = parseInt(index);
    if (idx < 0 || idx >= biography.experience.length) {
      return res.status(400).json({ error: 'Invalid experience index' });
    }
    biography.experience[idx] = experienceEntry;
    await biography.save();
    logger.info('Experience entry updated', { biographyId: biography._id, index: idx });
    res.json({ experience: biography.experience });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/experience/${req.params.index}` });
    res.status(500).json({ error: 'Failed to update experience entry' });
  }
});

router.delete('/:id/experience/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const biography = await Biography.findById(id);
    if (!biography) return res.status(404).json({ error: 'Biography not found' });
    const idx = parseInt(index);
    if (idx < 0 || idx >= biography.experience.length) {
      return res.status(400).json({ error: 'Invalid experience index' });
    }
    biography.experience.splice(idx, 1);
    await biography.save();
    logger.info('Experience entry deleted', { biographyId: biography._id, index: idx });
    res.json({ experience: biography.experience });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/experience/${req.params.index}` });
    res.status(500).json({ error: 'Failed to delete experience entry' });
  }
});

// Get change history for specific biography
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    res.json({ history: biography.history });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}/history` });
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Delete biography
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const biography = await Biography.findById(id);

    if (!biography) {
      return res.status(404).json({ error: 'Biography not found' });
    }

    // Delete associated chat messages
    await ChatMessage.deleteMany({ biographyId: id });

    // Delete biography
    await Biography.findByIdAndDelete(id);

    logger.info('Biography deleted', { biographyId: id, title: biography.title });

    res.json({ 
      message: 'Biography deleted successfully',
      id 
    });
  } catch (error) {
    logger.logError(error, { route: `/api/biography/${req.params.id}` });
    res.status(500).json({ error: 'Failed to delete biography' });
  }
});

export default router;
