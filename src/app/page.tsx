"use client";

import { useEffect, useState } from "react";
import { Navbar, type Section } from "@/components/aethoplex/Navbar";
import { Hero } from "@/components/aethoplex/Hero";
import { HomeFeed } from "@/components/aethoplex/HomeFeed";
import { MyListView } from "@/components/aethoplex/MyListView";
import { MyListProvider } from "@/components/aethoplex/PosterCard";
import { Footer, LivePill } from "@/components/aethoplex/Chrome";

export default function Home() {
  const [showMyList, setShowMyList] = useState(false);
  // Synchronously initialize section from URL params or localStorage to avoid race conditions
  const [section, setSection] = useState<Section>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("section") as Section | null;
      if (s === "lust" || s === "jax") return s;
      try {
        const stored = localStorage.getItem("xilust_section") as Section | null;
        if (stored === "lust" || stored === "jax") return stored;
      } catch {}
    }
    return "lust";
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<{
    type: "category" | "actor" | "studio" | "tag";
    name: string;
  } | null>(null);

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

    if (s === "lust" || s === "jax") {
      setSection(s);
      try {
        localStorage.setItem("xilust_section", s);
      } catch {}
    }
    setQuery(q || "");

    if (actor) {
      setFilter({ type: "actor", name: actor });
    } else if (studio) {
      setFilter({ type: "studio", name: studio });
    } else if (category) {
      setFilter({ type: "category", name: category });
    } else if (tag) {
      setFilter({ type: "tag", name: tag });
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
    if (window.location.hash === "#mylist") {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setFilter(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("xilust_section", s);
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.set("section", s);
      url.searchParams.delete("actor");
      url.searchParams.delete("studio");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (q) {
        url.searchParams.set("q", q);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleFilterChange = (
    newFilter: { type: "category" | "actor" | "studio" | "tag"; name: string } | null
  ) => {
    setFilter(newFilter);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("actor");
      url.searchParams.delete("studio");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      if (newFilter) {
        url.searchParams.set(newFilter.type, newFilter.name);
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  return (
    <MyListProvider>
      <div className="flex min-h-screen flex-col bg-[#080a0f] text-[#f4f5f8] antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Navigation Bar */}
        <Navbar
          section={section}
          onSectionChange={handleSectionChange}
          query={query}
          onQueryChange={handleQueryChange}
        />

        {/* Main Content */}
        <main className="flex-1 pt-16 sm:pt-20">
          {showMyList ? (
            <MyListView onBrowse={handleBrowseFromList} />
          ) : (
            <>
              {!query && !filter && <Hero section={section} />}
              <HomeFeed
                section={section}
                query={query}
                filter={filter}
                onFilterChange={handleFilterChange}
              />
            </>
          )}
        </main>

        {/* Global Footer */}
        <Footer />
        <LivePill />
      </div>
    </MyListProvider>
  );
}
