"use client";

import { useEffect, useState } from "react";
import { Navbar, type Section } from "@/components/aethoplex/Navbar";
import { CinemaSidebar } from "@/components/aethoplex/CinemaSidebar";
import { Hero } from "@/components/aethoplex/Hero";
import { HomeFeed } from "@/components/aethoplex/HomeFeed";
import { MyListView } from "@/components/aethoplex/MyListView";
import { MyListProvider } from "@/components/aethoplex/PosterCard";
import { Footer } from "@/components/aethoplex/Chrome";
import { AdminModal } from "@/components/aethoplex/AdminModal";

export default function Home() {
  const [showMyList, setShowMyList] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("xilust_sidebar_collapsed");
        if (stored !== null) return stored === "true";
      } catch {}
    }
    return true; // Default to slim 64px icon rail for maximum video breathing room
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("xilust_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Synchronously initialize section from URL params or localStorage to avoid race conditions
  const [section, setSection] = useState<Section>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("section") as Section | null;
      if (s === "lust" || s === "jax" || s === "fans") return s;
      try {
        const stored = localStorage.getItem("xilust_section") as Section | null;
        if (stored === "lust" || stored === "jax" || stored === "fans") return stored;
      } catch {}
    }
    return "lust";
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<{
    type: "category" | "actor" | "studio" | "tag" | "code" | "premium";
    name: string;
  } | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("section") as Section | null;
      const premium = sp.get("premium") === "1";
      const actor = sp.get("actor");
      const studio = sp.get("studio");
      const category = sp.get("category");
      const tag = sp.get("tag");
      const code = sp.get("code");
      if (premium && (s === "lust" || !s)) return { type: "premium", name: "Premium Studios" };
      if (actor) return { type: "actor", name: actor };
      if (studio) return { type: "studio", name: studio };
      if (category) return { type: "category", name: category };
      if (tag) return { type: "tag", name: tag };
      if (code) return { type: "code", name: code.toUpperCase() };
    }
    return null;
  });

  // Restore section, query, actor, studio, category from URL query params on navigation
  const syncFromUrl = () => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("section") as Section | null;
    const q = sp.get("q") || sp.get("query");
    const actor = sp.get("actor");
    const studio = sp.get("studio");
    const category = sp.get("category");
    const tag = sp.get("tag");
    const code = sp.get("code");
    const premium = sp.get("premium") === "1";

    if (s === "lust" || s === "jax" || s === "fans") {
      setSection(s);
      try {
        localStorage.setItem("xilust_section", s);
      } catch {}
    }
    setQuery(q || "");

    const activeSec = s || "lust";
    if (premium && activeSec === "lust") {
      setFilter({ type: "premium", name: "Premium Studios" });
    } else if (actor) {
      setFilter({ type: "actor", name: actor });
    } else if (studio) {
      setFilter({ type: "studio", name: studio });
    } else if (category) {
      setFilter({ type: "category", name: category });
    } else if (tag) {
      setFilter({ type: "tag", name: tag });
    } else if (code) {
      setFilter({ type: "code", name: code.toUpperCase() });
    } else {
      setFilter(null);
    }
  };

  useEffect(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    const syncHash = () => setShowMyList(window.location.hash === "#mylist");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const handleBrowseFromList = () => {
    setShowMyList(false);
    if (typeof window !== "undefined") {
      if (window.location.hash === "#mylist") {
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    setShowMyList(false);
    setQuery("");
    setFilter(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.set("section", section);
      url.searchParams.delete("q");
      url.searchParams.delete("query");
      url.searchParams.delete("actor");
      url.searchParams.delete("studio");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      url.searchParams.delete("code");
      url.searchParams.delete("premium");
      url.searchParams.delete("page");
      window.history.pushState({}, "", url.toString().replace(/#.*$/, ""));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSectionChange = (s: Section) => {
    setShowMyList(false);
    setSection(s);
    setQuery("");
    setFilter(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("xilust_section", s);
      } catch {}
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.set("section", s);
      url.searchParams.delete("q");
      url.searchParams.delete("query");
      url.searchParams.delete("actor");
      url.searchParams.delete("studio");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      url.searchParams.delete("code");
      url.searchParams.delete("premium");
      url.searchParams.delete("page");
      try {
        sessionStorage.removeItem("xilust_page_" + s);
        sessionStorage.removeItem("xilust_scroll_" + s);
      } catch {}
      window.history.pushState({}, "", url.toString().replace(/#.*$/, ""));
    }
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (q && filter?.type === "code") {
        setFilter(null);
        url.searchParams.delete("code");
      }
      if (q) {
        url.searchParams.set("q", q);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleFilterChange = (
    newFilter: { type: "category" | "actor" | "studio" | "tag" | "code" | "premium"; name: string } | null
  ) => {
    setFilter(newFilter);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("actor");
      url.searchParams.delete("studio");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      url.searchParams.delete("code");
      url.searchParams.delete("premium");
      if (newFilter) {
        if (newFilter.type === "premium") {
          url.searchParams.set("section", "lust");
          url.searchParams.set("premium", "1");
        } else {
          url.searchParams.set(newFilter.type, newFilter.name);
        }
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  return (
    <MyListProvider>
      <div className="flex min-h-screen flex-col bg-[#080a0f] text-[#f4f5f8] antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Accessible Skip to Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-20 focus:z-50 focus:rounded-lg focus:bg-rose-600 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white focus:shadow-2xl"
        >
          Skip to main content
        </a>

        {/* Minimalist Cinema Navigation Sidebar (Desktop Rail & Mobile Drawer) */}
        <CinemaSidebar
          section={section}
          onSectionChange={handleSectionChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onSelectStudio={(studioName) => handleFilterChange({ type: "studio", name: studioName })}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onGoHome={handleGoHome}
        />

        {/* Navigation Bar */}
        <Navbar
          section={section}
          onSectionChange={handleSectionChange}
          query={query}
          onQueryChange={handleQueryChange}
          sidebarCollapsed={sidebarCollapsed}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onGoHome={handleGoHome}
        />

        {/* Main Content with Dynamic Padding Coordination */}
        <main
          id="main-content"
          className={`flex-1 pt-16 sm:pt-20 transition-all duration-300 ${
            sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
          }`}
        >
          {showMyList ? (
            <MyListView
              onBrowse={handleBrowseFromList}
              section={section}
              onSectionChange={handleSectionChange}
            />
          ) : (
            <>
              {!query && !filter && <Hero section={section} />}
              <HomeFeed
                section={section}
                query={query}
                filter={filter}
                onFilterChange={handleFilterChange}
                onQueryChange={handleQueryChange}
                onSectionChange={handleSectionChange}
              />
            </>
          )}
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Secret Admin Panel Trigger & Modal (Positioned clear of 64px left rail) */}
        <div className="fixed bottom-3 left-20 z-40 opacity-25 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowAdminModal(true)}
            title="Admin & Premium Studios"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 hover:text-amber-300 hover:border-amber-400/40"
          >
            ⚙
          </button>
        </div>

        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSelectStudio={(studio) => {
            setSection("lust");
            handleFilterChange({ type: "studio", name: studio });
          }}
        />
      </div>
    </MyListProvider>
  );
}
