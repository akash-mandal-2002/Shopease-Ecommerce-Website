const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('shopease_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); }
  catch { throw new Error(`Cannot reach the ShopEase API at ${API_URL}. Start Backend_1 and check Frontend_1/.env (VITE_API_URL).`); }
  const payload = await response.json().catch(() => ({ message: 'Invalid server response.' }));
  if (!response.ok) throw new Error(payload.message || 'Request failed.');
  return payload;
}
