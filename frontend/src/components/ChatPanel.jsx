import { useState, useEffect, useRef } from 'react';

function ChatPanel({ onSendMessage, messages, loading }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessage('');
  };

  return (
    <div className="card h-100 chat-panel">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h2 className="h5 mb-0">Refine Biography</h2>
        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted small">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>Thinking…</span>
          </div>
        )}
      </div>

      <div className="card-body p-0 d-flex flex-column" style={{ minHeight: 0 }}>
        <div
          className="flex-grow-1 overflow-auto px-3 py-3 d-flex flex-column gap-2"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 ? (
            <div className="text-muted fst-italic">
              Start a conversation to refine your biography…
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';

              const timestampDate = msg.timestamp ? new Date(msg.timestamp) : null;
              const timestampTitle =
                timestampDate && !Number.isNaN(timestampDate.getTime())
                  ? timestampDate.toLocaleString()
                  : undefined;

              return (
                <div
                  key={msg._id ?? `${msg.role}-${index}`}
                  className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`d-flex flex-column ${
                      isUser ? 'align-items-end' : 'align-items-start'
                    }`}
                    style={{ maxWidth: '100%' }}
                  >
                    <div
                      className={`d-flex align-items-center gap-2 mb-1 ${
                        isUser ? 'justify-content-end' : 'justify-content-start'
                      }`}
                    >
                      <span className="chat-sender-label small">{isUser ? 'You' : 'Assistant'}</span>
                      {msg.isLoading && (
                        <span
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div
                      className={`chat-bubble ${
                        isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
                      }`}
                      title={timestampTitle}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.isLoading ? '…' : msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="card-footer bg-body">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask to refine (e.g., “Make it more formal”)"
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !message.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
