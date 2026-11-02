"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  section: "lust" | "jax" | "fans";
  label?: string;
  fallbackHref?: string;
  className?: string;
}

export function BackButton({ section, label, fallbackHref, className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // 1. If previous page was on our site, browser history back keeps exact page & scroll position
    if (typeof window !== "undefined") {
      const hasHistory = window.history.length > 1;
      const sameOrigin = document.referrer && document.referrer.startsWith(window.location.origin);
      if (hasHistory && sameOrigin) {
        window.history.back();
        return;
      }

      // 2. Fallback: navigate using the preserved page number from session
      let targetHref = fallbackHref || `/?section=${section}`;
      try {
        const savedPage = sessionStorage.getItem(`xilust_page_${section}`);
        if (savedPage && savedPage !== "1" && !targetHref.includes("page=")) {
          targetHref += `${targetHref.includes("?") ? "&" : "?"}page=${encodeURIComponent(savedPage)}`;
        }
      } catch {}

      router.push(targetHref);
    }
  };

  const sectionName = section === "jax" ? "🌸 Jax" : section === "fans" ? "⭐ Fans" : "🔥 Lust";
  const displayLabel = label || `Back to ${sectionName}`;

  return (
    <button
      type="button"
      onClick={handleBack}
      className={
        className ||
        "flex items-center gap-1.5 sm:gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95"
      }
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{displayLabel}</span>
    </button>
  );
}

