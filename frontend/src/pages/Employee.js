import React, { useState } from 'react';
// import { FaUserPlus, FaUserEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Employee.css';



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

  if (!open) return null;

  const handleNext = () => {
    if (step === 1 && amount && !isNaN(amount) && Number(amount) > 0) {
      setStep(2);
    } else if (step === 2 && password) {
      setStep(3);
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(Number(amount));
      setStep(1);
      setAmount('');
      setPassword('');
      setConfirmed(false);
    }, 1200);
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setPassword('');
    setConfirmed(false);
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
              <div><b>User:</b> {user.name}</div>
              <div><b>Amount Added:</b> ${amount}</div>
              <div><b>New Balance:</b> ${(user.balance + Number(amount)).toLocaleString()}</div>
            </div>
            <div className="employee-dialog-confirmed-message">
              The payment has been successfully added to <b>{user.name}</b>'s account.
            </div>
            <button className="employee-dialog-btn" onClick={handleClose}>Close</button>
          </>
        ) : (
          <>
            <h4>Add Money to {user.name}</h4>
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
                  <div><b>User:</b> {user.name}</div>
                  <div><b>Current Balance:</b> ${user.balance.toLocaleString()}</div>
                  <div><b>Amount to Add:</b> ${Number(amount).toLocaleString()}</div>
                  <div><b>New Balance:</b> ${(user.balance + Number(amount)).toLocaleString()}</div>
                </div>
                <div className="employee-dialog-actions">
                  <button className="employee-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="employee-dialog-btn confirm" onClick={handleConfirm}>Confirm</button>
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
  // Mock data for users
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([
    { id: 1, name: 'Sara Abhijeet', balance: 1500, email: 'abhi@gmail.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', balance: 2300, email: 'jane@example.com', status: 'Active' },
    { id: 3, name: 'Mohammed Amir', balance: 800, email: 'amir@gmail.com', status: 'Inactive' },
    { id: 4, name: 'Sumati Gupta', balance: 3200, email: 'sumati@gmail.com', status: 'Active' },
    { id: 5, name: 'David Singh', balance: 1750, email: 'david@gmail.com', status: 'Active' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleAddMoney = (userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    setAddMoneyOpen(true);
  };

  const handleEditProfile = (userId) => {
    // Implement edit profile functionality
    console.log('Edit profile for user:', userId);
  };

  const handleConfirmAddMoney = (amount) => {
    setUsers(users.map(u =>
      u.id === selectedUser.id ? { ...u, balance: u.balance + amount } : u
    ));
    setAddMoneyOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2>User Management</h2>
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
                  className={`sort-btn ${sortBy === 'balance' ? 'active' : ''}`}
                  onClick={() => handleSort('balance')}
                >
                  Balance {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>

          <div className="users-list">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-main-info">
                    <h3>{user.name}</h3>
                    <span className={`user-status ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </div>
                  <p className="user-email">{user.email}</p>
                  <p className="user-balance">Balance: ₹{user.balance.toLocaleString()}</p>
                </div>
                <div className="user-actions">
                  <button 
                    className="action-btn add-money"
                    onClick={() => handleAddMoney(user.id)}
                  >
                     Add Money
                  </button>
                  <button 
                    className="action-btn edit-profile"
                    onClick={() => handleEditProfile(user.id)}
                  >
                     Edit Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="floating-chatbot-btn left" onClick={() => navigate('/chatbot')} title="Ask Buddy">
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
     </button>
     <AddMoneyDialog open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} user={selectedUser} onConfirm={handleConfirmAddMoney} />
    </div>
    </>
  );
};

export default Employee; 