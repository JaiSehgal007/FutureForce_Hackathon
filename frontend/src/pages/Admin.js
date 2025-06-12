import React, { useState } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';

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

const Sidebar = ({ flaggedUsers, flaggedSearch, setFlaggedSearch }) => (
  <aside className="admin-sidebar">
    <nav className="admin-nav">
      <div className="admin-nav-link ">Fraud Cases</div>
      <div className="admin-nav-link">Transaction History</div>
    </nav>
    <div className="flagged-section">
      <div className="flagged-header">Flagged Users</div>
      <div className="flagged-search-box">
        <input
          type="text"
          placeholder="Search flagged..."
          value={flaggedSearch}
          onChange={e => setFlaggedSearch(e.target.value)}
        />
        <span className="flagged-search-icon">🔍</span>
      </div>
      <ul className="flagged-list">
        {flaggedUsers.length === 0 && <li className="flagged-empty">No flagged users</li>}
        {flaggedUsers.map(user => (
          <li key={user.id} className="flagged-item">{user.name}</li>
        ))}
      </ul>
    </div>
  </aside>
);

const ConfirmDialog = ({ open, onClose, onConfirm, user }) => {
  if (!open) return null;
  return (
    <div className="admin-dialog-overlay">
      <div className="admin-dialog">
        <h4>Block User</h4>
        <p>Are you sure you want to block <b>{user?.name}</b>?</p>
        <div className="admin-dialog-actions">
          <button className="admin-dialog-btn cancel" onClick={onClose}>Cancel</button>
          <button className="admin-dialog-btn confirm" onClick={onConfirm}>Yes, Block</button>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  // Mock data
  const navigate = useNavigate();
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', accountBalance: 1500, email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', accountBalance: 2300, email: 'jane@example.com', status: 'Active' },
    { id: 3, name: 'Mike Johnson', accountBalance: 800, email: 'mike@example.com', status: 'Inactive' },
    { id: 4, name: 'Sarah Williams', accountBalance: 3200, email: 'sarah@example.com', status: 'Active' },
    { id: 5, name: 'David Brown', accountBalance: 1850, email: 'david@example.com', status: 'Flagged' },
    { id: 6, name: 'Nitanshi Goyal', accountBalance: 1050, email: 'nitanshi@example.com', status: 'Flagged' },
    { id: 7, name: 'Mallika Sehravath', accountBalance: 2350, email: 'mallika@example.com', status: 'Flagged' },
    { id: 8, name: 'Debajyoti Maji', accountBalance: 175, email: 'dev@example.com', status: 'Flagged' },
    { id: 9, name: 'Paspula Nikhil', accountBalance: 5000, email: 'nikhil@example.com', status: 'Flagged' },
  ]);
  const [userSearch, setUserSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [flaggedSearch, setFlaggedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const flaggedUsers = users.filter(u => u.status === 'Flagged' && u.name.toLowerCase().includes(flaggedSearch.toLowerCase()));

  const filteredUsers = users
    .filter(user =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleBlock = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleConfirmBlock = () => {
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
    <Navbar />
    <div className="admin-layout">
      <Sidebar flaggedUsers={flaggedUsers} flaggedSearch={flaggedSearch} setFlaggedSearch={setFlaggedSearch} />
      <main className="admin-main-scrollable">
        <div className="admin-main">
          <div className="admin-users-header">
            <h2>All Users</h2>
            <div className="admin-users-controls">
              <div className="admin-search-box">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <span className="admin-search-icon">🔍</span>
              </div>
              <div className="admin-sort-controls">
                <button className={`admin-sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button className={`admin-sort-btn ${sortBy === 'accountBalance' ? 'active' : ''}`} onClick={() => handleSort('accountBalance')}>
                  Balance {sortBy === 'accountBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
          <div className="admin-users-list">
            {filteredUsers.map(user => (
              <div key={user.id} className="admin-user-card">
                <div className="admin-user-info">
                  <div className="admin-user-main-info">
                    <h3>{user.name}</h3>
                    <span className={`admin-user-status ${user.status.toLowerCase()}`}>{user.status}</span>
                  </div>
                  <p className="admin-user-email">{user.email}</p>
                  <p className="admin-user-accountBalance">Balance: ${user.accountBalance.toLocaleString()}</p>
                </div>
                <div className="admin-user-actions">
                  <button className="admin-action-btn block" onClick={() => handleBlock(user)}>
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <button className="floating-chatbot-btn left" onClick={() => navigate('/chatbot')} title="Ask Buddy">
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
     </button>
    </div>
    <ConfirmDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onConfirm={handleConfirmBlock} user={selectedUser} />
    </>
  );
};

export default Admin; 