import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  Role,
  getAllPermissions,
  hasPermission as userHasPermission,
} from "../types/auth";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (action: string, subject: string) => boolean;
}

interface LoginResponse {
  id: string;
  username: string;
  firstName: string;
  name?: string;
  role: string;
  organizationId?: number | null;
  accessToken: string;
  refreshToken: string;
  redirectToResetPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      // console.log("user details",user);
    }
  }, [user]);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL_LOCAL || "https://default-api.com";

  const login = async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    // console.log("API_BASE_URL:", API_BASE_URL);
    // console.log(import.meta.env);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = "Login failed";
      try {
        const errorData = JSON.parse(raw);
        message = errorData?.ErrorMessage || errorData?.message || message;
      } catch {
        message = raw || message;
      }
      if (/ORGANIZATION_DISABLED/i.test(message)) {
        message = "Your organization is currently disabled. Please contact your main admin.";
      }
      throw new Error(message);
    }

    const data: LoginResponse = await response.json();

    if (!data.redirectToResetPassword) {
      const normalizedRole = (data.role || "").toLowerCase() as Role;
      const loggedInUser: User = {
        id: data.id,
        email: data.username,
        firstName: data.firstName,
        fullName: data.name || data.firstName,
        role: normalizedRole,
        organizationId: data.organizationId ?? null,
      };

      setUser(loggedInUser);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const hasPermission = (action: string, subject: string) => {
    if (!user) return false;
    return userHasPermission(getAllPermissions(user.role, user.organizationId), action, subject);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
