import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// Automatically attach User ID for auditing
api.interceptors.request.use(config => {
    try {
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
        const customerUser = JSON.parse(localStorage.getItem('customer_user') || 'null');
        const user = adminUser || customerUser;
        
        if (user && user.id) {
            config.headers['X-User-ID'] = user.id;
        }
    } catch (e) {
        console.error("Error parsing user from localStorage:", e);
    }
    return config;
});

export default api;