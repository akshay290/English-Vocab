import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setToken, clearToken, getToken, type User } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  adminLogin: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = getToken();
        if (token) {
          const me = await api.getMe();
          setUser(me);
        } else {
          // Initialize with default student user for instant seamless experience
          await guestLogin();
        }
      } catch (err) {
        // Fallback to guest
        try {
          await guestLogin();
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    setToken(res.token);
    setUser(res.user);
  };

  const guestLogin = async () => {
    try {
      const res = await api.login({ email: "student@sscvocab.com", password: "student123" });
      setToken(res.token);
      setUser(res.user);
    } catch {
      // If student login fails, set mock user
      setUser({
        id: 2,
        name: "Akshay Sharma (Aspirant)",
        email: "student@sscvocab.com",
        role: "user",
        createdAt: new Date().toISOString(),
      });
    }
  };

  const adminLogin = async (password: string) => {
    const res = await api.adminLogin(password);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        guestLogin,
        adminLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
