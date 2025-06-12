import React, { useState, useEffect } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

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

const Sidebar = ({ flaggedUsers, flaggedSearch, setFlaggedSearch, onTransactionHistoryClick , onFraudClick }) => (
  <aside className="admin-sidebar">
    <nav className="admin-nav">
      <div className="admin-nav-link " onClick={onFraudClick}>Fraud Cases</div>
      <div 
        className="admin-nav-link" 
        onClick={onTransactionHistoryClick}
        style={{ cursor: 'pointer' }}
      >
        Transaction History
      </div>
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
          <li key={user._id || user.id} className="flagged-item">{user.name || user.username}</li>
        ))}
      </ul>
    </div>
  </aside>
);

const ConfirmDialog = ({ open, onClose, onConfirm, user, isBlocking }) => {
  if (!open) return null;
  return (
    <div className="admin-dialog-overlay">
      <div className="admin-dialog">
        <h4>{isBlocking ? 'Block User' : 'Unblock User'}</h4>
        <p>Are you sure you want to {isBlocking ? 'block' : 'unblock'} <b>{user?.name || user?.username}</b>?</p>
        <div className="admin-dialog-actions">
          <button className="admin-dialog-btn cancel" onClick={onClose}>Cancel</button>
          <button className="admin-dialog-btn confirm" onClick={onConfirm}>
            Yes, {isBlocking ? 'Block' : 'Unblock'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [flaggedSearch, setFlaggedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBlocking, setIsBlocking] = useState(true);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users');
        console.log('Fetched users:', response.data);
        setUsers(response.data.data.users || response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter flagged users - adjust the property name based on your backend response
  const flaggedUsers = users.filter(u => {
    const userStatus = u.status || u.blocked || u.isFlagged;
    const userName = u.name || u.username || '';
    return (userStatus === 'blocked' || userStatus === true || u.isFlagged) && 
           userName.toLowerCase().includes(flaggedSearch.toLowerCase());
  });

  const filteredUsers = users
    .filter(user => {
      const userName = (user.name || user.username || '').toLowerCase();
      const userEmail = (user.email || '').toLowerCase();
      const searchTerm = userSearch.toLowerCase();
      return userName.includes(searchTerm) || userEmail.includes(searchTerm);
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'name') {
        aValue = a.name || a.username || '';
        bValue = b.name || b.username || '';
      } else if (sortBy === 'accountBalance') {
        aValue = a.accountBalance || a.balance || 0;
        bValue = b.accountBalance || b.balance || 0;
      } else {
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
      }
      
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

  const handleBlockToggle = (user) => {
    setSelectedUser(user);
    // Determine if we're blocking or unblocking based on current status
    const currentlyBlocked = user.blocked || user.status === 'Blocked';
    setIsBlocking(!currentlyBlocked);
    setDialogOpen(true);
  };

  const handleConfirmBlock = async () => {
    try {
      const userId = selectedUser._id || selectedUser.id;
      await api.post(`admin/toggle-block-user/${userId}`);
      
      // Update the user's status in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if ((user._id || user.id) === userId) {
            return {
              ...user,
              blocked: !user.blocked,
              status: user.blocked ? 'Active' : 'Blocked'
            };
          }
          return user;
        })
      );
      
      setDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error toggling user block status:', err);
      setError('Failed to update user status. Please try again.');
      setDialogOpen(false);
    }
  };

  const handleTransactionHistory = async () => {
    try {
      navigate('/admin/transactions');
      // You can navigate to a transaction history page or show in a modal
      // navigate('/admin/transactions');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transaction history.');
    }
  };
  const handleFraudClick = async () => {
    try {
      navigate('/fraud');
      // You can navigate to a transaction history page or show in a modal
      // navigate('/admin/transactions');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transaction history.');
    }
  };

  const getUserStatus = (user) => {
    if (user.blocked) return 'Blocked';
    if (user.blocked) return 'Flagged';
    if (user.status) return user.status;
    return 'Active';
  };

  const getUserBalance = (user) => {
    return user.accountBalance || user.balance || 0;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-layout">
          <div className="admin-main">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading users...
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="admin-layout">
          <div className="admin-main">
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
              Error: {error}
              <br />
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Navbar />
    <div className="admin-layout">
      <Sidebar 
        flaggedUsers={flaggedUsers} 
        flaggedSearch={flaggedSearch} 
        setFlaggedSearch={setFlaggedSearch}
        onTransactionHistoryClick={handleTransactionHistory}
        onFraudClick={handleFraudClick}
      />
      <main className="admin-main-scrollable">
        <div className="admin-main">
          <div className="admin-users-header">
            <h2>All Users ({users.length})</h2>
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
              <div key={user._id || user.id} className="admin-user-card">
                <div className="admin-user-info">
                  <div className="admin-user-main-info">
                    <h3>{user.name || user.username}</h3>
                    <span className={`admin-user-status ${getUserStatus(user).toLowerCase()}`}>
                      {getUserStatus(user)}
                    </span>
                  </div>
                  <p className="admin-user-email">{user.email}</p>
                  <p className="admin-user-accountBalance">
                    Balance: ₹ {getUserBalance(user).toLocaleString()}
                  </p>
                </div>
                <div className="admin-user-actions">
                  <button 
                    className={`admin-action-btn ${user.blocked ? 'unblock' : 'block'}`} 
                    onClick={() => handleBlockToggle(user)}
                  >
                    {user.blocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No users found matching your search criteria.
              </div>
            )}
          </div>
        </div>
      </main>
      <button className="floating-chatbot-btn left" onClick={() => navigate('/chatbot')} title="Ask Buddy">
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
     </button>
    </div>
    <ConfirmDialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)} 
      onConfirm={handleConfirmBlock} 
      user={selectedUser}
      isBlocking={isBlocking}
    />
    </>
  );
};

export default Admin;