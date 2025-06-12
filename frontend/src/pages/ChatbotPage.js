import React, { useState } from 'react';

const Navbar = () => {
    const [activeIcon, setActiveIcon] = useState('');
    const icons = [
      { key: 'notifications', label: 'Notifications', emoji: '🔔' },
      { key: 'help', label: 'Help', emoji: '❓' },
      { key: 'settings', label: 'Settings', emoji: '⚙️' },
      { key: 'profile', label: 'Profile', emoji: '👤' },
    ];
    return (
      <nav className="navbar">
        <div className="navbar-logo">SecureTransact</div>
        <div className="navbar-actions">
          {icons.map(icon => (
            <button
              key={icon.key}
              className={`navbar-icon${activeIcon === icon.key ? ' active' : ''}`}
              title={icon.label}
              aria-label={icon.label}
              onClick={() => setActiveIcon(icon.key)}
              type="button"
            >
              <span role="img" aria-label={icon.label}>{icon.emoji}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  };

const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you with this transaction?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = e => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { from: 'user', text: input }]);
      setInput('');
      setTimeout(() => {
        setMessages(msgs => [...msgs, { from: 'bot', text: 'This is a demo AI response about your transaction.' }]);
      }, 800);
    }
  };

  return (
    <>
    <Navbar />
    <div style={{ minHeight: '100vh', background: '#f5f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#e3f2fd', borderRadius: 20, boxShadow: '0 4px 24px rgba(1, 118, 211, 0.10)', padding: 32, maxWidth: 500, width: '100%', margin: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 48, color: '#0176D3', marginBottom: 8 }} role="img" aria-label="bot">🤖</div>
        <h2 style={{ color: '#0176D3', marginBottom: 24, fontWeight: 700 }}>AI Chatbot</h2>
        <div style={{ width: '100%', minHeight: 180, marginBottom: 18, background: '#fff', borderRadius: 12, padding: 16, boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(1, 118, 211, 0.08)', overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 10, textAlign: msg.from === 'bot' ? 'left' : 'right' }}>
              <span style={{
                display: 'inline-block',
                background: msg.from === 'bot' ? '#e3f2fd' : '#0176D3',
                color: msg.from === 'bot' ? '#0176D3' : '#fff',
                borderRadius: 16,
                padding: '8px 16px',
                maxWidth: '80%',
                fontSize: 16,
                boxShadow: '0 1px 4px rgba(1, 118, 211, 0.08)'
              }}>{msg.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', gap: 10 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about this transaction..."
            style={{ flex: 1, borderRadius: 20, border: 'none', padding: '10px 18px', fontSize: 16, outline: 'none', background: '#fff', color: '#222', boxShadow: '0 1px 4px rgba(1, 118, 211, 0.08)' }}
          />
          <button type="submit" style={{ background: '#0176D3', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 22px', fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>Send</button>
        </form>
      </div>
    </div>
    </>
    
  );
};

export default ChatbotPage; 