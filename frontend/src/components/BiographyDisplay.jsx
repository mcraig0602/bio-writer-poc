import { useState } from 'react';

function BiographyDisplay({ biography, title, onEdit, onUpdateTitle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(biography);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleSave = () => {
    onEdit(editedBio);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedBio(biography);
    setIsEditing(false);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleCancelTitle = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };

  return (
    <div className="biography-display">
      <div className="biography-header">
        {isEditingTitle ? (
          <div className="title-edit">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitle();
              }}
              maxLength={100}
              autoFocus
            />
            <button onClick={handleSaveTitle} className="btn-small">✓</button>
            <button onClick={handleCancelTitle} className="btn-small">✕</button>
          </div>
        ) : (
          <h2 onClick={() => setIsEditingTitle(true)} title="Click to edit title">
            {title} ✏️
          </h2>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            rows={10}
          />
          <div className="edit-buttons">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="biography-text">{biography}</p>
          <button onClick={() => setIsEditing(true)}>Edit Biography</button>
        </div>
      )}
    </div>
  );
}

export default BiographyDisplay;
