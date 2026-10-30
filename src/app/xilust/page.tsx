import Link from "next/link";
import { ArrowUpRight, Flame, Flower2, Star } from "lucide-react";

const destinations = [
  {
    name: "Lust",
    description: "Browse Western releases, studios, performers, and categories.",
    href: "/?section=lust",
    icon: Flame,
    tone: "from-purple-500/20 to-pink-500/10 border-pink-300/20 text-pink-200",
  },
  {
    name: "Jax",
    description: "Explore Japanese releases, actresses, studios, and formats.",
    href: "/?section=jax",
    icon: Flower2,
    tone: "from-rose-500/20 to-orange-500/10 border-rose-300/20 text-rose-200",
  },
  {
    name: "Fans",
    description: "Open creator releases and fan content.",
    href: "/?section=fans",
    icon: Star,
    tone: "from-cyan-500/20 to-blue-500/10 border-cyan-300/20 text-cyan-200",
  },
];

export default function XilustHomePage() {
  return (
    <main className="flex min-h-screen items-center bg-[#080a0f] px-4 py-12 text-[#f4f5f8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1>
          <Link href="/xilust" className="inline-flex items-center gap-2 text-xl font-black tracking-wide text-white sm:text-2xl">
            Xi<span className="bg-gradient-to-r from-pink-400 to-cyan-300 bg-clip-text text-transparent">Lust</span>
          </Link>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
          Choose a collection to browse its own releases, filters, and performers.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(({ name, description, href, icon: Icon, tone }) => (
            <Link
              key={name}
              href={href}
              className={`group flex min-h-44 flex-col justify-between rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-1 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowUpRight className="h-4 w-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
