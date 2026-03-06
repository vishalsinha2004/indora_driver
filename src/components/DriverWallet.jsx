// src/components/DriverWallet.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function DriverWallet() {
  const [earnings, setEarnings] = useState(0);
  const [ridesCount, setRidesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await api.get('rides/');
        const completedRides = response.data.filter(
          ride => ride.status.toLowerCase() === 'completed'
        );
        
        // Calculate total earnings
        const total = completedRides.reduce((sum, ride) => sum + parseFloat(ride.price || 0), 0);
        
        setEarnings(total);
        setRidesCount(completedRides.length);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontWeight: 'bold', color: '#7f8c8d' }}>Loading wallet...</div>;
  }

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50', fontWeight: 'black' }}>💳 My Wallet</h2>
      
      {/* Earnings Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2ecc71, #27ae60)', 
        padding: '30px', borderRadius: '20px', color: 'white', 
        boxShadow: '0 10px 20px rgba(39, 174, 96, 0.3)', marginBottom: '20px', textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', margin: 0, opacity: 0.9, fontWeight: 'bold' }}>Total Earnings</p>
        <h1 style={{ fontSize: '48px', margin: '10px 0', fontWeight: 'black' }}>₹{earnings.toFixed(2)}</h1>
        <p style={{ fontSize: '14px', margin: 0, background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '10px', display: 'inline-block' }}>
          From {ridesCount} completed trips
        </p>
      </div>

      {/* Withdraw Button */}
      <button style={{ 
        width: '100%', padding: '15px', background: '#34495e', color: 'white', 
        border: 'none', borderRadius: '15px', fontWeight: 'black', fontSize: '16px', cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }} onClick={() => alert("Withdrawal system coming soon!")}>
        WITHDRAW TO BANK
      </button>

    </div>
  );
}