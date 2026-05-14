import axios from 'axios';

// Base URL for the Flask backend
//export const BACKEND_URL = 'https://websecura.onrender.com';
export const BACKEND_URL = 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Security Scan API
export const scanWebsite = async (url, userId = null) => {
  const requestBody = { url };
  if (userId) {
    requestBody.user_id = userId;
  }
  const response = await api.post('/api/scan', requestBody);
  return response.data;
};

// Execute pending scan after authentication
export const executePendingScan = async (sessionToken, userId) => {
  const response = await api.post(`/api/scan/pending/${sessionToken}`, {
    user_id: userId
  });
  return response.data;
};

// Authentication APIs
export const registerUser = async (username, email, password) => {
  const response = await api.post('/api/register', {
    username,
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/login', {
    email,
    password,
  });
  return response.data;
};

// User Profile APIs
export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

export const updateUserProfile = async (userId, updates) => {
  const response = await api.put(`/api/users/${userId}`, updates);
  return response.data;
};

export const getUserStats = async (userId) => {
  const response = await api.get(`/api/users/${userId}/stats`);
  return response.data;
};

// Scan History APIs
export const getUserScans = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/api/scans/${userId}`, {
    params: { page, limit },
  });
  return response.data;
};

export const getScanDetails = async (scanId) => {
  const response = await api.get(`/api/scans/details/${scanId}`);
  return response.data;
};

export const deleteScan = async (scanId, userId) => {
  const response = await api.delete(`/api/scans/${scanId}`, {
    data: { user_id: userId },
  });
  return response.data;
};

// Contact Form API
export const submitContactForm = async (name, email, subject, message) => {
  const response = await api.post('/api/contact', {
    name,
    email,
    subject,
    message,
  });
  return response.data;
};

// Admin APIs
export const getAdminStats = async (adminId) => {
  const response = await api.get('/api/admin/stats', {
    params: { admin_id: adminId },
  });
  return response.data;
};

export const getAllUsers = async (adminId) => {
  const response = await api.get('/api/admin/users', {
    params: { admin_id: adminId },
  });
  return response.data;
};

export const getAllScans = async (adminId) => {
  const response = await api.get('/api/admin/scans', {
    params: { admin_id: adminId },
  });
  return response.data;
};

export const getAllMessages = async (adminId) => {
  const response = await api.get('/api/admin/messages', {
    params: { admin_id: adminId },
  });
  return response.data;
};

export const getSystemInfo = async (adminId) => {
  const response = await api.get('/api/admin/system-info', {
    params: { admin_id: adminId },
  });
  return response.data;
};

export const toggleUserStatus = async (userId, isActive, adminId) => {
  const response = await api.put(`/api/admin/users/${userId}/status`, {
    admin_id: adminId,
    is_active: !isActive,
  });
  return response.data;
};

export const deleteScanAdmin = async (scanId, adminId) => {
  const response = await api.delete(`/api/admin/scans/${scanId}`, {
    data: { admin_id: adminId },
  });
  return response.data;
};

export const markMessageRead = async (messageId, adminId) => {
  const response = await api.put(`/api/admin/messages/${messageId}/read`, {
    admin_id: adminId,
  });
  return response.data;
};

export const markAllMessagesRead = async (adminId) => {
  const response = await api.put('/api/admin/messages/read-all', {
    admin_id: adminId,
  });
  return response.data;
};

export const deleteMessage = async (messageId, adminId) => {
  const response = await api.delete(`/api/admin/messages/${messageId}`, {
    data: { admin_id: adminId },
  });
  return response.data;
};

export default api;