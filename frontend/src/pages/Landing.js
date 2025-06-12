import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="entry-bg">
      <nav className="navbar">
        <div className="navbar-logo">SecureTransact</div>
        <div className="navbar-actions">
          <Link to="/login" className="nav-btn">Login</Link>
          <Link to="/login" className="nav-btn-signup">Sign Up</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-overlay">
          <h1 className="hero-title">Secure Transactions Made Simple</h1>
          <p className="hero-desc">Send and receive money with confidence</p>
          <Link to="/login" className="explore-btn">Get Started</Link>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <h2>1M+</h2>
          <p>Users</p>
        </div>
        <div className="stat-item">
          <h2>$500M+</h2>
          <p>Transactions</p>
        </div>
        <div className="stat-item">
          <h2>99.9%</h2>
          <p>Uptime</p>
        </div>
        <div className="stat-item">
          <h2>24/7</h2>
          <p>Support</p>
        </div>
      </section>

      <section className="testimonial-section">
        <div className="testimonial-text">
          <h2>Join thousands of satisfied users who trust SecureTransact</h2>
          <Link to="/login" className="explore-btn outline">Start Now</Link>
        </div>
      </section>

      <footer className="footer">
        <p>© 2024 SecureTransact. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing; 