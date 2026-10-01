import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// A single readable message for every failure path, so pages can render a
// consistent error state instead of leaking axios internals into the UI.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      (err.code === 'ECONNABORTED'
        ? 'Request timed out — the investigation may still be running.'
        : err.response
          ? `Request failed (${err.response.status})`
          : 'Cannot reach the FraudLens API. Is the backend running?');
    const wrapped = new Error(message);
    wrapped.status = err.response?.status;
    wrapped.original = err;
    return Promise.reject(wrapped);
  }
);

const params = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined && v !== null && v !== '' && v !== 'ALL') out[k] = v;
  }
  return out;
};

// --- System ---
export const getHealth = () => api.get('/health');

// --- Dashboard ---
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getAgentActivity = () => api.get('/dashboard/agent-activity');

// --- Transactions ---
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const getTransactions = (filters) => api.get('/transactions', { params: params(filters) });
export const createTransaction = (data) => api.post('/transactions', data);

// --- Alerts ---
export const getAlerts = (filters) => api.get('/alerts', { params: params(filters) });
export const getAlert = (id) => api.get(`/alerts/${id}`);

// --- Cases ---
export const getCases = (filters) => api.get('/cases', { params: params(filters) });
export const getCase = (id) => api.get(`/cases/${id}`);
export const getCaseMeta = (id) => api.get(`/cases/${id}/meta`);
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
export const getInvestigationAreas = () => api.get('/investigations/areas');
export const reinvestigate = (id, areas) => api.post(`/investigations/${id}/reinvestigate`, { areas });

// --- Customers ---
export const getCustomer = (id) => api.get(`/customers/${id}`);

export default api;
