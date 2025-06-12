import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../App.css"; // Assuming you have a general App.css for styling

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


const Fraud = () => {
  const [fraudStats, setFraudStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState("Uttar Pradesh"); // Default region, can be made dynamic

  useEffect(() => {
    const fetchFraudStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response =await api.get(`/admin/stats/region?region=${region}`);
        console.log(response)
        setFraudStats(response.data.data);
      } catch (err) {
        console.error("Error fetching fraud stats:", err);
        setError("Failed to fetch fraud statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchFraudStats();
  }, [region]); // Refetch when region changes

  if (loading) {
    return <div className="fraud-container">Loading fraud statistics...</div>;
  }

  if (error) {
    return <div className="fraud-container error-message">Error: {error}</div>;
  }

  if (!fraudStats) {
    return <div className="fraud-container">No fraud statistics available.</div>;
  }

  return (
    <>
    <Navbar/>
    <div className="fraud-container">
      <h2>Fraud Statistics for {region}</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Average Fraud Percentage</h3>
          <p>{(fraudStats.averageFraudPercentage * 100).toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{fraudStats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{fraudStats.totalTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Amount Transacted</h3>
          <p>${fraudStats.totalAmountTransacted.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Average Amount Transacted</h3>
          <p>${fraudStats.averageAmountTransacted.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Suspicious Accounts</h3>
          <p>{fraudStats.suspiciousAccounts.length}</p>
          {fraudStats.suspiciousAccounts.length > 0 && (
            <ul>
              {fraudStats.suspiciousAccounts.map((account, index) => (
                <li key={index}>{account}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="stat-card">
          <h3>Total Transactions Daywise</h3>
          <ul>
            {Object.entries(fraudStats.totalTransactionsDaywise).map(([date, count]) => (
              <li key={date}>{date}: {count} transactions</li>
            ))}
          </ul>
        </div>
      </div>
      {/* You can add a region selector here later if needed */}
      {/* For example: */}
      {/* <div className="region-selector">
        <label htmlFor="region-select">Select Region:</label>
        <select id="region-select" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="USA">USA</option>
          <option value="Europe">Europe</option>
          <option value="Asia">Asia</option>
        </select>
      </div> */}
    </div>
    </>
  );
};

export default Fraud;
