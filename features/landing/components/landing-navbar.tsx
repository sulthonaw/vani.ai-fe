import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-white/10 shadow-[0_8px_32px_rgba(6,18,36,0.25)] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="vani.ai home" className="flex items-center">
          {/* Repo logo, rendered white on the dark hero */}
          <Image src="/images/vani-logo.png" alt="vani ai" width={427} height={91} priority className="h-7 w-auto brightness-0 invert" />
        </Link>
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#081832] shadow-sm transition hover:bg-white/90"
        >
          Dashboard
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </nav>
    </header>
  );
}
