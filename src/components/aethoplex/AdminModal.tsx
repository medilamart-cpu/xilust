"use client";

import { useState, useEffect } from "react";
import { Lock, Sparkles, Shield, Check, X, Film } from "lucide-react";
import { PREMIUM_LUST_STUDIOS } from "@/lib/premium-studios";

const ADMIN_PASSKEY = "admin888"; // standard admin key for XiLust management

export function AdminModal({
  isOpen,
  onClose,
  onSelectStudio,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudio: (studio: string) => void;
}) {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("xilust_admin_authed");
      if (stored === "true") setAuthed(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput.trim() === ADMIN_PASSKEY) {
      setAuthed(true);
      setError(false);
      localStorage.setItem("xilust_admin_authed", "true");
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    localStorage.removeItem("xilust_admin_authed");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1017] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Administrator Access</h2>
            <p className="text-xs text-white/50">Manage Curated & Premium Studios</p>
          </div>
        </div>

        {!authed ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Admin Passkey
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Enter admin passkey..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
              {error && <p className="mt-1.5 text-xs text-rose-400">Incorrect passkey.</p>}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-500/20 hover:brightness-110"
            >
              Authenticate
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Authorized Admin
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-white/40 hover:text-white/80"
              >
                Sign out
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Curated Premium Studios (Lust)
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {PREMIUM_LUST_STUDIOS.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onSelectStudio(st);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-left text-xs font-medium text-white/90 hover:border-amber-400/50 hover:bg-amber-400/10 transition-all"
                  >
                    <Film className="h-3 w-3 text-amber-300 shrink-0" />
                    <span className="truncate">{st}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/?section=lust&premium=1"
                onClick={onClose}
                className="block text-center w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110"
              >
                View Complete Premium Collection
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

