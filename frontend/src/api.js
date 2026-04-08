import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // Địa chỉ server Laravel của bạn
});

export default api;