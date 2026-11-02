"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, User, Mail, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const AVATAR_OPTIONS = ["💋", "👑", "⚡", "🌸", "🔥", "💎", "🐉", "🦊", "⭐", "🖤"];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || "/profile";

  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("💋");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await signup(username, email, password, selectedAvatar);
    setLoading(false);

    if (res.success) {
      router.push(returnTo);
    } else {
      setError(res.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-1/2 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-white/15 text-xl shadow-[0_0_25px_rgba(244,114,182,0.3)]">
              💋
            </span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-white">Xi</span>
              <span className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                Lust
              </span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Join the XiLust VIP Club
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/50">
            Create an account to join discussions and personalize your experience
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1017]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">
                Choose Your VIP Avatar Badge
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${
                      selectedAvatar === av
                        ? "bg-pink-500/30 border border-pink-400 scale-110 shadow-lg shadow-pink-500/30"
                        : "bg-white/5 hover:bg-white/10 text-white/70"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. MasterGoku"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400/40"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-white/50">
            Already have an account?{" "}
            <Link
              href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080a0f] flex items-center justify-center text-white/50 text-sm">
          Loading sign up...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
