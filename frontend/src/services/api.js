import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const dashboardAPI = {
    getStats: () => api.get('/dashboard')
};

export const roomsAPI = {
    getAll: () => api.get('/rooms'),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    update: (id, data) => api.put(`/rooms/${id}`, data),
    delete: (id) => api.delete(`/rooms/${id}`),
    addSection: (roomId, data) => api.post(`/rooms/${roomId}/sections`, data),
    addBeds: (roomId, data) => api.post(`/rooms/${roomId}/beds`, data),
    updateBed: (bedId, data) => api.put(`/rooms/beds/${bedId}`, data),
    deleteBed: (bedId) => api.delete(`/rooms/beds/${bedId}`)
};

export const residentsAPI = {
    getAll: (params) => api.get('/residents', { params }),
    getById: (id) => api.get(`/residents/${id}`),
    getVacantBeds: () => api.get('/residents/vacant-beds'),
    create: (data) => api.post('/residents', data),
    update: (id, data) => api.put(`/residents/${id}`, data),
    vacate: (id) => api.post(`/residents/${id}/vacate`)
};

export const rentAPI = {
    getByMonth: (month, year) => api.get('/rent', { params: { month, year } }),
    getPending: () => api.get('/rent/pending'),
    markPaid: (id) => api.put(`/rent/${id}/pay`),
    markPartial: (id, amount) => api.put(`/rent/${id}/partial`, { amount }),
    markClaimed: (id, amount) => api.put(`/rent/${id}/claim`, { claimedAmount: amount }),
    confirmClaim: (id, confirmed, amount) => api.put(`/rent/${id}/confirm`, { confirmed, amount })
};

export const foodAPI = {
    getToday: () => api.get('/food/today'),
    markHome: (residentIds, isHome) => api.put('/food/mark-home', { residentIds, isHome }),
    toggleResident: (id) => api.put(`/food/${id}/toggle`),
    reset: () => api.put('/food/reset')
};

export const whatsappAPI = {
    init: () => api.post('/whatsapp/init'),
    getStatus: () => api.get('/whatsapp/status'),
    sendReminders: (residents) => api.post('/whatsapp/send-reminders', { residents }),
    disconnect: () => api.post('/whatsapp/disconnect')
};
