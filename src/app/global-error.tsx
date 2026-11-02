"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("XiLust Global Crash caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080a0f] text-[#f4f5f8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1017] p-6 sm:p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
            ⚠️
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Connection Reconnecting
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed">
            XiLust encountered a temporary network sync issue. Click below to re-establish the connection.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110"
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/";
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
