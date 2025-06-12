import React from 'react';
import './Profile.css';
import { useState } from 'react';

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


// Mock data
const user = {
  name: 'Kevin Smith',
  role: 'Advisor and Consultant at Stripe Inc.',
  location: 'Saint-Petersburg, Russia',
  email: 'kevin.smith@stripe.com',
  phoneOffice: '+7911 0018830',
  phoneMobile: '+7496 7141177',
  username: 'kevin_smith55',
  twitter: 'kevin_smith',
  profileImg: 'https://randomuser.me/api/portraits/men/32.jpg',
  coverImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
};

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

const sentCount = transactions.filter(t => t.type === 'Sent').length;
const receivedCount = transactions.filter(t => t.type === 'Received').length;

const monthlyData = [5, 8, 12, 7, 15, 10, 18, 14, 9, 11, 13, 16]; // Example: transactions per month

const Profile = () => {
  return (
    <>
    <Navbar />
    <div className="profile-page">
      <div className="profile-cover">
        <img src={user.coverImg} alt="cover" className="profile-cover-img" />
        <div className="profile-avatar-wrapper">
          <img src={user.profileImg} alt="profile" className="profile-avatar" />
        </div>
      </div>
      <div className="profile-main-card">
        <div className="profile-main-info">
          <div className="profile-main-left">
            <h2 className="profile-name">{user.name}</h2>
            <div className="profile-role">{user.role}</div>
            <div className="profile-meta">
              <span>{user.location}</span>
              <span>•</span>
              <span>{user.email}</span>
              <span>•</span>
              <span>@{user.username}</span>
              <span>•</span>
              <span>Twitter: @{user.twitter}</span>
            </div>
          </div>
        </div>
        <div className="profile-contact-row">
          <div className="profile-contact-item">
            <span className="profile-contact-label">Office</span>
            <span>{user.phoneOffice}</span>
          </div>
          <div className="profile-contact-item">
            <span className="profile-contact-label">Mobile</span>
            <span>{user.phoneMobile}</span>
          </div>
          <div className="profile-contact-item">
            <span className="profile-contact-label">Email</span>
            <span>{user.email}</span>
          </div>
        </div>
        {/* <div className="profile-stats-row">
          <div className="profile-stat">
            <div className="profile-stat-number">{sentCount}</div>
            <div className="profile-stat-label">Transactions Made</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-number">{receivedCount}</div>
            <div className="profile-stat-label">Transactions Received</div>
          </div>
        </div> */}
        {/* Monthly Transactions Chart */}
        <div className="profile-chart-section">
          <div className="profile-chart-title">Monthly Transactions</div>
          <svg className="profile-chart-svg" width="100%" height="90" viewBox="0 0 340 90" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#0176D3"
              strokeWidth="3"
              points={monthlyData.map((v, i) => `${i * 30 + 15},${90 - v * 4}`).join(' ')}
            />
            {monthlyData.map((v, i) => (
              <circle key={i} cx={i * 30 + 15} cy={90 - v * 4} r="4" fill="#0176D3" />
            ))}
          </svg>
          <div className="profile-chart-labels">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="profile-transactions-section">
        <h3 className="profile-transactions-title">Transaction History</h3>
        <ul className="profile-trans-list">
          {transactions.map((t, i) => (
            <li className="profile-trans-item" key={i}>
              <div className={`profile-trans-type ${t.type.toLowerCase()}`}>{t.type}</div>
              <div className="profile-trans-name">{t.name}</div>
              <div className="profile-trans-amount">${t.amount}</div>
              <div className="profile-trans-date">{t.date}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
  );
};

export default Profile; 