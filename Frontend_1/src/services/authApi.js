import { apiRequest } from './api';

export const authApi = {
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload) => apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
  updateProfile: (payload) => apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  changePassword: (payload) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
};
