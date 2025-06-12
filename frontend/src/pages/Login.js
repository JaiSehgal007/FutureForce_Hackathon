import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { FaUser, FaIdCard, FaUserShield } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [loginType, setLoginType] = useState('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [adminName, setAdminName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to verify credentials
    // For demo purposes, we'll just navigate based on login type
    switch(loginType) {
      case 'user':
        navigate('/home');
        break;
      case 'employee':
        navigate('/employee');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        break;
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to SecureTransact</h2>
        <div className="login-type-selector">
          <button 
            className={`login-type-btn ${loginType === 'user' ? 'active' : ''}`}
            onClick={() => setLoginType('user')}
          >
             User
          </button>
          <button 
            className={`login-type-btn ${loginType === 'employee' ? 'active' : ''}`}
            onClick={() => setLoginType('employee')}
          >
             Employee
          </button>
          <button 
            className={`login-type-btn ${loginType === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginType('admin')}
          >
             Admin
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {loginType === 'user' && (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          {loginType === 'employee' && (
            <>
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          {loginType === 'admin' && (
            <>
              <div className="form-group">
                <label>Admin Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login; 