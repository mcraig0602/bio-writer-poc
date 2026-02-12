import { useState, useEffect } from 'react';
import api from '../services/api';

function HistoryLog({ biographyId }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (biographyId) {
      loadHistory();
    }
  }, [biographyId]);

  const loadHistory = async () => {
    if (!biographyId) return;
    
    try {
      const data = await api.getHistory(biographyId);
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSourceLabel = (source) => {
    const labels = {
      initial: 'Initial Generation',
      chat: 'Chat Refinement',
      manual: 'Manual Edit'
    };
    return labels[source] || source;
  };

  const getSourceBadgeClass = (source) => {
    const map = {
      initial: 'text-bg-primary',
      chat: 'text-bg-info',
      manual: 'text-bg-secondary'
    };
    return map[source] || 'text-bg-dark';
  };

  if (!biographyId) return null;

  return (
    <div className="card">
      <div className="card-header">
        <button
          type="button"
          className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-between"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
        >
          <span>Change History</span>
          <span className="badge text-bg-secondary">{history.length}</span>
        </button>
      </div>

      <div className={`collapse ${isOpen ? 'show' : ''}`}>
        <div className="list-group list-group-flush" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div className="list-group-item text-muted fst-italic">No history yet</div>
          ) : (
            history.map((entry, index) => (
              <div key={index} className="list-group-item">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <span className={`badge ${getSourceBadgeClass(entry.source)}`}>{getSourceLabel(entry.source)}</span>
                  <small className="text-muted">{formatDate(entry.timestamp)}</small>
                </div>

                {entry.biography && (
                  <div className="text-body" style={{ whiteSpace: 'pre-wrap' }}>
                    {entry.biography}
                  </div>
                )}

                {entry.tags?.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="badge text-bg-primary">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryLog;
