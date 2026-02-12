import { useEffect, useState } from 'react';
import './StructuredBiographyDisplay.css';

function StructuredBiographyDisplay({ biography, onEdit, onDelete, onUpdateTitle, onRegenerateMentorSummary, onUpdateMentorSummary, onRegenerateSummary, onUpdateSummary }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(biography?.title || '');

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryValue, setSummaryValue] = useState(biography?.summary || '');

  const [isEditingMentorSummary, setIsEditingMentorSummary] = useState(false);
  const [mentorSummaryValue, setMentorSummaryValue] = useState(biography?.mentorSummary || '');
  if (!biography) {
    return (
      <div className="container text-center py-5">
        <p className="text-muted fs-5">No biography available</p>
      </div>
    );
  }

  const displayBusinessFunction = biography.businessFunction === 'Other' 
    ? biography.businessFunctionOther 
    : biography.businessFunction;

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleValue(biography?.title || '');
    }
  }, [biography?.title, isEditingTitle]);

  useEffect(() => {
    if (!isEditingSummary) {
      setSummaryValue(biography?.summary || '');
    }
  }, [biography?.summary, isEditingSummary]);

  useEffect(() => {
    if (!isEditingMentorSummary) {
      setMentorSummaryValue(biography?.mentorSummary || '');
    }
  }, [biography?.mentorSummary, isEditingMentorSummary]);

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== biography.title) {
      onUpdateTitle(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(biography.title || '');
    setIsEditingTitle(false);
  };

  const handleSummarySave = () => {
    if (onUpdateSummary && summaryValue !== (biography.summary || '')) {
      onUpdateSummary(summaryValue);
    }
    setIsEditingSummary(false);
  };

  const handleSummaryCancel = () => {
    setSummaryValue(biography.summary || '');
    setIsEditingSummary(false);
  };

  const handleMentorSummarySave = () => {
    if (onUpdateMentorSummary && mentorSummaryValue !== (biography.mentorSummary || '')) {
      onUpdateMentorSummary(mentorSummaryValue);
    }
    setIsEditingMentorSummary(false);
  };

  const handleMentorSummaryCancel = () => {
    setMentorSummaryValue(biography.mentorSummary || '');
    setIsEditingMentorSummary(false);
  };

  const parseMentorSummary = (text) => {
    const raw = (text || '').trim();
    if (!raw) return { intro: '', bullets: [] };

    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const bullets = [];
    const introParts = [];

    for (const line of lines) {
      if (line.startsWith('- ')) {
        const bullet = line.slice(2).trim();
        if (bullet) bullets.push(bullet);
      } else {
        introParts.push(line);
      }
    }

    return {
      intro: introParts.join(' '),
      bullets
    };
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      {/* Header Section */}
      <div className="border-bottom pb-4 mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="flex-grow-1">
            {isEditingTitle ? (
              <div className="d-flex align-items-center gap-2 mb-3">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                  className="form-control form-control-lg"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="btn btn-success btn-sm">✓</button>
                <button onClick={handleTitleCancel} className="btn btn-danger btn-sm">✕</button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 mb-3">
                <h1 className="mb-0">{biography.title || 'Untitled Biography'}</h1>
                {onUpdateTitle && (
                  <button 
                    onClick={() => setIsEditingTitle(true)} 
                    className="btn btn-link btn-sm text-secondary"
                    title="Edit title"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            {biography.jobTitle && (
              <h2 className="text-primary fs-4 fw-normal mb-3">
                {biography.jobTitle}
                {biography.department && ` • ${biography.department}`}
              </h2>
            )}
            <div className="d-flex flex-wrap gap-3 text-muted">
              {biography.location && <span>📍 {biography.location}</span>}
              {biography.yearsExperience !== undefined && biography.yearsExperience !== null && (
                <span>
                  🕒 {biography.yearsExperience} {biography.yearsExperience === 1 ? 'year' : 'years'} of experience
                </span>
              )}
              {displayBusinessFunction && <span>💼 {displayBusinessFunction}</span>}
            </div>
          </div>
          
          <div className="d-flex gap-2">
            {onEdit && (
              <button onClick={onEdit} className="btn btn-primary">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="btn btn-danger">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {(biography.contactInfo?.email || biography.contactInfo?.phone || biography.contactInfo?.linkedin) && (
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="card-title h5 border-bottom pb-2 mb-3">Contact Information</h3>
            <div className="row g-3">
              {biography.contactInfo.email && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${biography.contactInfo.email}`} className="text-decoration-none">
                      {biography.contactInfo.email}
                    </a>
                  </div>
                </div>
              )}
              {biography.contactInfo.phone && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${biography.contactInfo.phone}`} className="text-decoration-none">
                      {biography.contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}
              {biography.contactInfo.linkedin && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2">
                    <span>💼</span>
                    <a href={biography.contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                      LinkedIn Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Professional Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h3 className="card-title h5 mb-0">Professional Summary</h3>
            <div className="d-flex align-items-center gap-2">
              {isEditingSummary ? (
                <>
                  <button onClick={handleSummarySave} className="btn btn-success btn-sm" title="Save professional summary">✓</button>
                  <button onClick={handleSummaryCancel} className="btn btn-danger btn-sm" title="Cancel">✕</button>
                </>
              ) : (
                <>
                  {onUpdateSummary && (
                    <button
                      onClick={() => setIsEditingSummary(true)}
                      className="btn btn-link btn-sm text-secondary"
                      title="Edit professional summary"
                      aria-label="Edit professional summary"
                    >
                      ✏️
                    </button>
                  )}
                  {onRegenerateSummary && (
                    <button
                      onClick={onRegenerateSummary}
                      className="btn btn-sm btn-outline-primary btn-regenerate"
                      title="Regenerate professional summary"
                      aria-label="Regenerate professional summary"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditingSummary ? (
            <div className="d-flex flex-column gap-2">
              <textarea
                value={summaryValue}
                onChange={(e) => setSummaryValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleSummaryCancel();
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSummarySave();
                }}
                className="form-control"
                rows={6}
                placeholder="Write a brief professional summary..."
              />
              <div className="text-muted small">
                Tip: press Esc to cancel, or Ctrl/Cmd+Enter to save.
              </div>
            </div>
          ) : biography.summary?.trim() ? (
            <p className="card-text lh-lg">{biography.summary}</p>
          ) : (
            <p className="text-muted fst-italic mb-0">No professional summary yet</p>
          )}
        </div>
      </div>

      {/* Mentor Summary */}
      {(() => {
        const parsed = parseMentorSummary(biography.mentorSummary);
        const hasContent = !!(biography.mentorSummary && biography.mentorSummary.trim());

        return (
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h3 className="card-title h5 mb-0">Mentor Summary</h3>
                <div className="d-flex align-items-center gap-2">
                  {isEditingMentorSummary ? (
                    <>
                      <button onClick={handleMentorSummarySave} className="btn btn-success btn-sm" title="Save mentor summary">✓</button>
                      <button onClick={handleMentorSummaryCancel} className="btn btn-danger btn-sm" title="Cancel">✕</button>
                    </>
                  ) : (
                    <>
                      {onUpdateMentorSummary && (
                        <button
                          onClick={() => setIsEditingMentorSummary(true)}
                          className="btn btn-link btn-sm text-secondary"
                          title="Edit mentor summary"
                          aria-label="Edit mentor summary"
                        >
                          ✏️
                        </button>
                      )}
                      {onRegenerateMentorSummary && (
                        <button
                          onClick={onRegenerateMentorSummary}
                          // disabled={loading}
                          className="btn btn-sm btn-outline-primary btn-regenerate"
                          title="Regenerate mentor summary"
                          aria-label="Regenerate mentor summary"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isEditingMentorSummary ? (
                <div className="d-flex flex-column gap-2">
                  <textarea
                    value={mentorSummaryValue}
                    onChange={(e) => setMentorSummaryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleMentorSummaryCancel();
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleMentorSummarySave();
                    }}
                    className="form-control"
                    rows={6}
                    placeholder="Write a short intro paragraph, then '-' bullets..."
                  />
                  <div className="text-muted small">
                    Tip: press Esc to cancel, or Ctrl/Cmd+Enter to save.
                  </div>
                </div>
              ) : hasContent ? (
                <>
                  {parsed.intro && <p className="card-text lh-lg">{parsed.intro}</p>}
                  {parsed.bullets.length > 0 && (
                    <ul className="mb-0">
                      {parsed.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  {!parsed.intro && parsed.bullets.length === 0 && (
                    <p className="card-text lh-lg">{biography.mentorSummary}</p>
                  )}
                </>
              ) : (
                <p className="text-muted fst-italic mb-0">No mentor summary yet</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Experience */}
      {biography.experience && biography.experience.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="card-title h5 border-bottom pb-2 mb-3">Experience</h3>
            <div className="d-flex flex-column gap-3">
              {biography.experience.map((exp, index) => (
                <div key={index} className="border-start border-primary border-4 ps-3 py-2">
                  <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
                    <h4 className="h6 mb-0">{exp.title}</h4>
                    <span className="text-muted small">{exp.years}</span>
                  </div>
                  <div className="text-primary fw-semibold mb-2">{exp.company}</div>
                  {exp.description && (
                    <p className="mb-0 text-muted">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Education */}
      {biography.education && biography.education.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="card-title h5 border-bottom pb-2 mb-3">Education</h3>
            <div className="d-flex flex-column gap-3">
              {biography.education.map((edu, index) => (
                <div key={index} className="bg-light rounded p-3">
                  <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
                    <h4 className="h6 mb-0">{edu.degree}</h4>
                    {edu.year && <span className="text-muted small">{edu.year}</span>}
                  </div>
                  <div className="text-primary fw-semibold">{edu.university}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certifications */}
      {biography.certifications && biography.certifications.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="card-title h5 border-bottom pb-2 mb-3">Certifications</h3>
            <div className="d-flex flex-wrap gap-2">
              {biography.certifications.map((cert, index) => (
                <span key={index} className="badge bg-primary d-flex align-items-center gap-2 py-2 px-3">
                  🏆 {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notable Achievements */}
      {biography.notableAchievements && biography.notableAchievements.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="card-title h5 border-bottom pb-2 mb-3">Notable Achievements</h3>
            <ul className="list-unstyled mb-0">
              {biography.notableAchievements.map((achievement, index) => (
                <li key={index} className="mb-2 ps-3">
                  <span className="text-primary me-2">▸</span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default StructuredBiographyDisplay;
