import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role, rolePermissions } from "../types/auth";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (action: string, subject: string) => boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  permissions: string[];
}

interface LoginResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
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
      const errorData = await response.json();
      throw new Error(errorData.ErrorMessage || "Login failed");
    }

    const data: LoginResponse = await response.json();

    // Ensure valid role mapping
    const validRole = Object.keys(rolePermissions).find(
      (r) => r.toLowerCase() === data.role.toLowerCase()
    );

    if (!validRole) {
      throw new Error(`Invalid role received from server: ${data.role}`);
    }

    if (!data.redirectToResetPassword) {
      const loggedInUser: User = {
        id: data.id,
        email: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role: validRole as Role,
      };

      setUser(loggedInUser);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const hasPermission = (action: string, subject: string) => {
    if (!user) return false;

    // Ensure role exists in rolePermissions
    const userPermissions = rolePermissions[user.role];
    if (!userPermissions) {
      console.error(`No permissions defined for role: ${user.role}`);
      return false;
    }

    return userPermissions.some(
      (permission) =>
        (permission.action === "manage" && permission.subject === "all") ||
        (permission.action === action && permission.subject === subject) ||
        (permission.action === "manage" && permission.subject === subject)
    );
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
