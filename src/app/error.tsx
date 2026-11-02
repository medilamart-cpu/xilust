"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostics
    console.error("XiLust Runtime Error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f4f5f8] flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1017] p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Signal Interrupted
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed">
          The video feed encountered a temporary glitch while loading. You can refresh the stream or return to the home catalog.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Stream</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Catalog Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

