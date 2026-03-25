// src/App.jsx
import React, { useState, useEffect } from 'react';
import api from './api/axios';
import Signup from './components/Signup';
import Login from './components/Login';
import './App.css';
import IndoraMap from './components/IndoraMap';
import DriverReviews from './components/DriverReviews';
import DriverHistory from './components/DriverHistory'; 
import DriverWallet from './components/DriverWallet'; 
import DriverProfile from './components/DriverProfile';  
import io from 'socket.io-client';

function App() {
  const [userState, setUserState] = useState({ isLoggedIn: false, username: '', isVerified: false });
  const [orders, setOrders] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUsername = localStorage.getItem('driver_username') || '';
    const savedOnline = localStorage.getItem('indora_driver_online') === 'true';
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://parceel-api.onrender.com';
    const newSocket = io(backendUrl);
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUserState({ isLoggedIn: true, username: savedUsername, isVerified: true });
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
            await api.patch(`rides/${activeRide.id}/`, { driver_lat: latitude, driver_lng: longitude });
            if (socket) socket.emit('driver_location_update', { order_id: activeRide.id, lat: latitude, lng: longitude });
          } catch (error) { console.error("Failed to update location", error); }
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [activeRide, isOnline, socket]);

  const handleLogin = (username, token) => {
    if (!token) return;
    localStorage.setItem('access_token', token);
    localStorage.setItem('driver_username', username); 
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
    setUserState({ isLoggedIn: true, username: username, isVerified: true });
  };

  const handleLogout = () => {
    localStorage.clear();
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
      const activeOrNew = response.data.filter(o => o.status.toLowerCase() === 'requested' || o.status.toLowerCase() === 'accepted');
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
      setCurrentView('home'); 
    } catch (error) { alert("Error accepting ride."); }
  };

  const completeRide = async (id) => {
    try {
      await api.post(`rides/${id}/complete_ride/`);
      if (socket) socket.emit('ride_completed_event', { order_id: id });
      alert("Trip Finished!");
      setOrders(prev => prev.filter(o => o.id !== id));
      setCurrentView('wallet'); 
    } catch (error) { alert("Error completing ride."); }
  };

  if (!userState.isLoggedIn) {
    return showLogin ? 
      <Login onLoginSuccess={handleLogin} switchToSignup={() => setShowLogin(false)} /> : 
      <Signup onSignupSuccess={handleLogin} />;
  }

  // Common SVGs
  const PickupIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600 mt-0.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
  const DropoffIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;

  return (
    <div className="h-[100dvh] w-full md:max-w-md mx-auto bg-zinc-50 flex flex-col relative md:border-x md:border-zinc-200 md:shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden font-sans">
      
      {/* 1. GLASSMORPHISM HEADER */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-white/50 z-[2000] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center px-4 md:px-5">
          <h2 className="text-2xl md:text-3xl font-black italic text-red-600 tracking-tighter m-0 drop-shadow-sm">P- Pilot</h2>
          
          <div className="flex gap-2 md:gap-3 items-center">
              <button 
                  onClick={toggleOnline}
                  className={`flex items-center gap-1.5 px-3 py-2 md:px-4 rounded-full font-black text-[10px] md:text-xs transition-all shadow-sm backdrop-blur-sm border ${isOnline ? 'bg-green-50/80 text-green-600 border-green-200' : 'bg-zinc-100/80 text-zinc-500 border-zinc-200 hover:bg-zinc-200/80'}`}
              >
                  {isOnline ? (
                      <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse"><circle cx="12" cy="12" r="10" /></svg> ONLINE</>
                  ) : (
                      <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="10" /></svg> OFFLINE</>
                  )}
              </button>

              
          </div>
      </header>

      {/* 2. Main Body Content */}
      <div className="absolute inset-0 pt-16 pb-20 relative h-full w-full">
        {currentView === 'reviews' ? <DriverReviews /> :
         currentView === 'history' ? <DriverHistory /> :
         currentView === 'wallet'  ? <DriverWallet /> : 
         currentView === 'profile' ? <DriverProfile username={userState.username} onLogout={handleLogout} /> : // <-- ADD THIS LINE
         activeRide ? (
          
          /* --- NAVIGATION MODE --- */
          <div className="absolute inset-0 pt-16">
            <div className="absolute top-20 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-white/50">
              <h3 className="m-0 text-green-500 font-black text-base md:text-lg uppercase tracking-wide flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse"><circle cx="12" cy="12" r="10"/></svg> Active Trip #{activeRide.id}
              </h3>
              
              <div className="my-3 p-3 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                <p className="m-0 mb-1 text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
                  {activeRide.customer_name || 'Customer'}
                </p>
                <p className="m-0 text-xs text-blue-600 font-bold flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {activeRide.customer_phone || 'No phone provided'}
                </p>
              </div>

              <p className="mb-4 text-sm font-semibold text-zinc-600 flex items-start gap-2">
                <DropoffIcon /> 
                <span className="leading-snug">{activeRide.dropoff_address || "Navigating to Destination..."}</span>
              </p>
              
              <button onClick={() => completeRide(activeRide.id)} className="w-full p-3 md:p-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-black text-base md:text-lg transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)]">
                FINISH TRIP
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
          <div className="absolute inset-0 pt-20 p-4 md:p-6 overflow-y-auto pb-24">
            {!isOnline ? (
              <div className="text-center mt-[15vh] md:mt-[20vh] text-zinc-400 px-4">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 opacity-50 transition-transform hover:scale-110">
                  <path d="M2 12h4l3-9 5 18 3-9h5"/>
                </svg>
                <h3 className="font-black text-xl md:text-2xl text-zinc-500 mb-2">You are Offline</h3>
                <p className="font-medium text-sm md:text-base mb-8">Go online to start receiving ride requests.</p>

                {/* Glass Motivational Quote Card */}
                <div className="mx-auto max-w-sm bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
                   <svg className="absolute -top-4 -left-4 text-zinc-100 w-24 h-24 -rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                   <p className="relative z-10 text-sm md:text-base font-black text-zinc-700 italic leading-relaxed">
                     "You are the real Pilot on the road. <br/> Take off with happiness, land with so much money!"
                   </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-xl mb-4 font-black text-zinc-800 tracking-wide">Available Requests</h2>
                {orders.length === 0 ? (
                  <div className="text-center mt-[20vh] text-zinc-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4 text-blue-500 animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    <p className="font-bold text-sm md:text-base text-zinc-500">Scanning your area for riders...</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-4 md:p-5 rounded-3xl mb-4 bg-white/80 backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-white transition-transform hover:-translate-y-1">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-green-500 text-2xl md:text-3xl tracking-tight">₹{order.price}</span>
                        <span className="text-xs md:text-sm text-zinc-600 bg-zinc-100/80 px-3 py-1.5 rounded-xl font-bold tracking-wide border border-zinc-200/50">
                          {order.distance_km} km
                        </span>
                      </div>
                      
                      <div className="text-xs md:text-sm text-zinc-600 leading-relaxed space-y-3 mb-5">
                        <div className="flex gap-2 items-start">
                          <PickupIcon />
                          <p className="m-0"><span className="font-bold text-zinc-800">Pickup:</span> {order.pickup_address}</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <DropoffIcon />
                          <p className="m-0"><span className="font-bold text-zinc-800">Dropoff:</span> {order.dropoff_address}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => acceptOrder(order.id)} 
                        className="w-full p-3 md:p-4 bg-zinc-900 hover:bg-black active:scale-95 text-white rounded-xl font-black text-sm md:text-base transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
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

      {/* 3. GLASS BOTTOM NAVIGATION BAR */}
      {(!activeRide || currentView !== 'home') && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl flex justify-around items-center pb-safe pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-white/60 z-[3000]">
          
          <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 md:p-3 flex-1 transition-colors ${currentView === 'home' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform active:scale-90">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Home</span>
          </button>
          
          <button onClick={() => setCurrentView('wallet')} className={`flex flex-col items-center gap-1 p-2 md:p-3 flex-1 transition-colors ${currentView === 'wallet' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === 'wallet' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform active:scale-90">
              <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Wallet</span>
          </button>
          
          <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 p-2 md:p-3 flex-1 transition-colors ${currentView === 'history' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === 'history' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform active:scale-90">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">History</span>
          </button>
          
          <button onClick={() => setCurrentView('reviews')} className={`flex flex-col items-center gap-1 p-2 md:p-3 flex-1 transition-colors ${currentView === 'reviews' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === 'reviews' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform active:scale-90">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Reviews</span>
          </button>

          <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 p-2 md:p-3 flex-1 transition-colors ${currentView === 'profile' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform active:scale-90">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Profile</span>
          </button>

        </div>
      )}
    </div>
  );
}

export default App;