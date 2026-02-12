import mongoose from 'mongoose';

const contactInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true,
    trim: true
  },
  university: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    min: 1950,
    max: 2100
  }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  years: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const historySchema = new mongoose.Schema({
  biography: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  userAddedTags: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['initial', 'chat', 'manual', 'field-update', 'regenerate-keywords'],
    required: true
  },
  field: {
    type: String
  }
}, { _id: false });

const pendingUpdateSchema = new mongoose.Schema({
  updates: {
    jobTitle: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    businessFunction: {
      type: String,
      enum: ['Developer', 'UI/UX', 'Product Specialist', 'Product Manager', 'Other']
    },
    businessFunctionOther: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    yearsExperience: {
      type: Number,
      min: 0
    },
    contactInfo: contactInfoSchema
  },
  explanations: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const biographySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Biography'
  },
  // Basic Professional Information
  jobTitle: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  businessFunction: {
    type: String,
    enum: ['Developer', 'UI/UX', 'Product Specialist', 'Product Manager', 'Other']
  },
  businessFunctionOther: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  yearsExperience: {
    type: Number,
    min: 0
  },
  // Contact Information
  contactInfo: contactInfoSchema,
  // Biography Content (structured)
  summary: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  mentorSummary: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  experience: [experienceSchema],
  skills: [{
    type: String,
    trim: true
  }],
  // Education & Credentials
  education: [educationSchema],
  certifications: [{
    type: String,
    trim: true
  }],
  notableAchievements: [{
    type: String,
    trim: true
  }],
  // Legacy fields (deprecated but kept for backward compatibility)
  rawInput: {
    type: String
  },
  currentBiography: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  userAddedTags: [{
    type: String
  }],
  manuallyManagedTags: {
    type: Boolean,
    default: false
  },
  isLegacyFormat: {
    type: Boolean,
    default: false
  },
  // Metadata
  history: [historySchema],
  pendingUpdate: pendingUpdateSchema,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
biographySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Biography = mongoose.model('Biography', biographySchema);

export default Biography;
