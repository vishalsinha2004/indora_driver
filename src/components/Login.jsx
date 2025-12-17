import React, { useState } from 'react';
import api from '../api/axios';

const Login = ({ onLoginSuccess, switchToSignup }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // We need a Token Endpoint for real login, but for now 
      // we will check if the user exists and their password works.
      // (Since we haven't built a Token API, we will use a simple check)
      
      // TEMPORARY: using the status API to "fake" login check
      // In a real app, you use JWT Tokens.
      const response = await api.get(`auth/status/?username=${formData.username}`);
      
      // If no error, user exists. We trust the password for this prototype step.
      alert("✅ Login Successful!");
      onLoginSuccess(formData.username);
      
    } catch (error) {
      alert("❌ Login Failed. User not found or invalid.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '300px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>🔑 Driver Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          placeholder="Username" 
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password"
          placeholder="Password" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        New Driver? <span onClick={switchToSignup} style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Sign up here</span>
      </p>
    </div>
  );
};

export default Login;