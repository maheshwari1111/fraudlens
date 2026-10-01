import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// --- Dashboard ---
export const getDashboardStats = () => api.get('/dashboard/stats');

// --- Transactions ---
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);

// --- Alerts ---
export const getAlerts = () => api.get('/alerts');
export const getAlert = (id) => api.get(`/alerts/${id}`);

// --- Cases ---
export const getCases = () => api.get('/cases');
export const getCase = (id) => api.get(`/cases/${id}`);
export const submitReview = (id, data) => api.post(`/cases/${id}/review`, data);
export const askCopilot = (id, question) => api.post(`/cases/${id}/copilot`, { question });
export const getReport = (id) => api.get(`/cases/${id}/report`);
export const getAuditTrail = (id) => api.get(`/cases/${id}/audit`);

// --- Investigations ---
export const startInvestigation = (data) => api.post('/investigations/start', data);
export const getInvestigation = (id) => api.get(`/investigations/${id}`);
export const getEvidence = (id) => api.get(`/investigations/${id}/evidence`);
export const getAgents = (id) => api.get(`/investigations/${id}/agents`);
export const getGraph = (id) => api.get(`/investigations/${id}/graph`);
export const reinvestigate = (id, data) => api.post(`/investigations/${id}/reinvestigate`, data);

// --- Customers ---
export const getCustomer = (id) => api.get(`/customers/${id}`);

export default api;
