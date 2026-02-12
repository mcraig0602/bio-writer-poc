import { useState, useMemo } from 'react';

function TagsDisplay({ tags, onUpdateTags, onRegenerateKeywords, loading }) {
  const [newTag, setNewTag] = useState('');

  // Sort tags alphabetically
  const sortedTags = useMemo(() => {
    const tagsArray = Array.isArray(tags) ? tags : [];
    return tagsArray.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [tags]);

  const handleRemoveTag = (tagToRemove) => {
    const tagsArray = Array.isArray(tags) ? tags : [];
    const updatedTags = tagsArray.filter(tag => tag !== tagToRemove);
    onUpdateTags(updatedTags);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    
    if (!trimmedTag) return;
    
    const tagsArray = Array.isArray(tags) ? tags : [];
    
    // Check for duplicates (case insensitive)
    if (tagsArray.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
      alert('This skill already exists');
      return;
    }
    
    if (trimmedTag.length > 50) {
      alert('Skill must be 50 characters or less');
      return;
    }
    
    onUpdateTags([...tagsArray, trimmedTag]);
    setNewTag('');
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="card-title h5 mb-0">Skills</h3>
          {onRegenerateKeywords && (
            <button
              onClick={onRegenerateKeywords}
              disabled={loading}
              className="btn btn-sm btn-outline-primary btn-regenerate"
              title="Regenerate keywords from biography"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
          )}
        </div>
        
        <div className="d-flex flex-wrap gap-2 mb-3">
          {sortedTags && sortedTags.length > 0 ? (
            sortedTags.map((tag, index) => (
              <span key={index} className="badge bg-primary d-inline-flex align-items-center gap-2 py-2 px-3">
                <span>{tag}</span>
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  disabled={loading}
                  aria-label={`Remove ${tag}`}
                  className="btn-close btn-close-white"
                  style={{ fontSize: '0.6rem', padding: '0', width: '0.8em', height: '0.8em' }}
                />
              </span>
            ))
          ) : (
            <p className="text-muted fst-italic mb-0">No skills yet</p>
          )}
        </div>
        
        <form onSubmit={handleAddTag} className="d-flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add skill..."
            disabled={loading}
            maxLength={50}
            className="form-control form-control-sm"
          />
          <button 
            type="submit" 
            disabled={loading || !newTag.trim()}
            className="btn btn-primary btn-sm"
          >
            {loading ? 'Saving...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TagsDisplay;
