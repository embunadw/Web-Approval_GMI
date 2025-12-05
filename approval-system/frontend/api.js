// api.js

const API = {
    // Helper function for making API requests
    request: async (endpoint, options = {}) => {
        const token = auth.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    auth.logout();
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        login: async (email, password) => {
            return API.request('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        },
        logout: async () => {
            return API.request('/logout', {
                method: 'POST'
            });
        },
        me: async () => {
            return API.request('/me');
        }
    },

    // Master Items endpoints
    masterItems: {
        getAll: async () => {
            return API.request('/master-items');
        },
        getById: async (id) => {
            return API.request(`/master-items/${id}`);
        },
        create: async (data) => {
            return API.request('/master-items', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        importExcel: async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            const token = auth.getToken();
            const response = await fetch(`${CONFIG.API_BASE_URL}/master-items/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Import failed');
            }

            return data;
        }
    },

    // Requests endpoints
    requests: {
        getAll: async () => {
            return API.request('/requests');
        },
        getById: async (id) => {
            return API.request(`/requests/${id}`);
        },
        create: async (data) => {
            return API.request('/requests', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        approve: async (id) => {
            return API.request(`/requests/${id}/approve`, {
                method: 'POST'
            });
        },
        reject: async (id, reason) => {
            return API.request(`/requests/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ rejection_reason: reason })
            });
        }
    }
};

console.log('API functions loaded');