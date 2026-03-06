// src/components/DriverHistory.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function DriverHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('rides/');
        // Filter only completed rides
        const completedRides = response.data.filter(
          ride => ride.status.toLowerCase() === 'completed'
        );
        // Sort newest first
        completedRides.sort((a, b) => b.id - a.id);
        setHistory(completedRides);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p className="text-slate-500 font-bold">Loading your past trips...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50', fontWeight: 'black' }}>📜 Order History</h2>
      
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p style={{ fontSize: '18px', color: '#7f8c8d' }}>You haven't completed any rides yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {history.map((ride) => (
            <div key={ride.id} style={{ 
              background: 'white', padding: '20px', borderRadius: '15px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '5px solid #27ae60'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Order #{ride.id}</span>
                <span style={{ color: '#27ae60', fontSize: '18px', fontWeight: 'black' }}>
                  ₹{ride.price}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#34495e', marginTop: '10px' }}>
                <p style={{ margin: '5px 0' }}>📍 {ride.pickup_address}</p>
                <p style={{ margin: '5px 0' }}>🏁 {ride.dropoff_address}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}