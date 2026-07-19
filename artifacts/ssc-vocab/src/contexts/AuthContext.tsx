import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useGetCurrentUser, User, AuthResponse } from '@workspace/api-client-react';
import { setAuthTokenGetter } from '@workspace/api-client-react/custom-fetch';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  
  // Set the token getter for the API client right away
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('auth_token'));
  }, []);

  const { data: currentUser, isLoading, isError } = useGetCurrentUser({
    query: {
      enabled: !!token,
      queryKey: ['/api/auth/me', token], // include token in queryKey so it refetches if token changes
      retry: false,
    }
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (isError) {
      // If token is invalid/expired
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  }, [currentUser, isError]);

  const login = useCallback((authData: AuthResponse) => {
    localStorage.setItem('auth_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isLoading: !!token && isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
