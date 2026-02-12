import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import BiographyForm from './components/BiographyForm';
import StructuredBiographyDisplay from './components/StructuredBiographyDisplay';
import BiographyList from './components/BiographyList';
import TagsDisplay from './components/TagsDisplay';
import ChatPanel from './components/ChatPanel';
import HistoryLog from './components/HistoryLog';
import ThemeToggle from './components/ThemeToggle';
import api from './services/api';
import './App.css';

function App() {
  const [currentBiographyId, setCurrentBiographyId] = useState(null);
  const [biographyData, setBiographyData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isEditingBiography, setIsEditingBiography] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadMostRecentBiography();
  }, []);

  const loadMostRecentBiography = async () => {
    try {
      const data = await api.getCurrentBiography();
      if (data) {
        setCurrentBiographyId(data.id);
        setBiographyData(data);
        await loadChatMessages(data.id);
      }
    } catch (error) {
      console.error('Failed to load biography:', error);
    }
  };

  const loadBiography = async (id) => {
    if (!id) {
      setCurrentBiographyId(null);
      setBiographyData(null);
      setChatMessages([]);
      setShowNewForm(false);
      setIsEditingBiography(false);
      return;
    }

    try {
      const data = await api.getBiography(id);
      setCurrentBiographyId(data.id);
      setBiographyData(data);
      await loadChatMessages(id);
      setShowNewForm(false);
      setIsEditingBiography(false);
    } catch (error) {
      setError('Failed to load biography');
      console.error('Error loading biography:', error);
    }
  };

  const loadChatMessages = async (biographyId) => {
    if (!biographyId) return;
    
    try {
      const data = await api.getChatMessages(biographyId);
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleCreateBiography = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      console.log(formData)
      const data = await api.generateBiography(formData);
      setCurrentBiographyId(data.id);
      setBiographyData(data);
      setChatMessages([]);
      setShowNewForm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to create biography.');
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBiography = async (formData) => {
    if (!currentBiographyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.editBiography(currentBiographyId, formData);
      setBiographyData(data);
      setIsEditingBiography(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to save biography.');
      console.error('Edit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBiography = async () => {
    if (!currentBiographyId) return;
    
    if (!confirm('Are you sure you want to delete this biography?')) {
      return;
    }
    
    try {
      await api.deleteBiography(currentBiographyId);
      setCurrentBiographyId(null);
      setBiographyData(null);
      setChatMessages([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to delete biography.');
      console.error('Delete error:', error);
    }
  };

  const handleUpdateSkills = async (newSkills) => {
    if (!currentBiographyId) return;
    
    try {
      const data = await api.updateField(currentBiographyId, 'skills', newSkills);
      setBiographyData(prev => ({ ...prev, skills: newSkills }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to update skills.');
      console.error('Skills update error:', error);
    }
  };

  const handleRegenerateKeywords = async () => {
    if (!currentBiographyId) return;
    
    if (!confirm('This will replace all current skills with AI-generated keywords from your biography. Continue?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.regenerateKeywords(currentBiographyId);
      setBiographyData(prev => ({ ...prev, skills: data.skills }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to regenerate keywords.');
      console.error('Regenerate keywords error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMentorSummary = async () => {
    if (!currentBiographyId) return;

    if (!confirm('This will regenerate the mentor summary using AI. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.regenerateMentorSummary(currentBiographyId);
      setBiographyData(prev => ({ ...prev, mentorSummary: data.mentorSummary }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to regenerate mentor summary.');
      console.error('Regenerate mentor summary error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!currentBiographyId) return;

    if (!confirm('This will regenerate the professional summary using AI. Continue?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.regenerateSummary(currentBiographyId);
      setBiographyData(prev => ({ ...prev, summary: data.summary }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to regenerate summary.');
      console.error('Regenerate summary error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async (newTitle) => {
    if (!currentBiographyId) return;
    
    try {
      await api.updateTitle(currentBiographyId, newTitle);
      setBiographyData(prev => ({ ...prev, title: newTitle }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to update title.');
      console.error('Title update error:', error);
    }
  };

  const handleUpdateMentorSummary = async (newMentorSummary) => {
    if (!currentBiographyId) return;

    try {
      await api.updateField(currentBiographyId, 'mentorSummary', newMentorSummary);
      setBiographyData(prev => ({ ...prev, mentorSummary: newMentorSummary }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to update mentor summary.');
      console.error('Mentor summary update error:', error);
    }
  };

  const handleUpdateSummary = async (newSummary) => {
    if (!currentBiographyId) return;

    try {
      await api.updateField(currentBiographyId, 'summary', newSummary);
      setBiographyData(prev => ({ ...prev, summary: newSummary }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      setError('Failed to update summary.');
      console.error('Summary update error:', error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!currentBiographyId) return;
    
    setLoading(true);
    setError(null);

    // Generate temporary IDs for optimistic updates
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;

    // Create optimistic messages
    const userMessage = {
      _id: tempUserId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const assistantLoadingMessage = {
      _id: tempAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true
    };

    // Add optimistic messages immediately
    setChatMessages(prev => [...prev, userMessage, assistantLoadingMessage]);

    try {
      const data = await api.sendChatMessage(currentBiographyId, message);
      setBiographyData(prev => ({ ...prev, ...data }));
      setRefreshTrigger(prev => prev + 1);
      // Reload messages from server (replaces optimistic messages with real ones)
      await loadChatMessages(currentBiographyId);
    } catch (error) {
      setError('Failed to refine biography.');
      console.error('Chat error:', error);

      // Remove optimistic messages on error
      setChatMessages(prev => prev.filter(msg => msg._id !== tempUserId && msg._id !== tempAssistantId));
    } finally {
      setLoading(false);
    }
  };

  const handleNewBiography = () => {
    setShowNewForm(true);
    setCurrentBiographyId(null);
    setBiographyData(null);
    setChatMessages([]);
    setIsEditingBiography(false);
  };

  return (
    <ThemeProvider>
      <div className="app">
        <header>
          <h1>Biography Generator POC</h1>
          <ThemeToggle />
        </header>

        {error && (
          <div className="container" style={{ maxWidth: '1600px' }}>
            <div className="alert alert-danger alert-dismissible fade show mt-3" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
            </div>
          </div>
        )}

        <div className="app-container container-fluid">
          <div className="row g-4">
            <div className="col-12 col-lg-3">
              <div className="sidebar">
                <BiographyList
                  currentBiographyId={currentBiographyId}
                  onSelectBiography={loadBiography}
                  onNewBiography={handleNewBiography}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>

            <div className={currentBiographyId ? 'col-12 col-lg-6' : 'col-12 col-lg-9'}>
              <div className="left-panel">
                {showNewForm ? (
                  <BiographyForm onSubmit={handleCreateBiography} loading={loading} />
                ) : isEditingBiography && currentBiographyId ? (
                  <BiographyForm
                    onSubmit={handleUpdateBiography}
                    initialData={biographyData}
                    isEditing={true}
                    loading={loading}
                    onCancel={() => setIsEditingBiography(false)}
                  />
                ) : currentBiographyId && biographyData ? (
                  <>
                    <StructuredBiographyDisplay
                      biography={biographyData}
                      onEdit={() => setIsEditingBiography(true)}
                      onDelete={handleDeleteBiography}
                      onUpdateTitle={handleUpdateTitle}
                      onRegenerateMentorSummary={handleRegenerateMentorSummary}
                      onUpdateMentorSummary={handleUpdateMentorSummary}
                      onRegenerateSummary={handleRegenerateSummary}
                      onUpdateSummary={handleUpdateSummary}
                    />
                    <TagsDisplay
                      tags={biographyData.skills || []}
                      onUpdateTags={handleUpdateSkills}
                      onRegenerateKeywords={handleRegenerateKeywords}
                      loading={loading}
                    />
                    <HistoryLog biographyId={currentBiographyId} />
                  </>
                ) : (
                  <div className="card text-center shadow-sm">
                    <div className="card-body p-5">
                      <h2 className="card-title mb-3">Welcome to Biography Generator</h2>
                      <p className="card-text text-muted mb-4">Select a biography from the list or create a new one to get started.</p>
                      <button onClick={handleNewBiography} className="btn btn-primary btn-lg">
                        Create Your First Biography
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {currentBiographyId && (
              <div className="col-12 col-lg-3">
                <div className="right-panel">
                  <ChatPanel
                    onSendMessage={handleSendMessage}
                    messages={chatMessages}
                    loading={loading}
                    pendingUpdate={biographyData?.pendingUpdate ?? null}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
