import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Enable sending cookies
});

// Attach admin token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const portalApi = {
  getStatus: () => api.get('/portal/status'),
  getSliderImages: () => api.get('/portal/slider-images'),
};

export const otpApi = {
  send: (mobileNumber: string) => api.post('/otp/send', { mobileNumber }),
  verify: (mobileNumber: string, otp: string) => api.post('/otp/verify', { mobileNumber, otp }),
  logout: () => api.post('/otp/logout'),
};

export const registrationApi = {
  // Legacy — kept for backward compat
  submit: (data: object) => api.post('/registration', data),
  verifyOtp: (mobileNumber: string, otp: string) =>
    api.post('/registration/verify-otp', { mobileNumber, otp }),
  confirmPayment: (data: object) => api.post('/registration/confirm-payment', data),
  // New V2 endpoints
  saveDraft: (formData: FormData, token: string) =>
    api.post('/registration/draft', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
    }),
  getDraft: (token: string) =>
    api.get('/registration/draft', { headers: { Authorization: `Bearer ${token}` } }),
  initiatePayment: (token: string) =>
    api.post('/registration/initiate-payment', {}, { headers: { Authorization: `Bearer ${token}` } }),
  track: (mobile: string) => api.get('/registration/track', { params: { mobile } }),
  getAdmitCard: (id: string) => api.get(`/registration/admit-card/${id}`),
};

export const resultsApi = {
  getResult: (rollNumber: string) => api.get(`/results/${rollNumber}`),
};

export const profileApi = {
  getMe: () => api.get('/profile/me'),
  checkDuplicate: (mobile: string) => api.get('/profile/check-duplicate', { params: { mobile } }),
  downloadAdmitCard: () => api.get('/profile/admit-card/download', { responseType: 'blob' }),
  checkPendingPayments: () => api.post('/profile/check-pending-payments'),
};

export const adminApi = {
  login: (username: string, password: string) =>
    api.post('/admin/login', { username, password }),
  updateDates: (openingDate: string, closingDate: string) =>
    api.put('/admin/portal/dates', { openingDate, closingDate }),
  updateStatus: (manualStatus: string) =>
    api.put('/admin/portal/status', { manualStatus }),
  uploadSlider: (formData: FormData) =>
    api.post('/admin/slider/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSlider: (id: string) => api.delete(`/admin/slider/${id}`),
  reorderSlider: (order: Array<{ id: string; displayOrder: number }>) =>
    api.put('/admin/slider/reorder', { order }),
  uploadResults: (formData: FormData) =>
    api.post('/admin/results/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  publishResults: (publicationDate?: string) =>
    api.put('/admin/results/publish', { publicationDate }),
  getRegistrations: (params?: object) =>
    api.get('/admin/registrations', { params }),
  getFees: () => api.get('/admin/portal/fees'),
  updateFees: (feeJunior: number, feeSenior: number) =>
    api.put('/admin/portal/fees', { feeJunior, feeSenior }),
  getEventDetails: () => api.get('/admin/portal/event-details'),
  updateEventDetails: (data: { eventDate?: string; eventTime?: string; venue?: string; venueMapUrl?: string }) =>
    api.put('/admin/portal/event-details', data),
  sendGroupInvite: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/send-group-invite`),
  sendAdmitCardReminder: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/remind-admit-card`),
};
