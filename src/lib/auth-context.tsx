"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string; // emoji or image url
  role: "member" | "vip" | "admin";
  joinedAt: string;
  bookmarksCount?: number;
  commentsCount?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, pass: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAvatar: (newAvatar: string) => void;
  updateUsername: (newName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "xilust_current_user";
const USERS_DB_KEY = "xilust_registered_users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.username) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load user session:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrUser: string, pass: string) => {
    const cleanId = emailOrUser.trim().toLowerCase();
    if (!cleanId || !pass) {
      return { success: false, error: "Please enter your username/email and password." };
    }

    try {
      // 1. Check registered users in storage
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Array<User & { pass: string }> = usersRaw ? JSON.parse(usersRaw) : [];

      const found = users.find(
        (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
      );

      if (found) {
        if (found.pass !== pass) {
          return { success: false, error: "Incorrect password. Please try again." };
        }
        const sessionUser: User = {
          id: found.id,
          username: found.username,
          email: found.email,
          avatar: found.avatar || "👑",
          role: found.role || "vip",
          joinedAt: found.joinedAt || new Date().toISOString(),
        };
        setUser(sessionUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
        return { success: true };
      }

      // 2. Demo / Instant Login fallback if account doesn't exist
      const newUser: User = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        username: emailOrUser.includes("@") ? emailOrUser.split("@")[0] : emailOrUser,
        email: emailOrUser.includes("@") ? emailOrUser : `${emailOrUser}@xilust.vip`,
        avatar: "💋",
        role: "vip",
        joinedAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      // Save to registered users list
      users.push({ ...newUser, pass });
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed." };
    }
  };

  const signup = async (username: string, email: string, pass: string, avatar: string = "💋") => {
    const cleanName = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: "Username must be at least 3 characters." };
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!pass || pass.length < 4) {
      return { success: false, error: "Password must be at least 4 characters." };
    }

    try {
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Array<User & { pass: string }> = usersRaw ? JSON.parse(usersRaw) : [];

      if (users.some((u) => u.username.toLowerCase() === cleanName.toLowerCase())) {
        return { success: false, error: "Username is already taken." };
      }
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: "An account with this email already exists." };
      }

      const newUser: User = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        username: cleanName,
        email: cleanEmail,
        avatar: avatar || "💋",
        role: "vip",
        joinedAt: new Date().toISOString(),
      };

      users.push({ ...newUser, pass });
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  const updateAvatar = (newAvatar: string) => {
    if (!user) return;
    const updated = { ...user, avatar: newAvatar };
    setUser(updated);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      if (usersRaw) {
        const users: any[] = JSON.parse(usersRaw);
        const idx = users.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          users[idx].avatar = newAvatar;
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        }
      }
    } catch {}
  };

  const updateUsername = (newName: string) => {
    if (!user || !newName.trim()) return;
    const updated = { ...user, username: newName.trim() };
    setUser(updated);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateAvatar, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

