// src/App.jsx
import React, { useState, useEffect } from 'react';
import api from './api/axios';
import Signup from './components/Signup';
import Login from './components/Login';
import './App.css';
import IndoraMap from './components/IndoraMap';
import DriverReviews from './components/DriverReviews';
import DriverHistory from './components/DriverHistory'; // <-- IMPORT ADDED
import DriverWallet from './components/DriverWallet';   // <-- IMPORT ADDED
import io from 'socket.io-client';

function App() {
  const [userState, setUserState] = useState({ 
    isLoggedIn: false, 
    username: '', 
    isVerified: false 
  });
  const [orders, setOrders] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  
  const [currentView, setCurrentView] = useState('home'); // 'home', 'reviews', 'history', 'wallet'

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUsername = localStorage.getItem('driver_username') || '';
    const savedOnline = localStorage.getItem('indora_driver_online') === 'true';
    
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUserState({
        isLoggedIn: true,
        username: savedUsername,
        isVerified: true
      });
      setIsOnline(savedOnline);
    }
    
    return () => newSocket.disconnect();
  }, []);

  const activeRide = orders.find(o => o.status.toLowerCase() === 'accepted');

  useEffect(() => {
    let watchId;
    if (activeRide && isOnline) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.patch(`rides/${activeRide.id}/`, { 
              driver_lat: latitude, 
              driver_lng: longitude 
            });
            if (socket) {
               socket.emit('driver_location_update', { 
                  order_id: activeRide.id, lat: latitude, lng: longitude 
               });
            }
          } catch (error) {
            console.error("Failed to update live location", error);
          }
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeRide, isOnline, socket]);

  const handleLogin = (username, token) => {
    if (!token) return;
    localStorage.setItem('access_token', token);
    localStorage.setItem('driver_username', username); 
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
    setUserState({ isLoggedIn: true, username: username, isVerified: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('driver_username');      
    localStorage.removeItem('indora_driver_online'); 
    delete api.defaults.headers.common['Authorization'];
    setIsOnline(false);
    setUserState({ isLoggedIn: false, username: '', isVerified: false });
    setOrders([]);
    setCurrentView('home'); 
  };

  const toggleOnline = async () => {
    try {
        const response = await api.post('users/driver_profile/toggle_status/'); 
        setIsOnline(response.data.is_online);
        localStorage.setItem('indora_driver_online', response.data.is_online);
    } catch (error) {
        const fallbackStatus = !isOnline;
        setIsOnline(fallbackStatus); 
        localStorage.setItem('indora_driver_online', fallbackStatus);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('rides/');
      const activeOrNew = response.data.filter(o => {
        const s = o.status.toLowerCase();
        return s === 'requested' || s === 'accepted';
      });
      setOrders(activeOrNew);
    } catch (error) { console.error("Fetch error:", error); }
  };

  useEffect(() => {
    let interval;
    if (userState.isLoggedIn && isOnline) {
      fetchOrders();
      interval = setInterval(fetchOrders, 3000);
    } else if (!isOnline) {
      setOrders([]); 
    }
    return () => clearInterval(interval);
  }, [userState.isLoggedIn, isOnline]);

  const acceptOrder = async (id) => {
    try {
      await api.post(`rides/${id}/accept_ride/`);
      if (socket) socket.emit('ride_accepted_event', { order_id: id });
      fetchOrders(); 
      setCurrentView('home'); // Ensure they are on the map view
    } catch (error) { 
      alert("Error accepting ride. Check console for details."); 
    }
  };

  const completeRide = async (id) => {
    try {
      await api.post(`rides/${id}/complete_ride/`);
      if (socket) socket.emit('ride_completed_event', { order_id: id });
      alert("🏁 Trip Finished!");
      setOrders(prev => prev.filter(o => o.id !== id));
      setCurrentView('wallet'); // Take them to wallet to see their new money!
    } catch (error) { 
      alert("Error completing ride! Check console."); 
    }
  };

  if (!userState.isLoggedIn) {
    return showLogin ? 
      <Login onLoginSuccess={handleLogin} switchToSignup={() => setShowLogin(false)} /> : 
      <Signup onSignupSuccess={handleLogin} />;
  }

  // Helper function for Navigation Button Styles
  const navBtnStyle = (viewName) => ({
    flex: 1, padding: '15px 0', border: 'none', background: 'transparent',
    color: currentView === viewName ? '#2563eb' : '#94a3b8',
    fontWeight: 'black', fontSize: '12px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px', cursor: 'pointer'
  });

  return (
    <div className="driver-container" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      
      {/* 1. Clean Top Header */}
      <header className="header" style={{ 
          background: isOnline ? '#22c55e' : '#1e293b', 
          color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', zIndex: 2000, transition: 'background 0.3s ease',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'black', fontStyle: 'italic' }}>INDORA</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                  onClick={toggleOnline}
                  style={{ 
                      padding: '8px 16px', borderRadius: '20px', border: 'none', 
                      background: '#fff', color: isOnline ? '#22c55e' : '#1e293b',
                      fontWeight: 'black', cursor: 'pointer', fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
              >
                  {isOnline ? '🟢 ONLINE' : '⚪ GO OFFLINE'}
              </button>

              <button 
                  onClick={handleLogout}
                  style={{ 
                      padding: '8px 16px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.3)', 
                      background: 'transparent', color: 'white',
                      fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
                  }}
              >
                  🚪
              </button>
          </div>
      </header>

      {/* 2. Main Body Content (Router) */}
      <div style={{ flex: 1, position: 'relative' }}>
        
        {currentView === 'reviews' ? <DriverReviews /> :
         currentView === 'history' ? <DriverHistory /> :
         currentView === 'wallet'  ? <DriverWallet /> : 
         activeRide ? (
          /* --- NAVIGATION MODE (Full Screen Map) --- */
          <div className="navigation-mode" style={{ height: '100%', width: '100%' }}>
            <div style={{ 
              position: 'absolute', top: '20px', left: '15px', right: '15px', zIndex: 1000, 
              background: 'white', padding: '20px', borderRadius: '20px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#22c55e', fontWeight: 'black' }}>Active Trip #{activeRide.id}</h3>
              </div>
              
              <div style={{ margin: '15px 0', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>👤 {activeRide.customer_name || 'Customer'}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#2563eb', fontWeight: 'bold' }}>📞 {activeRide.customer_phone || 'No phone provided'}</p>
              </div>

              <p style={{ margin: '15px 0', fontSize: '15px', fontWeight: '600', color: '#475569' }}>
                🏁 {activeRide.dropoff_address || "Navigating to Destination..."}
              </p>
              
              <button onClick={() => completeRide(activeRide.id)} style={{ width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'black', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)' }}>
                🏁 FINISH TRIP
              </button>
            </div>

            <IndoraMap 
              pickup={activeRide.pickup_lat ? [activeRide.pickup_lat, activeRide.pickup_lng] : null} 
              dropoff={activeRide.dropoff_lat ? [activeRide.dropoff_lat, activeRide.dropoff_lng] : null}
              driverLocation={activeRide.driver_lat ? [activeRide.driver_lat, activeRide.driver_lng] : null}
              routeGeometry={activeRide.route_geometry}
            />
          </div>
        ) : (
          /* --- LIST MODE / OFFLINE VIEW --- */
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
            {!isOnline ? (
              <div style={{ textAlign: 'center', marginTop: '30vh', color: '#94a3b8' }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>💤</div>
                <h3 style={{ fontWeight: 'black', color: '#64748b' }}>You are Offline</h3>
                <p>Go online to start receiving rides.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: 'black', color: '#1e293b' }}>Available Requests</h2>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '20vh', color: '#94a3b8' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p style={{ fontWeight: 'bold' }}>Scanning for nearby rides...</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} style={{ 
                      padding: '20px', borderRadius: '20px', marginBottom: '15px', 
                      background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span style={{ fontWeight: 'black', color: '#22c55e', fontSize: '24px' }}>₹{order.price}</span>
                        <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                          {order.distance_km} km
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                        <p style={{ margin: '5px 0' }}>📍 <span style={{fontWeight: 'bold'}}>From:</span> {order.pickup_address}</p>
                        <p style={{ margin: '5px 0' }}>🏁 <span style={{fontWeight: 'bold'}}>To:</span> {order.dropoff_address}</p>
                      </div>
                      <button 
                        onClick={() => acceptOrder(order.id)} 
                        style={{ 
                          width: '100%', marginTop: '20px', padding: '16px', 
                          background: '#2563eb', color: 'white', border: 'none', 
                          borderRadius: '15px', cursor: 'pointer', fontWeight: 'black', fontSize: '16px',
                          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
                        }}
                      >
                        ACCEPT RIDE
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Navigation Bar */}
      {/* Hide the nav bar if the driver is actively navigating a trip to save screen space */}
      {(!activeRide || currentView !== 'home') && (
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          background: 'white', display: 'flex', justifyContent: 'space-around', 
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', zIndex: 3000,
          borderTop: '1px solid #e2e8f0', paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          <button onClick={() => setCurrentView('home')} style={navBtnStyle('home')}>
            <span style={{ fontSize: '20px' }}>🏠</span> Home
          </button>
          <button onClick={() => setCurrentView('wallet')} style={navBtnStyle('wallet')}>
            <span style={{ fontSize: '20px' }}>💳</span> Wallet
          </button>
          <button onClick={() => setCurrentView('history')} style={navBtnStyle('history')}>
            <span style={{ fontSize: '20px' }}>📜</span> History
          </button>
          <button onClick={() => setCurrentView('reviews')} style={navBtnStyle('reviews')}>
            <span style={{ fontSize: '20px' }}>⭐</span> Reviews
          </button>
        </div>
      )}

    </div>
  );
}

export default App;