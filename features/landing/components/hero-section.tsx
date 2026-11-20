import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BrowserFrame, DashboardMock } from "./landing-mocks";

export function HeroSection() {
  return (
    <section className="relative isolate w-full overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* Background: hospital lobby illustration with the navy gradient */}
      <div className="absolute inset-0 -z-20">
        <Image src="/images/hospital-comic-lobby.png" alt="" fill priority sizes="100vw" className="object-cover object-top" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#081832]/70 via-[#081832]/85 to-[#061224]" aria-hidden="true" />
      {/* Fade into the white page under the product shot */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <a
          href="#how"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pr-3 pl-1 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
        >
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#081832]">Challenge 05</span>
          Closing the screening-to-care loop
          <ArrowRight className="size-3.5" />
        </a>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">
          Every abnormal result gets an owner.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          vani.ai follows each abnormal screening result until care is done. Vani reminds patients and family on WhatsApp, asks why a visit was missed, helps with the barrier, and hands over to staff when a person is needed.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#081832] shadow-sm transition hover:bg-white/90"
          >
            Open live demo
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a href="#how" className="inline-flex items-center rounded-lg border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            See how it works
          </a>
        </div>
        <p className="mt-4 text-xs text-white/50">No login needed. All demo data is synthetic.</p>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <BrowserFrame url="vani.ai/dashboard">
            <DashboardMock />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
