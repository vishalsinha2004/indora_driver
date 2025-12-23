import React, { useState } from 'react';
import api from '../api/axios';

const Login = ({ onLoginSuccess, switchToSignup }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Request REAL JWT tokens from the backend
      const response = await api.post('auth/login/', { 
        username: formData.username, 
        password: formData.password 
      });

      // 2. Extract the access token (SimpleJWT returns it as 'access')
      const token = response.data.access; 

      if (token) {
        console.log("✅ Token received and saved.");
        // 3. Pass username and token to App.jsx to save in localStorage
        onLoginSuccess(formData.username, token);
      } else {
        alert("❌ Server did not return a valid token.");
      }
      
    } catch (error) {
      console.error("Login Error:", error.response?.data);
      alert("❌ Invalid credentials. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '300px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '10px', background: 'white' }}>
      <h2 style={{ textAlign: 'center' }}>🔑 Driver Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          placeholder="Username" 
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
        <input 
          type="password"
          placeholder="Password" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px', 
            background: loading ? '#666' : 'black', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
        New Driver? <span onClick={switchToSignup} style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }}>Sign up here</span>
      </p>
    </div>
  );
};

export default Login;