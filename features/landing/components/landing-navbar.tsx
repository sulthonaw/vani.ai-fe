"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/libs/utils";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#pilot", label: "Pilot" },
];

export function LandingNavbar() {
  // Glass over the dark hero; solid white once the page scrolls past it.
  const [solid, setSolid] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300",
        solid ? "border-[#E8EBF1] bg-white/90" : "border-white/15 bg-white/10 shadow-[0_8px_32px_rgba(6,18,36,0.25)]",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="vani.ai home" className="flex items-center">
          <Image
            src="/images/vani-logo.png"
            alt="vani ai"
            width={427}
            height={91}
            priority
            className={cn("h-7 w-auto transition", !solid && "brightness-0 invert")}
          />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  solid ? "text-[#556A8B] hover:bg-[#F1F3F7] hover:text-[#061224]" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/sulthonaw/vani.ai-fe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg border transition",
              solid
                ? "border-[#E8EBF1] bg-white text-[#081832] hover:bg-[#F1F3F7]"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>
          <Link
            href="/dashboard"
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition",
              solid ? "bg-[#081832] text-white hover:bg-[#1F3050]" : "bg-white text-[#081832] hover:bg-white/90",
            )}
          >
            Dashboard
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
