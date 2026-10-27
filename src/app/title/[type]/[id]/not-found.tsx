import Link from "next/link";
import { site } from "@/lib/catalog";

export default function TitleNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Lost signal</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
        This title drifted off-grid
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/60">
        We couldn&apos;t find the {site.name} page you were looking for. It may have been removed
        from the catalogue, or the link is out of date.
      </p>
      <Link
        href="/"
        className="cta-gradient focusable mt-8 flex h-11 items-center rounded-xl px-6 text-[14px] font-semibold transition"
      >
        Back to {site.name}
      </Link>
    </div>
  );
}
