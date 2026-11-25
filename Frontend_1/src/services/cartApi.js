import { apiRequest } from './api';
export const cartApi = {
  get: () => apiRequest('/cart'),
  add: payload => apiRequest('/cart/items', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, quantity, variant = null) => apiRequest(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity, variant }) }),
  remove: (id, variant = null) => apiRequest(`/cart/items/${id}${variant == null ? '' : `?${new URLSearchParams({ variant })}`}`, { method: 'DELETE' }),
  clear: () => apiRequest('/cart', { method: 'DELETE' }),
};
