import React, { useState, useEffect } from 'react';
import './Admin.css'; // Assuming you'll add the CSS styles here
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

const TransactionFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filterType, 
  setFilterType, 
  filterLocation, 
  setFilterLocation,
  showSuspiciousOnly,
  setShowSuspiciousOnly,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) => {
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="transaction-filters">
      <div className="filter-row">
        <div className="admin-search-box">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <span className="admin-search-icon">🔍</span>
        </div>
        
        <select 
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="Credit">Credit</option>
          <option value="Debit">Debit</option>
        </select>
        
        <select 
          value={filterLocation} 
          onChange={e => setFilterLocation(e.target.value)}
          className="filter-select"
        >
          <option value="">All Locations</option>
          <option value="Delhi">Delhi</option>
          <option value="Chennai">Chennai</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Unknown">Unknown</option>
        </select>
        
        <label className="suspicious-filter">
          <input
            type="checkbox"
            checked={showSuspiciousOnly}
            onChange={e => setShowSuspiciousOnly(e.target.checked)}
          />
          Suspicious Only
        </label>
      </div>
      
      <div className="sort-controls">
        <button 
          className={`admin-sort-btn ${sortBy === 'createdAt' ? 'active' : ''}`} 
          onClick={() => handleSort('createdAt')}
        >
          Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`admin-sort-btn ${sortBy === 'amount' ? 'active' : ''}`} 
          onClick={() => handleSort('amount')}
        >
          Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`admin-sort-btn ${sortBy === 'fraudPercentage' ? 'active' : ''}`} 
          onClick={() => handleSort('fraudPercentage')}
        >
          Fraud Risk {sortBy === 'fraudPercentage' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
    </div>
  );
};

const TransactionCard = ({ transaction }) => {
  const isSuspicious = transaction.fraudPercentage > 0.3;
  const isSystemTransaction = transaction.senderAccountNumber === 'System';
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFraudRiskLevel = (percentage) => {
    if (percentage === 0) return 'None';
    if (percentage < 0.1) return 'Very Low';
    if (percentage < 0.3) return 'Low';
    if (percentage < 0.6) return 'Medium';
    if (percentage < 0.8) return 'High';
    return 'Critical';
  };

  const getFraudRiskColor = (percentage) => {
    if (percentage === 0) return '#28a745';
    if (percentage < 0.1) return '#20c997';
    if (percentage < 0.3) return '#ffc107';
    if (percentage < 0.6) return '#fd7e14';
    if (percentage < 0.8) return '#dc3545';
    return '#721c24';
  };

  return (
    <div className={`transaction-card ${isSuspicious ? 'suspicious' : ''} ${isSystemTransaction ? 'system-transaction' : ''}`}>
      <div className="transaction-header">
        <div className="transaction-id">
          <span className="transaction-id-label">ID:</span>
          <span className="transaction-id-value">{transaction._id.slice(-8)}</span>
        </div>
        <div className="transaction-date">
          {formatDate(transaction.createdAt)}
        </div>
        {isSuspicious && (
          <div className="suspicious-badge">
            ⚠️ Suspicious
          </div>
        )}
      </div>
      
      <div className="transaction-body">
        <div className="transaction-flow">
          <div className="account-info">
            <div className="account-label">From</div>
            <div className="account-number">{transaction.senderAccountNumber}</div>
          </div>
          <div className="transaction-arrow">
            {transaction.type === 'Credit' ? '←' : '→'}
          </div>
          <div className="account-info">
            <div className="account-label">To</div>
            <div className="account-number">{transaction.receiverAccountNumber}</div>
          </div>
        </div>
        
        <div className="transaction-details">
          <div className="transaction-amount">
            <span className={`amount ${transaction.type.toLowerCase()}`}>
              {transaction.type === 'Credit' ? '+' : '-'}₹ {transaction.amount.toLocaleString()}
            </span>
            <span className="transaction-type">{transaction.type}</span>
          </div>
          
          <div className="transaction-meta">
            <div className="meta-item">
              <span className="meta-label">Location:</span>
              <span className="meta-value">{transaction.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Device:</span>
              <span className="meta-value">{transaction.deviceId}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Fraud Risk:</span>
              <span 
                className="meta-value fraud-risk" 
                style={{ color: getFraudRiskColor(transaction.fraudPercentage) }}
              >
                {getFraudRiskLevel(transaction.fraudPercentage)} ({(transaction.fraudPercentage * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`admin/transactions?page=${currentPage}&limit=10`);
      console.log('Fetched transactions:', response.data);
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setPagination(response.data.data.pagination);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        transaction.senderAccountNumber.toLowerCase().includes(searchLower) ||
        transaction.receiverAccountNumber.toLowerCase().includes(searchLower) ||
        transaction._id.toLowerCase().includes(searchLower) ||
        transaction.location.toLowerCase().includes(searchLower);
      
      // Type filter
      const matchesType = !filterType || transaction.type === filterType;
      
      // Location filter
      const matchesLocation = !filterLocation || transaction.location === filterLocation;
      
      // Suspicious filter
      const matchesSuspicious = !showSuspiciousOnly || transaction.fraudPercentage > 0.3;
      
      return matchesSearch && matchesType && matchesLocation && matchesSuspicious;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else if (sortBy === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      } else if (sortBy === 'fraudPercentage') {
        aValue = a.fraudPercentage;
        bValue = b.fraudPercentage;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const suspiciousCount = transactions.filter(t => t.fraudPercentage > 0.3).length;
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-layout">
          <div className="admin-main">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading transactions...
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
                onClick={fetchTransactions} 
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
        <main className="admin-main-scrollable">
          <div className="admin-main">
            <div className="transactions-header">
              <div className="transactions-title">
                <h2>Transaction History</h2>
                <button 
                  className="back-btn"
                  onClick={() => navigate('/admin')}
                >
                  ← Back to Admin
                </button>
              </div>
              
              <div className="transactions-stats">
                <div className="stat-card">
                  <div className="stat-value">{filteredTransactions.length}</div>
                  <div className="stat-label">Total Transactions</div>
                </div>
                <div className="stat-card suspicious">
                  <div className="stat-value">{suspiciousCount}</div>
                  <div className="stat-label">Suspicious</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">₹ {totalAmount.toLocaleString()}</div>
                  <div className="stat-label">Total Amount</div>
                </div>
              </div>
            </div>

            <TransactionFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterType={filterType}
              setFilterType={setFilterType}
              filterLocation={filterLocation}
              setFilterLocation={setFilterLocation}
              showSuspiciousOnly={showSuspiciousOnly}
              setShowSuspiciousOnly={setShowSuspiciousOnly}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />

            <div className="transactions-list">
              {filteredTransactions.map(transaction => (
                <TransactionCard 
                  key={transaction._id} 
                  transaction={transaction} 
                />
              ))}
              
              {filteredTransactions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No transactions found matching your criteria.
                </div>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
        
        <button 
          className="floating-chatbot-btn left" 
          onClick={() => navigate('/chatbot')} 
          title="Ask Buddy"
        >
          <span className="floating-bot-icon" role="img" aria-label="bot">🤖</span>
          <span className="floating-bot-text">Ask Buddy</span>
        </button>
      </div>
    </>
  );
};

export default AdminTransactions;