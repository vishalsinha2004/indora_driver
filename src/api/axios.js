import axios from 'axios';

const api = axios.create({
    // Use the environment variable, fallback to localhost if not set
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/', 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    // Ensure the token is valid before attaching
    if (token && token !== "undefined" && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;