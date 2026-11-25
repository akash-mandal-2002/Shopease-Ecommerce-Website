import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('shopease_token')));

  // Restore session on mount
  useEffect(() => {
    if (!localStorage.getItem('shopease_token')) return;
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('shopease_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload) => {
    const res = await authApi.login(payload);
    localStorage.setItem('shopease_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    // New flow: registration now sends OTP, does NOT log the user in
    const res = await authApi.register(payload);
    // Return the response for the component to navigate to verification
    return res;
  }, []);

  const verifyEmail = useCallback(async (payload) => {
    const res = await authApi.verifyEmail(payload);
    return res;
  }, []);

  const resendOtp = useCallback(async (payload) => {
    const res = await authApi.resendOtp(payload);
    return res;
  }, []);

  const logout = useCallback(async () => {
    // Attempt server-side logout (best-effort)
    try {
      await authApi.logout();
    } catch {
      // Server might be unreachable; still clear local state
    }
    localStorage.removeItem('shopease_token');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await authApi.updateProfile(payload);
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendOtp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
