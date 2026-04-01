import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:5000/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Users
export const getUsers = () => API.get('/users');
export const getDoctors = () => API.get('/users/doctors');
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Resources
export const getResources = (params) => API.get('/resources', { params });
export const getResourceSummary = () => API.get('/resources/summary');
export const createResource = (data) => API.post('/resources', data);
export const updateResource = (id, data) => API.put(`/resources/${id}`, data);
export const deleteResource = (id) => API.delete(`/resources/${id}`);

// Patients
export const getPatients = (params) => API.get('/patients', { params });
export const getPatient = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post('/patients', data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);

// Allocations
export const getAllocations = () => API.get('/allocations');
export const createAllocation = (data) => API.post('/allocations', data);
export const releaseAllocation = (id) => API.put(`/allocations/${id}/release`);

// Surgeries
export const getSurgeries = () => API.get('/surgeries');
export const createSurgery = (data) => API.post('/surgeries', data);
export const updateSurgery = (id, data) => API.put(`/surgeries/${id}`, data);
export const cancelSurgery = (id) => API.delete(`/surgeries/${id}`);

// Reports
export const getDashboard = () => API.get('/reports/dashboard');
export const getUtilization = () => API.get('/reports/utilization');
export const getBedOccupancy = () => API.get('/reports/bed-occupancy');

export default API;
