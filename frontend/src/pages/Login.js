import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { FaUser, FaIdCard, FaUserShield } from 'react-icons/fa';
import './Login.css';
import api from '../services/api.js'; // Adjust the import based on your project structure
const Login = () => {
  const [loginType, setLoginType] = useState('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault();
    // Here you would typically make an API call to verify credentials
    // For demo purposes, we'll just navigate based on login type
    const res = await api.post('/user/login' , {
      accountNumber : username,
      pin : password,
      userType : loginType.toLowerCase()
    })
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
          {(
            <>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>PIN</label>
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