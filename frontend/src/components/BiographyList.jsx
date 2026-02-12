import { useState, useEffect } from 'react';
import api from '../services/api';

function BiographyList({ currentBiographyId, onSelectBiography, onNewBiography, refreshTrigger }) {
  const [biographies, setBiographies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadBiographies();
  }, [refreshTrigger]);

  const loadBiographies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listBiographies();
      setBiographies(data.biographies || []);
    } catch (error) {
      setError('Failed to load biographies');
      console.error('Error loading biographies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    try {
      await api.deleteBiography(id);
      
      // Reload list
      await loadBiographies();
      
      // If deleted biography was selected, clear selection
      if (id === currentBiographyId) {
        onSelectBiography(null);
      }
      
      setShowDeleteConfirm(null);
    } catch (error) {
      setError(`Failed to delete "${title}"`);
      console.error('Error deleting biography:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="biography-list card">
        <div className="card-body text-muted">Loading biographies...</div>
      </div>
    );
  }

  return (
    <div className="biography-list card">
      <div className="biography-list-header card-header d-flex align-items-center justify-content-between">
        <h2 className="h5 mb-0">Biographies ({biographies.length})</h2>
        <button
          onClick={onNewBiography}
          className="btn btn-primary btn-round"
          title="New Biography"
        >
          +
        </button>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {biographies.length === 0 ? (
          <div className="no-biographies text-center text-muted py-3">
            <p className="mb-0">No biographies yet. Create your first one!</p>
          </div>
        ) : (
          <div className="biography-items list-group list-group-flush">
            {biographies.map((bio) => (
              <div
                key={bio.id}
                className={`biography-item list-group-item list-group-item-action ${bio.id === currentBiographyId ? 'active' : ''}`}
              >
                <div
                  className="biography-item-content"
                  onClick={() => onSelectBiography(bio.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectBiography(bio.id);
                    }
                  }}
                >
                  <h3 className="h6 mb-1 text-truncate">{bio.title}</h3>
                  <div className="biography-item-subtitle small text-muted">
                    {bio.jobTitle && bio.department && (
                      <span className="job-info">{bio.jobTitle} • {bio.department}</span>
                    )}
                    {bio.location && (
                      <span className="location-info">📍 {bio.location}</span>
                    )}
                  </div>
                  <div className="biography-item-meta small text-muted">
                    <span className="date">Updated {formatDate(bio.updatedAt)}</span>
                    {bio.yearsExperience !== undefined && bio.yearsExperience !== null && (
                      <span className="experience">
                        {bio.yearsExperience} {bio.yearsExperience === 1 ? 'year' : 'years'}
                      </span>
                    )}
                    {bio.skills && bio.skills.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {bio.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="badge rounded-pill text-bg-secondary">{skill}</span>
                        ))}
                        {bio.skills.length > 3 && (
                          <span className="badge rounded-pill text-bg-secondary">+{bio.skills.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-outline-danger btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(bio.id);
                  }}
                  title="Delete biography"
                  type="button"
                >
                  🗑️
                </button>

                {showDeleteConfirm === bio.id && (
                  <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                    <p className="mb-2">Delete "{bio.title}"?</p>
                    <div className="delete-confirm-buttons">
                      <button
                        onClick={() => handleDelete(bio.id, bio.title)}
                        className="btn btn-danger"
                        type="button"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="btn btn-secondary"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BiographyList;
