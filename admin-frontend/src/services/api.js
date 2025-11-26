import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },

  // Items
  getPendingItems: async (skip = 0, limit = 50) => {
    const response = await api.get(
      `/admin/items/pending?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },
  getFullItemDetails: async (itemId) => {
    const response = await api.get(`/admin/items/${itemId}/full`);
    return response.data;
  },
  verifyItem: async (itemId, data) => {
    const response = await api.post(`/admin/items/${itemId}/verify`, data);
    return response.data;
  },

  // Claims
  getPendingClaims: async (skip = 0, limit = 50) => {
    const response = await api.get(
      `/admin/claims/pending?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },
  verifyClaim: async (claimId, data) => {
    const response = await api.post(`/admin/claims/${claimId}/verify`, data);
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await api.put("/admin/settings", settings);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (skip = 0, limit = 50) => {
    const response = await api.get(
      `/admin/audit-logs?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  // Users
  getUsers: async (skip = 0, limit = 50) => {
    const response = await api.get(`/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export default api;
