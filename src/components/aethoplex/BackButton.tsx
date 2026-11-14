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
    // 1. If previous page was on our site, browser history back keeps exact tab, page & scroll position
    if (typeof window !== "undefined") {
      const hasInternal =
        sessionStorage.getItem("xilust_has_history") === "1" ||
        (document.referrer && document.referrer.startsWith(window.location.origin));
      const hasHistory = window.history.length > 1;

      if (hasHistory && (hasInternal || sessionStorage.getItem("xilust_last_feed_url"))) {
        window.history.back();
        return;
      }

      // 2. Direct return URL fallback
      const returnUrl = sessionStorage.getItem("xilust_last_feed_url");
      if (returnUrl && returnUrl.startsWith("/")) {
        router.push(returnUrl);
        return;
      }

      // 3. Fallback: navigate using the preserved tab and page number from session
      let targetHref = fallbackHref || `/?section=${section}`;
      try {
        const savedTab = sessionStorage.getItem(`xilust_tab_${section}`);
        const savedPage = sessionStorage.getItem(`xilust_page_${section}`);
        const params = new URLSearchParams();
        params.set("section", section);
        if (savedTab && savedTab !== "new") {
          params.set("tab", savedTab);
        }
        if (savedPage && savedPage !== "1") {
          params.set("page", savedPage);
        }
        targetHref = `/?${params.toString()}`;
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

