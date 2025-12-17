import React, { useEffect, useState } from 'react';
import api from './api/axios';
import './App.css'; // We will style this next

function App() {
  const [orders, setOrders] = useState([]);

  // Fetch orders every 5 seconds (Real-time feel)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('rides/');
        // Filter to show only 'requested' rides (optional)
        setOrders(response.data);
      } catch (error) {
        console.error("Error connecting to backend:", error);
      }
    };

    fetchOrders(); // Initial fetch
    const interval = setInterval(fetchOrders, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const acceptOrder = (id) => {
    // In the future, we will send an API request here to update status
    alert(`✅ You accepted Order #${id}! Navigation starting...`);
  };

  return (
    <div className="driver-container">
      <header className="header">
        <h1>🚖 Indora Driver</h1>
        <span className="status-badge">🟢 Online</span>
      </header>

      <h2>New Requests</h2>

      {orders.length === 0 ? (
        <div className="no-rides">
          <p>Scanning for rides...</p>
          <div className="loader"></div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="card-header">
                <span className="price">₹{order.price}</span>
                <span className="distance">{order.distance_km} km</span>
              </div>
              
              <div className="locations">
                <p>📍 <b>Pickup:</b> User Location</p>
                <p>🏁 <b>Drop:</b> Destination</p>
              </div>

              <button 
                className="accept-btn"
                onClick={() => acceptOrder(order.id)}
              >
                ACCEPT RIDE
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;