import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { User, LoginCredentials, AuthResponse } from '@/types';
import { authService } from '@/services/api';
import { getRoleHomePath } from '@/lib/role-home';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // Guard to prevent double-handling of auth expiry
  const hasHandledExpiry = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/signin');
  }, [navigate]);

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Validate the token against the server in the background.
        // Only clear session on a definitive 401 (token expired/invalid).
        // Network errors, 500s, timeouts etc. should NOT log the user out.
        authService.getMe()
          .then((freshUser) => {
            // Update with fresh user data from server
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          })
          .catch((err) => {
            const status = err?.response?.status;
            if (status === 401) {
              // Token is genuinely expired/invalid — clear session
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
            // For all other errors (network, 500, timeout) — keep the user logged in
            // with cached data. The session will be re-validated on the next API call.
          });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for forced-logout events dispatched by the API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      // Guard: only handle once, and only if user was actually logged in
      if (hasHandledExpiry.current) return;
      hasHandledExpiry.current = true;

      setUser(null);
      // Don't clear localStorage again — the interceptor already did that
      toast.error('Session expired — please sign in again');
      navigate('/signin');

      // Reset guard after a delay so future real expirations can still be caught
      setTimeout(() => { hasHandledExpiry.current = false; }, 5000);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      // Reset expiry guard on fresh login
      hasHandledExpiry.current = false;

      const response: AuthResponse = await authService.login({
        restaurant_code: credentials.restaurant_code?.trim().toLowerCase() || undefined,
        username: credentials.username.trim().toLowerCase(),
        password: credentials.password,
      });

      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      toast.success(`Welcome back, ${response.user.full_name}!`);
      navigate(getRoleHomePath(response.user.role));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
