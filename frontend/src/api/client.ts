import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const SESSION_TOKEN_KEY = 'qc_session_token';

type AuthTrackingAxiosRequestConfig = InternalAxiosRequestConfig & {
  usedAdminToken?: boolean;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Still send cookies as fallback
});

// Attach session token from localStorage (works on all browsers including Safari/Samsung)
api.interceptors.request.use((config) => {
  const requestConfig = config as AuthTrackingAxiosRequestConfig;

  // Admin token takes priority
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    requestConfig.usedAdminToken = true;
    return config;
  }

  // Session token for regular users
  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  requestConfig.usedAdminToken = false;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestConfig = error?.config as AuthTrackingAxiosRequestConfig | undefined;
    const usedAdminToken = Boolean(requestConfig?.usedAdminToken);

    if (status === 401 && usedAdminToken) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      window.dispatchEvent(new Event('admin-auth-expired'));
    }

    return Promise.reject(error);
  }
);

// Helper to store/clear session token
export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

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
  getParticipantByToken: (token: string) => api.get(`/registration/token/${token}`),
  initiatePaymentByToken: (token: string) => api.post(`/registration/token/${token}/pay`),
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

export const faqApi = {
  getPublished: () => api.get('/faq'),
};

export const adminFaqApi = {
  getAll: () => api.get('/faq/admin'),
  create: (data: { question: string; answer: string; displayOrder?: number; isPublished?: boolean }) =>
    api.post('/faq/admin', data),
  update: (id: string, data: { question?: string; answer?: string; displayOrder?: number; isPublished?: boolean }) =>
    api.put(`/faq/admin/${id}`, data),
  delete: (id: string) => api.delete(`/faq/admin/${id}`),
  importCsv: (formData: FormData) => api.post('/faq/admin/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  exportCsv: () => api.get('/faq/admin/export', { responseType: 'blob' }),
};

export const attendanceApi = {
  scan: (qrData: string) => api.post('/attendance/scan', { qrData }),
  manual: (rollNumber: string, notes?: string) =>
    api.post('/attendance/manual', { rollNumber, notes }),
  getStats: (params?: object) => api.get('/attendance/stats', { params }),
  getList: (params?: object) => api.get('/attendance/list', { params }),
  exportCsv: (params?: object) =>
    api.get('/attendance/export', { params, responseType: 'blob' }),
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
  scanResult: (formData: FormData) =>
    api.post('/admin/results/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getResultsList: (params?: object) =>
    api.get('/admin/results', { params }),
  publishResults: (publicationDate?: string) =>
    api.put('/admin/results/publish', { publicationDate }),
  getRegistrations: (params?: object) =>
    api.get('/admin/registrations', { params }),
  getFees: () => api.get('/admin/portal/fees'),
  updateFees: (feeJunior: number, feeSenior: number) =>
    api.put('/admin/portal/fees', { feeJunior, feeSenior }),
  getEventDetails: () => api.get('/admin/portal/event-details'),
  updateEventDetails: (data: { eventDate?: string; eventTime?: string; reportingTime?: string; examTime?: string; venue?: string; venueMapUrl?: string; prizeDistributionDate?: string; prizeDistributionTime?: string; prizeDistributionVenue?: string; prizeDistributionMapUrl?: string; whatsappSupportName?: string; whatsappSupportNumber?: string; callContactName?: string; callContactNumber?: string }) =>
    api.put('/admin/portal/event-details', data),
  sendGroupInvite: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/send-group-invite`),
  sendAdmitCardReminder: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/remind-admit-card`),
  sendPaymentReminder: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/remind-payment`),
  resendPaymentConfirmation: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/resend-payment-confirmation`),
  resendGroupInvite: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/resend-group-invite`),
  resendAdmitCardReminder: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/resend-admit-card-reminder`),
  resendPaymentReminder: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/resend-payment-reminder`),
  sendImportantDates: (participantId: string, datesChanged: boolean) =>
    api.post(`/admin/registrations/${participantId}/send-important-dates`, { datesChanged }),
  resendImportantDates: (participantId: string, datesChanged: boolean) =>
    api.post(`/admin/registrations/${participantId}/resend-important-dates`, { datesChanged }),
  getSessions: () => api.get('/admin/sessions'),
  expireAllSessions: () => api.post('/admin/sessions/expire-all'),
  expireSession: (sessionId: string) => api.post(`/admin/sessions/${sessionId}/expire`),
  verifyPayment: (participantId: string) =>
    api.post(`/admin/registrations/${participantId}/verify-payment`),
  sendCustomMessage: (participantId: string, message: string) =>
    api.post(`/admin/registrations/${participantId}/send-custom-message`, { message }),
  downloadAdmitCard: (participantId: string) =>
    api.get(`/admin/registrations/${participantId}/download-admit-card`, { responseType: 'blob' }),
  sendAdmitCardWhatsApp: (participantId: string, godMode = false) =>
    api.post(`/admin/registrations/${participantId}/send-admit-card-whatsapp`, { godMode }),
  admitCardQueueStart: () => api.post('/admin/admit-card-queue/start'),
  admitCardQueueStatus: () => api.get('/admin/admit-card-queue/status'),
  admitCardQueueStop: () => api.post('/admin/admit-card-queue/stop'),
  admitCardQueueReset: () => api.post('/admin/admit-card-queue/reset'),
  getFaqs: () => api.get('/admin/faqs'),
  createFaq: (question: string, answer: string) => api.post('/admin/faqs', { question, answer }),
  updateFaq: (id: string, data: { question?: string; answer?: string; isPublished?: boolean; order?: number }) =>
    api.put(`/admin/faqs/${id}`, data),
  deleteFaq: (id: string) => api.delete(`/admin/faqs/${id}`),
  generatePaymentToken: (participantId: string, force = false) =>
    api.post(`/admin/registrations/${participantId}/generate-payment-token`, { force }),
};
