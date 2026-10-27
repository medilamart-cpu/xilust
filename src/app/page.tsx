"use client";

import { useEffect, useState } from "react";
import { Navbar, type Section } from "@/components/aethoplex/Navbar";
import { Hero } from "@/components/aethoplex/Hero";
import { HomeFeed } from "@/components/aethoplex/HomeFeed";
import { MyListProvider } from "@/components/aethoplex/PosterCard";
import { Footer, LivePill } from "@/components/aethoplex/Chrome";

export default function Home() {
  const [section, setSection] = useState<Section>("lust");
  const [query, setQuery] = useState("");

  // Restore section and query from URL query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("section") as Section | null;
    const q = sp.get("q") || sp.get("query");
    if (s === "lust" || s === "jax") setSection(s);
    if (q) setQuery(q);
  }, []);

  const handleSectionChange = (s: Section) => {
    setSection(s);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("section", s);
      window.history.replaceState({}, "", url.toString());
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
        <main className="flex-1 pt-20">
          {!query && <Hero section={section} />}
          <HomeFeed section={section} query={query} />
        </main>

        {/* Global Footer */}
        <Footer onNavigate={() => {}} />
        <LivePill />
      </div>
    </MyListProvider>
  );
}
