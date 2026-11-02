"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, User, Eye, EyeOff, Sparkles, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "/profile";

  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      router.push(returnTo);
    } else {
      setError(res.error || "Login failed.");
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    await login("XiLustVIP", "password123");
    setLoading(false);
    router.push(returnTo);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to XiLust</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/15 text-xl shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              👑
            </span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-white">Xi</span>
              <span className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                Lust
              </span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Sign In to Your VIP Account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/50">
            Access your comments history, bookmarks, and VIP player settings
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1017]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Instant Guest Sign In</span>
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080a0f] flex items-center justify-center text-white/50 text-sm">
          Loading sign in...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
