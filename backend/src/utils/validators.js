/**
 * Validation utilities for biography structured fields
 */

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email) return { valid: true }; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    valid: emailRegex.test(email),
    error: emailRegex.test(email) ? null : 'Invalid email format'
  };
}

/**
 * Validate phone number (flexible format)
 */
export function validatePhone(phone) {
  if (!phone) return { valid: true }; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return {
    valid: phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10,
    error: phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10 
      ? null 
      : 'Phone number must contain at least 10 digits'
  };
}

/**
 * Validate LinkedIn URL
 */
export function validateLinkedIn(url) {
  if (!url) return { valid: true }; // Optional field
  const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/;
  return {
    valid: linkedInRegex.test(url),
    error: linkedInRegex.test(url) ? null : 'Invalid LinkedIn URL format'
  };
}

/**
 * Validate that biography text is valid (not an error message)
 * @param {string} text - The biography text to validate
 * @returns {boolean} - True if valid, false if it appears to be an error message
 */
export function isValidBiographyText(text) {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // Check for common error phrases that indicate LLM confusion
  const errorPhrases = [
    "I don't have",
    "Please provide",
    "Could you please share",
    "Unfortunately",
    "I need the",
    "share it now",
    "no original biography",
    "can't assist without",
    "I'll be happy to help",
    "provide the biography text"
  ];

  const lowerText = text.toLowerCase();
  return !errorPhrases.some(phrase => lowerText.includes(phrase.toLowerCase()));
}

/**
 * Validate year (between 1950 and current year + 10)
 */
export function validateYear(year) {
  if (!year) return { valid: true }; // Optional field
  const currentYear = new Date().getFullYear();
  const isValid = year >= 1950 && year <= currentYear + 10;
  return {
    valid: isValid,
    error: isValid ? null : `Year must be between 1950 and ${currentYear + 10}`
  };
}

/**
 * Validate business function with 'Other' handling
 */
export function validateBusinessFunction(businessFunction, businessFunctionOther) {
  const validFunctions = ['Developer', 'UI/UX', 'Product Specialist', 'Product Manager', 'Other'];
  
  if (!businessFunction) {
    return { valid: false, error: 'Business function is required' };
  }
  
  if (!validFunctions.includes(businessFunction)) {
    return { valid: false, error: 'Invalid business function' };
  }
  
  if (businessFunction === 'Other' && (!businessFunctionOther || businessFunctionOther.trim() === '')) {
    return { valid: false, error: 'Please specify business function when selecting "Other"' };
  }
  
  return { valid: true };
}

/**
 * Validate contact info object
 */
export function validateContactInfo(contactInfo) {
  if (!contactInfo) return { valid: true }; // Optional field
  
  const errors = [];
  
  if (contactInfo.email) {
    const emailResult = validateEmail(contactInfo.email);
    if (!emailResult.valid) errors.push(emailResult.error);
  }
  
  if (contactInfo.phone) {
    const phoneResult = validatePhone(contactInfo.phone);
    if (!phoneResult.valid) errors.push(phoneResult.error);
  }
  
  if (contactInfo.linkedin) {
    const linkedInResult = validateLinkedIn(contactInfo.linkedin);
    if (!linkedInResult.valid) errors.push(linkedInResult.error);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Validate education entry
 */
export function validateEducation(education) {
  const errors = [];
  
  if (!education.degree || education.degree.trim() === '') {
    errors.push('Degree is required');
  }
  
  if (!education.university || education.university.trim() === '') {
    errors.push('University is required');
  }
  
  if (education.year) {
    const yearResult = validateYear(education.year);
    if (!yearResult.valid) errors.push(yearResult.error);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Validate experience entry
 */
export function validateExperience(experience) {
  const errors = [];
  
  if (!experience.title || experience.title.trim() === '') {
    errors.push('Job title is required');
  }
  
  if (!experience.company || experience.company.trim() === '') {
    errors.push('Company is required');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Master validation function for all biography fields
 */
export function validateBiographyFields(data) {
  const errors = [];
  
  // Required fields
  if (!data.jobTitle || data.jobTitle.trim() === '') {
    errors.push({ field: 'jobTitle', message: 'Job title is required' });
  }
  
  if (!data.department || data.department.trim() === '') {
    errors.push({ field: 'department', message: 'Department is required' });
  }
  
  // Business function validation
  const businessFunctionResult = validateBusinessFunction(
    data.businessFunction, 
    data.businessFunctionOther
  );
  if (!businessFunctionResult.valid) {
    errors.push({ field: 'businessFunction', message: businessFunctionResult.error });
  }
  
  // Years of experience validation
  if (data.yearsExperience !== undefined && data.yearsExperience !== null) {
    if (data.yearsExperience < 0) {
      errors.push({ field: 'yearsExperience', message: 'Years of experience cannot be negative' });
    }
  }
  
  // Summary length validation
  if (data.summary && data.summary.length > 500) {
    errors.push({ field: 'summary', message: 'Summary must be 500 characters or less' });
  }

  // Mentor summary length validation (optional)
  if (data.mentorSummary && typeof data.mentorSummary === 'string' && data.mentorSummary.length > 2000) {
    errors.push({ field: 'mentorSummary', message: 'Mentor summary must be 2000 characters or less' });
  }
  
  // Contact info validation
  if (data.contactInfo) {
    const contactResult = validateContactInfo(data.contactInfo);
    if (!contactResult.valid) {
      errors.push({ field: 'contactInfo', message: contactResult.errors.join(', ') });
    }
  }
  
  // Education array validation
  if (data.education && Array.isArray(data.education)) {
    data.education.forEach((edu, index) => {
      const eduResult = validateEducation(edu);
      if (!eduResult.valid) {
        errors.push({ 
          field: `education[${index}]`, 
          message: eduResult.errors.join(', ') 
        });
      }
    });
  }
  
  // Experience array validation
  if (data.experience && Array.isArray(data.experience)) {
    data.experience.forEach((exp, index) => {
      const expResult = validateExperience(exp);
      if (!expResult.valid) {
        errors.push({ 
          field: `experience[${index}]`, 
          message: expResult.errors.join(', ') 
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}
