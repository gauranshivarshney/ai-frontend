import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [copilotReply, setCopilotReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = () => {
    axios.get('https://ai-backend-u076.onrender.com/api/conversations')
      .then(res => setConversations(res.data));
  };

  useEffect(fetchConversations, []);
  useEffect(() => scrollToBottom(), [activeConvo]);

  const formatTime = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelect = id => {
    axios.get(`https://ai-backend-u076.onrender.com/api/conversations/${id}`)
      .then(res => {
        setActiveConvo(res.data);
        setCopilotReply('');
        setMenuOpen(false);
      });
  };

  const createNewConversation = () => {
    if (!newUserName.trim()) return;
    axios.post('https://ai-backend-u076.onrender.com/api/conversations', { user: newUserName.trim() })
      .then(res => {
        setConversations(prev => [...prev, res.data]);
        setNewUserName('');
        setActiveConvo(res.data);
      });
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    axios.post(`https://ai-backend-u076.onrender.com/api/conversations/${activeConvo.id}/reply`, { text: replyText })
      .then(res => {
        setActiveConvo(res.data);
        setConversations(prev => prev.map(
          c => (c.id === res.data.id ? res.data : c)
        ));
        setReplyText('');
      })
      .finally(() => setIsSending(false));
  };

  const askCopilot = () => {
    if (!activeConvo) return;
    setCopilotLoading(true);
    axios.post('https://ai-backend-u076.onrender.com/api/copilot', {
      question: 'How do I get a refund?',
      history: activeConvo.messages,
    })
      .then(res => setCopilotReply(res.data.reply))
      .finally(() => setCopilotLoading(false));
  };

  const deleteActiveConversation = () => {
    if (!activeConvo) return;
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    axios.delete(`https://ai-backend-u076.onrender.com/api/conversations/${activeConvo.id}`)
      .then(() => {
        setConversations(prev => prev.filter(c => c.id !== activeConvo.id));
        closeConversation();
      })
      .catch(err => alert('Failed to delete conversation'));
  };

  const closeConversation = () => {
    setActiveConvo(null);
    setCopilotReply('');
    setReplyText('');
    setMenuOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>Your Inbox</h2>
        {conversations.map(convo => (
          <div
            key={convo.id}
            className={`conversation ${activeConvo?.id === convo.id ? 'active' : ''}`}
            onClick={() => handleSelect(convo.id)}
          >
            <div className="user-avatar">
              {convo.user.charAt(0).toUpperCase()}
            </div>

            <div className="conversation-details">
              <div className="row">
                <strong>{convo.user}</strong>
              </div>
              <p>{convo.lastMessage}</p>
            </div>
          </div>
        ))}

        <div className="new-convo">
          <input
            type="text"
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
            placeholder="New user"
            onKeyDown={e => e.key === 'Enter' && createNewConversation()}
          />
          <button
            onClick={createNewConversation}
            disabled={!newUserName.trim()}
            className="add-button"
          >
            Add
          </button>
        </div>
      </aside>

      <main className="chat-panel">
        {activeConvo ? (
          <>
            <div className="chat-header">
              <h3>{activeConvo.user}</h3>
              <div className="menu-container">
                <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
                {menuOpen && (
                  <div className="menu-dropdown">
                    <button className="menu-item delete" onClick={deleteActiveConversation}>Delete Conversation</button>
                    <button className="menu-item" onClick={closeConversation}>Close Chat</button>
                  </div>
                )}
              </div>
            </div>

            <div className="messages">
              {activeConvo.messages.map((msg, idx) => {
                return (
                  <React.Fragment key={idx}>
                    <div className={msg.from === 'agent' ? 'agent-msg' : 'user-msg'}>
                      {msg.text}
                      <span className="timestamp">{formatTime(msg.timestamp)}</span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-box">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                onKeyDown={e => e.key === 'Enter' && sendReply()}
                disabled={isSending}
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || isSending}
                style={{ opacity: (!replyText.trim() || isSending) ? 0.5 : 1 }}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <p>Select a conversation to view</p>
        )}
      </main>

      <section className="copilot-panel">
        <h3>AI Copilot</h3>
        <button
          className="ask"
          onClick={askCopilot}
          disabled={copilotLoading || !activeConvo}
        >
          {copilotLoading ? 'Thinking…' : 'Ask: How do I get a refund?'}
        </button>
        <p className="copilot-reply">{copilotReply}</p>
      </section>
    </div>
  );
}

export default App;