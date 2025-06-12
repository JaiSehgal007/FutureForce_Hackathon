import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../services/api.js";
import './Employee.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

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

const AddMoneyDialog = ({ open, onClose, user, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleNext = () => {
    setError('');
    if (step === 1 && amount && !isNaN(amount) && Number(amount) > 0) {
      setStep(2);
    } else if (step === 2 && password) {
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/employee/add-money', {
        AccountNumber: user.accountNumber,
        amount: Number(amount),
        password: password
      });

      setConfirmed(true);
      setTimeout(() => {
        onConfirm(Number(amount), response.data.data);
        handleClose();
      }, 1200);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add money';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setPassword('');
    setConfirmed(false);
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="employee-dialog-overlay">
      <div className="employee-dialog">
        {confirmed ? (
          <>
            <div className="employee-dialog-confirmed-icon">
              <span role="img" aria-label="success">✔️</span>
            </div>
            <h4 className="employee-dialog-confirmed-title">Payment Confirmed!</h4>
            <div className="employee-dialog-confirmed-summary">
              <div><b>User:</b> {user.name || user.fullName}</div>
              <div><b>Amount Added:</b> ₹{amount}</div>
              <div><b>New Balance:</b> ₹{(user.accountBalance + Number(amount)).toLocaleString()}</div>
            </div>
            <div className="employee-dialog-confirmed-message">
              The payment has been successfully added to <b>{user.name || user.fullName}</b>'s account.
            </div>
            <button className="employee-dialog-btn" onClick={handleClose}>Close</button>
          </>
        ) : (
          <>
            <h4>Add Money to {user.name || user.fullName}</h4>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            {step === 1 && (
              <>
                <label>Enter Amount</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="employee-dialog-input"
                  placeholder="Amount"
                  autoFocus
                />
                <div className="employee-dialog-actions">
                  <button className="employee-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="employee-dialog-btn next" onClick={handleNext} disabled={!amount || isNaN(amount) || Number(amount) <= 0}>Next</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <label>Employee Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="employee-dialog-input"
                  placeholder="Password"
                  autoFocus
                />
                <div className="employee-dialog-actions">
                  <button className="employee-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="employee-dialog-btn next" onClick={handleNext} disabled={!password}>Next</button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="employee-dialog-summary">
                  <div><b>User:</b> {user.name || user.fullName}</div>
                  <div><b>Current Balance:</b> ₹{user.accountBalance.toLocaleString()}</div>
                  <div><b>Amount to Add:</b> ₹{Number(amount).toLocaleString()}</div>
                  <div><b>New Balance:</b> ₹{(user.accountBalance + Number(amount)).toLocaleString()}</div>
                </div>
                <div className="employee-dialog-actions">
                  <button className="employee-dialog-btn cancel" onClick={handleClose} disabled={loading}>Cancel</button>
                  <button className="employee-dialog-btn confirm" onClick={handleConfirm} disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Employee = () => {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      console.log(response)
      setUsers(response.data.data.users || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    }
  };

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/transactions');
      setTransactions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchTransactions()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleAddMoney = (userId) => {
    const user = users.find(u => (u._id || u.id) === userId);
    setSelectedUser(user);
    setAddMoneyOpen(true);
  };

  const handleEditProfile = (userId) => {
    // Navigate to edit profile page or implement edit functionality
    navigate(`/employee/edit-user/${userId}`);
  };

  const handleConfirmAddMoney = async (amount, updatedData) => {
    // Update the user's accountBalance in the local state
    setUsers(users.map(u =>
      (u._id || u.id) === (selectedUser._id || selectedUser.id) 
        ? { ...u, accountBalance: u.accountBalance + amount } 
        : u
    ));
    
    // Refresh transactions to show the new transaction
    await fetchTransactions();
    
    setAddMoneyOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users
    .filter(user => {
      const name = user.name || user.fullName || '';
      const email = user.email || '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'name') {
        aValue = a.name || a.fullName || '';
        bValue = b.name || b.fullName || '';
      } else {
        aValue = a[sortBy] || 0;
        bValue = b[sortBy] || 0;
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="employee-container">
          <div className="loading-spinner" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            fontSize: '18px'
          }}>
            Loading users...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="employee-container">
          <div className="error-message" style={{ 
            color: 'red', 
            textAlign: 'center', 
            padding: '20px',
            background: '#ffebee',
            borderRadius: '4px',
            margin: '20px'
          }}>
            Error: {error}
            <button 
              onClick={() => window.location.reload()} 
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="employee-container">
        <div className="welcome-bar">
          <span className="welcome-bar-text">Welcome, <b style={{display:'block'}}>Employee</b></span>
        </div>

        <div className="employee-content">
          <div className="users-section">
            <div className="users-header">
              <h2>User Management ({users.length} users)</h2>
              <div className="users-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <div className="sort-controls">
                  <button 
                    className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button 
                    className={`sort-btn ${sortBy === 'accountBalance' ? 'active' : ''}`}
                    onClick={() => handleSort('accountBalance')}
                  >
                    Balance {sortBy === 'accountBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
            </div>

            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user._id || user.id} className="user-card">
                    <div className="user-info">
                      <div className="user-main-info">
                        <h3>{user.name || user.fullName}</h3>
                        <span className={`user-status ${(user.status || 'active').toLowerCase()}`}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                      <p className="user-email">{user.email}</p>
                      <p className="user-accountBalance">
                        Balance: ₹{(user.accountBalance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="action-btn add-money"
                        onClick={() => handleAddMoney(user._id || user.id)}
                      >
                        Add Money
                      </button>
                      <button 
                        className="action-btn edit-profile"
                        onClick={() => handleEditProfile(user._id || user.id)}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <button className="floating-chatbot-btn left" onClick={() => navigate('/chatbot')} title="Ask Buddy">
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
        </button>
        
        <AddMoneyDialog 
          open={addMoneyOpen} 
          onClose={() => setAddMoneyOpen(false)} 
          user={selectedUser} 
          onConfirm={handleConfirmAddMoney} 
        />
      </div>
    </>
  );
};

export default Employee;