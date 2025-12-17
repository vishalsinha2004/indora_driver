import React, { useState, useEffect } from 'react';
import api from './api/axios';
import Signup from './components/Signup';
import Login from './components/Login';
import './App.css';

function App() {
  const [userState, setUserState] = useState({ 
    isLoggedIn: false, 
    username: '', 
    isVerified: false 
  });
  const [orders, setOrders] = useState([]);
  const [showLogin, setShowLogin] = useState(true);

  // --- LOGIN HANDLER ---
  const handleLogin = (username) => {
    setUserState({ 
        isLoggedIn: true, 
        username: username, 
        isVerified: true // Bypassing verification for testing
    });
  };

  // --- FETCH ORDERS LOGIC ---
  useEffect(() => {
    let interval;
    if (userState.isLoggedIn && userState.isVerified) {
      const fetchOrders = async () => {
        try {
          const response = await api.get('rides/');
          // Filters for both new requests and already accepted active rides
          const activeOrNew = response.data.filter(o => {
            const s = o.status.toLowerCase();
            return s === 'requested' || s === 'accepted';
          });
          setOrders(activeOrNew);
        } catch (error) { 
            console.error("Fetch error:", error); 
        }
      };

      fetchOrders();
      interval = setInterval(fetchOrders, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [userState.isLoggedIn, userState.isVerified]);

  // --- ACTION: ACCEPT RIDE ---
  const acceptOrder = async (id) => {
    try {
      await api.post(`rides/${id}/accept_ride/`);
      alert("✅ Ride Accepted!");
      // Immediate UI update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
    } catch (error) { 
        alert("❌ Error accepting ride"); 
    }
  };

  // --- ACTION: FINISH RIDE ---
  const completeRide = async (id) => {
    try {
      await api.patch(`rides/${id}/`, { status: 'completed' });
      alert("🏁 Trip Finished!");
      // Remove from active list
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) { 
        console.error("Complete error:", error.response?.data);
        alert("❌ Error completing ride"); 
    }
  };

  // --- ACTION: SIMULATE MOVEMENT ---
  const moveDriver = async (id) => {
    // Generate slight random movement near Delhi coords
    const fakeLat = 28.61 + (Math.random() * 0.02);
    const fakeLng = 77.20 + (Math.random() * 0.02);

    try {
      // Sending PATCH to update only GPS coordinates
      const response = await api.patch(`rides/${id}/`, { 
        driver_lat: fakeLat, 
        driver_lng: fakeLng 
      });
      console.log(`✅ Moved Order ${id} to:`, fakeLat, fakeLng);
    } catch (error) { 
        console.error("❌ Move failed (400 Bad Request):", error.response?.data);
        alert("Move failed. Check if Backend model has driver_lat/lng fields.");
    }
  };

  // --- AUTH NAVIGATION ---
  if (!userState.isLoggedIn) {
    return showLogin ? 
      <Login onLoginSuccess={handleLogin} switchToSignup={() => setShowLogin(false)} /> : 
      <Signup onSignupSuccess={handleLogin} />;
  }

  // --- DASHBOARD UI ---
  return (
    <div className="driver-container" style={{ maxWidth: '500px', margin: 'auto', fontFamily: 'Arial' }}>
      <header className="header" style={{ background: '#000', color: '#fff', padding: '15px', textAlign: 'center' }}>
        <h1>🚖 Indora Driver</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
            <span>{userState.username}</span>
            <span className="status-badge" style={{ color: '#2ecc71' }}>🟢 Online</span>
        </div>
      </header>

      <div style={{ padding: '20px' }}>
        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Live Requests</h2>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>
            <p>Scanning for nearby rides...</p>
            <div className="loader"></div> 
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card" style={{
              border: '1px solid #ddd', padding: '15px', borderRadius: '12px', 
              marginBottom: '15px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>₹{order.price}</span>
                <span style={{ 
                    background: order.status === 'accepted' ? '#d4edda' : '#eee', 
                    padding: '2px 8px', borderRadius: '5px', fontSize: '0.8em', textTransform: 'uppercase'
                }}>
                    {order.status}
                </span>
              </div>
              
              <div style={{ margin: '15px 0', fontSize: '0.9em' }}>
                <p>📍 <b>Pickup:</b> {order.pickup_address}</p>
                <p>🏁 <b>Drop:</b> {order.dropoff_address}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {order.status.toLowerCase() === 'requested' ? (
                  <button onClick={() => acceptOrder(order.id)} style={{
                    flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                  }}>
                    ACCEPT RIDE
                  </button>
                ) : (
                  <>
                    <button onClick={() => moveDriver(order.id)} style={{
                      flex: 1, padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                      📍 SIMULATE MOVE
                    </button>
                    <button onClick={() => completeRide(order.id)} style={{
                      flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                      FINISH TRIP
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;