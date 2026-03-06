// src/components/DriverReviews.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function DriverReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('rides/');
        
        const ratedRides = response.data.filter(
          ride => ride.status.toLowerCase() === 'completed' && ride.rating > 0
        );
        
        ratedRides.sort((a, b) => b.id - a.id);
        setReviews(ratedRides);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f9f9f9', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50' }}>⭐ My Customer Reviews</h2>
      
      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p style={{ fontSize: '18px', color: '#7f8c8d' }}>No reviews yet. Complete more rides to get ratings!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {reviews.map((ride) => (
            <div key={ride.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderLeft: '5px solid #f1c40f'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Order #{ride.id}</span>
                <span style={{ color: '#f1c40f', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  {'★'.repeat(ride.rating)}{'☆'.repeat(5 - ride.rating)}
                </span>
              </div>
              
              <p style={{ fontSize: '16px', color: '#34495e', fontStyle: 'italic', margin: '10px 0' }}>
                "{ride.feedback || "No written feedback provided."}"
              </p>
              
              <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '10px', borderTop: '1px solid #ecf0f1', paddingTop: '10px' }}>
                📍 <b>From:</b> {ride.pickup_address} <br/>
                🏁 <b>To:</b> {ride.dropoff_address}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}