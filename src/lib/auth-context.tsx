"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
    // 1. If Supabase is configured, listen to real Supabase Auth session
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
        const session = data?.session;
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const sUser: User = {
            id: session.user.id,
            username: meta.username || session.user.email?.split("@")[0] || "VIP",
            email: session.user.email || "",
            avatar: meta.avatar || "💋",
            role: "vip",
            joinedAt: session.user.created_at || new Date().toISOString(),
          };
          setUser(sUser);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sUser));
          } catch {}
        }
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const sUser: User = {
            id: session.user.id,
            username: meta.username || session.user.email?.split("@")[0] || "VIP",
            email: session.user.email || "",
            avatar: meta.avatar || "💋",
            role: "vip",
            joinedAt: session.user.created_at || new Date().toISOString(),
          };
          setUser(sUser);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sUser));
          } catch {}
        } else {
          setUser(null);
          try {
            localStorage.removeItem(USER_STORAGE_KEY);
          } catch {}
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }

    // 2. Fallback to local session if Supabase is not yet configured
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

    // A. Use Real Supabase Auth if available
    if (isSupabaseConfigured && supabase) {
      try {
        const emailToUse = cleanId.includes("@") ? cleanId : `${cleanId}@xilust.vip`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: pass,
        });

        if (error) {
          // If error is invalid credentials, try local fallback or return error
          if (cleanId === "xilustvip" && pass === "password123") {
            // Instant demo guest login
            const demoUser: User = {
              id: "usr_guest_" + Math.random().toString(36).substring(2, 7),
              username: "XiLustVIP",
              email: "guest@xilust.vip",
              avatar: "👑",
              role: "vip",
              joinedAt: new Date().toISOString(),
            };
            setUser(demoUser);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
            return { success: true };
          }
          return { success: false, error: error.message };
        }

        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const sUser: User = {
            id: data.user.id,
            username: meta.username || data.user.email?.split("@")[0] || cleanId,
            email: data.user.email || cleanId,
            avatar: meta.avatar || "💋",
            role: "vip",
            joinedAt: data.user.created_at || new Date().toISOString(),
          };
          setUser(sUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sUser));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || "Supabase authentication failed." };
      }
    }

    // B. Local fallback
    try {
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

      // Guest / Instant demo login
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
    if (!pass || pass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters (Supabase standard)." };
    }

    // A. Use Real Supabase Auth if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              username: cleanName,
              avatar: avatar || "💋",
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.user) {
          const sUser: User = {
            id: data.user.id,
            username: cleanName,
            email: cleanEmail,
            avatar: avatar || "💋",
            role: "vip",
            joinedAt: data.user.created_at || new Date().toISOString(),
          };
          setUser(sUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sUser));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || "Supabase registration failed." };
      }
    }

    // B. Local fallback
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

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!user) return;
    const updated = { ...user, avatar: newAvatar };
    setUser(updated);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { avatar: newAvatar },
        });
      } catch {}
    }
  };

  const updateUsername = async (newName: string) => {
    if (!user || !newName.trim()) return;
    const updated = { ...user, username: newName.trim() };
    setUser(updated);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { username: newName.trim() },
        });
      } catch {}
    }
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

