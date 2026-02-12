import { useState } from 'react';
import './BiographyForm.css';

function BiographyForm({ onSubmit, initialData = null, isEditing = false, onCancel }) {
  const defaultData = {
    title: '',
    jobTitle: '',
    department: '',
    businessFunction: '',
    businessFunctionOther: '',
    location: '',
    yearsExperience: '',
    generateMentorSummary: false,
    contactInfo: {
      email: '',
      phone: '',
      linkedin: ''
    },
    summary: '',
    mentorSummary: '',
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    notableAchievements: []
  };

  const [formData, setFormData] = useState(initialData ? {
    ...defaultData,
    ...initialData,
    contactInfo: {
      ...defaultData.contactInfo,
      ...(initialData.contactInfo || {})
    }
  } : defaultData);

  const [errors, setErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const businessFunctionOptions = [
    'Developer',
    'UI/UX',
    'Product Specialist',
    'Product Manager',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [name]: value
      }
    }));
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', years: '', description: '' }]
    }));
  };

  const handleRemoveExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', university: '', year: '' }]
    }));
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setFormData(prev => ({
        ...prev,
        notableAchievements: [...prev.notableAchievements, newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      notableAchievements: prev.notableAchievements.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.jobTitle?.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.businessFunction) {
      newErrors.businessFunction = 'Business function is required';
    }

    if (formData.businessFunction === 'Other' && !formData.businessFunctionOther?.trim()) {
      newErrors.businessFunctionOther = 'Please specify your business function';
    }

    if (formData.summary && formData.summary.length > 500) {
      newErrors.summary = 'Summary must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Clean up data before submitting
    const cleanData = {
      ...formData,
      yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined
    };

    onSubmit(cleanData);
  };

  return (
    <form className="biography-form container" style={{ maxWidth: '900px' }} onSubmit={handleSubmit}>
      <h2 className="mb-4">{isEditing ? 'Edit Biography' : 'Create New Biography'}</h2>

      {/* Basic Information Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Basic Information</h3>
        
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Biography Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Professional Biography"
            className="form-control"
          />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="jobTitle" className="form-label">Job Title *</label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
              className={`form-control ${errors.jobTitle ? 'is-invalid' : ''}`}
            />
            {errors.jobTitle && <div className="invalid-feedback">{errors.jobTitle}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="department" className="form-label">Department *</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Engineering"
              className={`form-control ${errors.department ? 'is-invalid' : ''}`}
            />
            {errors.department && <div className="invalid-feedback">{errors.department}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="businessFunction" className="form-label">Business Function *</label>
          <select
            id="businessFunction"
            name="businessFunction"
            value={formData.businessFunction}
            onChange={handleChange}
            className={`form-select ${errors.businessFunction ? 'is-invalid' : ''}`}
          >
            <option value="">Select a function...</option>
            {businessFunctionOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.businessFunction && <div className="invalid-feedback">{errors.businessFunction}</div>}
        </div>

        {formData.businessFunction === 'Other' && (
          <div className="mb-3">
            <label htmlFor="businessFunctionOther" className="form-label">Specify Business Function *</label>
            <input
              type="text"
              id="businessFunctionOther"
              name="businessFunctionOther"
              value={formData.businessFunctionOther}
              onChange={handleChange}
              placeholder="e.g., Data Analyst"
              className={`form-control ${errors.businessFunctionOther ? 'is-invalid' : ''}`}
            />
            {errors.businessFunctionOther && <div className="invalid-feedback">{errors.businessFunctionOther}</div>}
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="location" className="form-label">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, CA"
              className="form-control"
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="yearsExperience" className="form-label">Years of Experience</label>
            <input
              type="number"
              id="yearsExperience"
              name="yearsExperience"
              value={formData.yearsExperience}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 5"
              className="form-control"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Contact Information</h3>
        
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.contactInfo.email}
            onChange={handleContactChange}
            placeholder="your.email@example.com"
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="phone" className="form-label">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.contactInfo.phone}
            onChange={handleContactChange}
            placeholder="+1 (555) 123-4567"
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="linkedin" className="form-label">LinkedIn</label>
          <input
            type="url"
            id="linkedin"
            name="linkedin"
            value={formData.contactInfo.linkedin}
            onChange={handleContactChange}
            placeholder="https://linkedin.com/in/yourprofile"
            className="form-control"
          />
        </div>
        </div>
      </div>

      {/* Biography Content Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Professional Summary</h3>
        
        <div className="mb-3">
          <label htmlFor="summary" className="form-label">
            Summary 
            <span className="float-end text-muted small">
              {formData.summary.length}/500
            </span>
          </label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Write a brief professional summary..."
            rows="4"
            maxLength="500"
            className={`form-control ${errors.summary ? 'is-invalid' : ''}`}
          />
          {errors.summary && <div className="invalid-feedback">{errors.summary}</div>}
        </div>

        {!isEditing && (
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="generateMentorSummary"
              name="generateMentorSummary"
              checked={!!formData.generateMentorSummary}
              onChange={handleCheckboxChange}
            />
            <label className="form-check-label" htmlFor="generateMentorSummary">
              Generate mentor summary (optional)
            </label>
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="mentorSummary" className="form-label">
            Mentor Summary
            <span className="float-end text-muted small">
              {(formData.mentorSummary || '').length}/2000
            </span>
          </label>
          <textarea
            id="mentorSummary"
            name="mentorSummary"
            value={formData.mentorSummary}
            onChange={handleChange}
            placeholder="Optional: short intro paragraph, then bullets starting with - "
            rows="5"
            maxLength="2000"
            className={`form-control ${errors.mentorSummary ? 'is-invalid' : ''}`}
            disabled={!isEditing && !!formData.generateMentorSummary && !(formData.mentorSummary || '').trim()}
          />
          {errors.mentorSummary && <div className="invalid-feedback">{errors.mentorSummary}</div>}
          {!isEditing && !!formData.generateMentorSummary && !(formData.mentorSummary || '').trim() && (
            <div className="form-text">Mentor summary will be generated after creation.</div>
          )}
        </div>
        </div>
      </div>

      {/* Experience Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Experience</h3>
        
        {formData.experience.map((exp, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="h6 mb-0">Position {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveExperience(index)}
                className="btn btn-danger btn-sm"
              >
                Remove
              </button>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="form-control"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="form-control"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Years</label>
              <input
                type="text"
                value={exp.years}
                onChange={(e) => handleExperienceChange(index, 'years', e.target.value)}
                placeholder="e.g., 2018-2021"
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                value={exp.description}
                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                placeholder="Describe your role and accomplishments..."
                rows="3"
                className="form-control"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddExperience}
          className="btn btn-primary"
        >
          + Add Experience
        </button>
        </div>
      </div>

      {/* Skills Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Skills</h3>
        
        <div>
          <div className="d-flex flex-wrap gap-2 mb-3" style={{ minHeight: '2rem' }}>
            {formData.skills.map((skill, index) => (
              <span key={index} className="badge bg-primary d-inline-flex align-items-center gap-2 py-2 px-3">
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="btn-close btn-close-white"
                  style={{ fontSize: '0.6rem', padding: '0', width: '0.8em', height: '0.8em' }}
                />
              </span>
            ))}
          </div>
          
          <div className="input-group">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Add a skill..."
              className="form-control"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Education</h3>
        
        {formData.education.map((edu, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="h6 mb-0">Education {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveEducation(index)}
                className="btn btn-danger btn-sm"
              >
                Remove
              </button>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Degree</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                placeholder="e.g., BS Computer Science"
                className="form-control"
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">University</label>
                <input
                  type="text"
                  value={edu.university}
                  onChange={(e) => handleEducationChange(index, 'university', e.target.value)}
                  placeholder="e.g., Stanford University"
                  className="form-control"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  value={edu.year}
                  onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                  placeholder="e.g., 2020"
                  min="1950"
                  max="2100"
                  className="form-control"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddEducation}
          className="btn btn-primary"
        >
          + Add Education
        </button>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Certifications</h3>
        
        <div>
          <ul className="list-group mb-3">
            {formData.certifications.map((cert, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {cert}
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(index)}
                  className="btn-close"
                  aria-label="Remove"
                />
              </li>
            ))}
          </ul>
          
          <div className="input-group">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
              placeholder="Add a certification..."
              className="form-control"
            />
            <button
              type="button"
              onClick={handleAddCertification}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Notable Achievements Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title h5 mb-3">Notable Achievements</h3>
        
        <div>
          <ul className="list-group mb-3">
            {formData.notableAchievements.map((achievement, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {achievement}
                <button
                  type="button"
                  onClick={() => handleRemoveAchievement(index)}
                  className="btn-close"
                  aria-label="Remove"
                />
              </li>
            ))}
          </ul>
          
          <div className="input-group">
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAchievement())}
              placeholder="Add an achievement..."
              className="form-control"
            />
            <button
              type="button"
              onClick={handleAddAchievement}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
        </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 pt-3 border-top">
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Update Biography' : 'Create Biography'}
        </button>
      </div>
    </form>
  );
}

export default BiographyForm;
