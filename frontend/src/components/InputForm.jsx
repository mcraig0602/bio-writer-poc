import { useState } from 'react';

function InputForm({ onSubmit, loading }) {
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input, title.trim() || 'Untitled Biography');
    }
  };

  return (
    <div className="input-form">
      <h2>Create New Biography</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title (optional)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., John Doe - Software Engineer"
            disabled={loading}
            maxLength={100}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="rawInput">Raw Description</label>
          <textarea
            id="rawInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your raw description here..."
            rows={8}
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Generating...' : 'Generate Biography'}
        </button>
      </form>
    </div>
  );
}

export default InputForm;
