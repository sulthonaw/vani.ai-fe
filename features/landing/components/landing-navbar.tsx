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
      </nav>
    </header>
  );
}
