import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
        // If the token is expired or invalid the interceptor will fire
        // the auth:expired event and we'll handle it below.
        authService.getMe()
          .then((freshUser) => {
            // Update with fresh user data from server
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token invalid — clear state (interceptor already cleared localStorage)
            setUser(null);
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
      setUser(null);
      toast.error('Session expired — please sign in again');
      navigate('/signin');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
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
