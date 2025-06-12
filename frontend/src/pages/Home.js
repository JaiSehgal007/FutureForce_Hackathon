import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const paymentActions = [
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01"/></svg>
    ), label: 'Scan any\nQR code' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="M17 21v-2a4 4 0 0 0-8 0v2"/><rect x="2" y="2" width="20" height="20" rx="5"/></svg>
    ), label: 'Pay \ncontacts' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 17v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/><path d="M22 12h-4m0 0l2-2m-2 2l2 2"/></svg>
    ), label: 'Pay phone\nnumber' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10v11h18V10"/><path d="M12 2v8"/><path d="M8 6h8"/></svg>
    ), label: 'Bank\ntransfer' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    ), label: 'Pay UPI ID\nor number' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-8"/><path d="M8 12h8"/></svg>
    ), label: 'Self\ntransfer' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h6"/></svg>
    ), label: 'Pay \nbills' },
  { icon: (
      <svg width="32" height="32" fill="none" stroke="#0176D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 18v.01"/></svg>
    ), label: 'Mobile\nrecharge' },
];

const Navbar = () => {
  const [activeIcon, setActiveIcon] = useState('');
  const navigate = useNavigate();
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
          onClick={() => {
            setActiveIcon(icon.key);
            if (icon.key === 'profile') navigate('/profile');
          }}
          type="button"
        >
            <span role="img" aria-label={icon.label}>{icon.emoji}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const initialContacts = [
  'John Doe', 'Jane Smith', 'Mike Johnson', 'Alice Brown', 'Bob Lee', 'Charlie Kim',
  'Diana Ross', 'Eve Adams', 'Frank White', 'Grace Hopper', 'Henry Ford', 'Ivy Lane',
  'Jack Black', 'Karen Page', 'Liam Young', 'Mona Lisa', 'Nina Simone', 'Oscar Wilde',
  'Paul Allen', 'Quincy Jones', 'Rachel Green', 'Steve Jobs', 'Tina Fey', 'Uma Thurman',
  'Victor Hugo', 'Wendy Darling', 'Xander Cage', 'Yara Shahidi', 'Zane Malik',
];

const transactions = [
  { type: 'Sent', name: 'John Doe', amount: 120, date: '2024-06-01' },
  { type: 'Received', name: 'Jane Smith', amount: 75, date: '2024-06-02' },
  { type: 'Sent', name: 'Mike Johnson', amount: 200, date: '2024-06-03' },
  { type: 'Received', name: 'Alice Brown', amount: 50, date: '2024-06-04' },
  { type: 'Sent', name: 'Bob Lee', amount: 300, date: '2024-06-05' },
  { type: 'Received', name: 'Charlie Kim', amount: 180, date: '2024-06-06' },
  { type: 'Sent', name: 'Diana Ross', amount: 90, date: '2024-06-07' },
  { type: 'Received', name: 'Eve Adams', amount: 220, date: '2024-06-08' },
];

const Home = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);

  const navigate = useNavigate();

  const filteredContacts = contacts.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddContact = e => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      setContacts([newContact.name, ...contacts]);
      setNewContact({ name: '', phone: '' });
      setShowDialog(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="home-layout">
        <aside className="home-sidebar">
          <div className="sidebar-search-box">
            <span className="sidebar-search-icon">🔍</span>
            <input
              className="sidebar-search-input"
              type="text"
              placeholder="Quick Find"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.classList.add('focus')}
              onBlur={e => e.target.classList.remove('focus')}
            />
          </div>
          <button className="add-payment-btn" onClick={() => setShowDialog(true)}>+ Add Contact</button>
          <div className="home-contacts">
            <div className="contacts-heading">Contacts</div>
            <ul className="contacts-list">
              {filteredContacts.map((c, i) => (
                <li className="contact-item" key={i}>{c}</li>
              ))}
            </ul>
            <div style={{ height: 40 }} />
          </div>
        </aside>
        <main className="home-main">
        <div className="welcome-bar">
              <span className="welcome-bar-text">Welcome, <b style={{display:'block'}}>User</b></span>
            </div>
          <div className="center-card">
            
 
            <div className="payment-actions-grid">
              {paymentActions.map((action, i) => (
                <div className="payment-action" key={i}>
                  {action.icon}
                  <div className="payment-action-label">{action.label.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}</div>
                </div>
              ))}
            </div>
          </div>
          <section className="past-transactions">
            <h3>Past Transactions</h3>
            <ul className="trans-list">
              {transactions.map((t, i) => (
                <li className="trans-item" key={i}>
                  <div className="trans-align">
                    <span className="trans-type">{t.type}</span>
                    <span>to/from</span>
                    <b>{t.name}</b>
                  </div>
                  <div className="trans-align">
                    <span className="trans-amount">${t.amount}</span>
                    <span className="trans-date">({t.date})</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>
        {/* Floating Chatbot Button on the left with text */}
        <button className="floating-chatbot-btn left" onClick={() => navigate('/chatbot')} title="Ask Buddy">
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
        </button>
      </div>
      {showDialog && (
        <div className="add-contact-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="add-contact-dialog" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowDialog(false)} title="Close">×</button>
            <h4>Add Contact</h4>
            <form onSubmit={handleAddContact}>
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newContact.phone}
                onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                required
              />
              <button type="submit" className="explore-btn">Add</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Home; 