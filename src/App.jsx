import React, { useState, useEffect } from 'react';
import api from './api/axios';
import Signup from './components/Signup';
import Login from './components/Login';
import IndoraMap from './components/IndoraMap';
import './App.css';

function App() {
  const [userState, setUserState] = useState({ 
    isLoggedIn: !!localStorage.getItem('access_token'), 
    username: '', 
  });
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]); 
  const [view, setView] = useState('jobs');    
  const [showLogin, setShowLogin] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const activeRide = orders.find(o => o.status.toLowerCase() === 'accepted');

  // --- WALLET CALCULATIONS ---
  const calculateEarnings = () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    
    // Start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let todayTotal = 0;
    let weekTotal = 0;
    let allTimeTotal = 0;

    history.forEach(item => {
      const itemDate = new Date(item.created_at);
      const price = parseFloat(item.price || 0);

      allTimeTotal += price;
      
      // Check if Today
      if (itemDate.toLocaleDateString() === todayStr) {
        todayTotal += price;
      }

      // Check if This Week
      if (itemDate >= startOfWeek) {
        weekTotal += price;
      }
    });

    return { todayTotal, weekTotal, allTimeTotal };
  };

  const { todayTotal, weekTotal, allTimeTotal } = calculateEarnings();

  const getServiceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'two-wheeler': return '🛵';
      case 'truck': return '🚛';
      case 'mini': return '🚐';
      case 'sedan': return '🚗';
      default: return '📦';
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('rides/');
      const activeOrNew = response.data.filter(o => ['requested', 'accepted'].includes(o.status.toLowerCase()));
      setOrders(activeOrNew);

      const pastJobs = response.data.filter(o => ['completed', 'cancelled'].includes(o.status.toLowerCase()));
      setHistory(pastJobs);
    } catch (error) { console.error("Fetch error:", error); }
  };

  useEffect(() => {
    let interval;
    if (userState.isLoggedIn && isOnline) {
      fetchOrders();
      interval = setInterval(fetchOrders, 3000);
    }
    return () => clearInterval(interval);
  }, [userState.isLoggedIn, isOnline]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsOnline(false);
    setUserState({ isLoggedIn: false, username: '' });
  };

  const toggleOnline = async () => {
    try {
      const response = await api.post('users/driver_profile/toggle_status/');
      setIsOnline(response.data.is_online);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const acceptOrder = async (id) => {
    try { await api.post(`rides/${id}/accept_ride/`); fetchOrders(); } 
    catch (e) { alert("Error accepting job"); }
  };

  const completeRide = async (id) => {
    try {
      await api.patch(`rides/${id}/`, { status: 'completed' });
      alert("🏁 Trip Finished!");
      fetchOrders();
      setView('history');
    } catch (e) { alert("Error"); }
  };

  if (!userState.isLoggedIn) {
    return showLogin ? 
      <Login onLoginSuccess={(u, t) => { localStorage.setItem('access_token', t); setUserState({isLoggedIn: true, username: u}); }} switchToSignup={() => setShowLogin(false)} /> : 
      <Signup onSignupSuccess={() => setShowLogin(true)} />;
  }

  return (
    <div className="driver-app">
      <header className={`app-header ${isOnline ? 'online' : 'offline'}`}>
        <div className="header-left"><span className="logo-text">INDORA Driver</span></div>
        <div className="header-right">
          <button onClick={toggleOnline} className="status-btn">{isOnline ? '🟢 ONLINE' : '⚪ GO ONLINE'}</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {!activeRide && isOnline && (
        <div className="tab-navigation">
          <button className={view === 'jobs' ? 'active-tab' : ''} onClick={() => setView('jobs')}>Available Jobs</button>
          <button className={view === 'history' ? 'active-tab' : ''} onClick={() => setView('history')}>Wallet & History</button>
        </div>
      )}

      <main className="main-content">
        {activeRide ? (
          <div className="active-trip-view">
            <div className="trip-status-card">
              <div className="card-header">
                <span className="badge">{getServiceIcon(activeRide.service_type)} {activeRide.service_type}</span>
                <span className="otp">OTP: 4592</span>
              </div>
              <p><strong>From:</strong> {activeRide.pickup_address}</p>
              <p><strong>To:</strong> {activeRide.dropoff_address}</p>
              <button onClick={() => completeRide(activeRide.id)} className="finish-btn">FINISH RIDE</button>
            </div>
            <div className="map-wrapper">
              <IndoraMap pickup={[activeRide.pickup_lat, activeRide.pickup_lng]} dropoff={[activeRide.dropoff_lat, activeRide.dropoff_lng]} />
            </div>
          </div>
        ) : (
          <div className="content-area">
            {view === 'jobs' ? (
              <div className="job-list-view">
                {!isOnline ? (
                  <div className="offline-placeholder"><h3>You're Offline</h3><p>Go online to earn</p></div>
                ) : (
                  <div className="requests-container">
                    {orders.filter(o => o.status === 'requested').map(order => (
                      <div key={order.id} className="job-card">
                        <div className="job-card-header">
                          <div className="job-price">₹{order.price}</div>
                          <div className="service-tag">{getServiceIcon(order.service_type)} {order.service_type}</div>
                        </div>
                        <p><strong>From:</strong> {order.pickup_address}</p>
                        <button onClick={() => acceptOrder(order.id)} className="accept-btn">ACCEPT JOB</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* --- WALLET & HISTORY VIEW --- */
              <div className="history-view">
                <div className="wallet-card">
                  <h3>My Earnings</h3>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <label>Today</label>
                      <span className="amount">₹{todayTotal}</span>
                    </div>
                    <div className="stat-box">
                      <label>This Week</label>
                      <span className="amount">₹{weekTotal}</span>
                    </div>
                    <div className="stat-box">
                      <label>Lifetime</label>
                      <span className="amount">₹{allTimeTotal}</span>
                    </div>
                  </div>
                </div>

                <h2 className="section-title">Recent Trips</h2>
                {history.length === 0 ? <p className="empty-msg">No trips found.</p> : 
                  history.map(item => (
                    <div key={item.id} className="history-card">
                      <div className="history-header">
                        <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                        <span className="amount">₹{item.price}</span>
                      </div>
                      <p className="address-text">📍 {item.dropoff_address}</p>
                      <div className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;