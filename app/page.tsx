import {
  CompareSection,
  EvidenceSection,
  FeatureSections,
  FinalCta,
  GapSection,
  HeroSection,
  HowSection,
  LandingFooter,
  LandingNavbar,
  LandingSmoothScroll,
  PilotSection,
  SafetySection,
  TeamSection,
} from "@/features/landing";

export default function HomePage() {
  return (
    <main lang="en" className="min-h-screen w-full bg-white text-[#061224]">
      <LandingSmoothScroll />
      <LandingNavbar />
      <HeroSection />
      <GapSection />
      <FeatureSections />
      <HowSection />
      <TeamSection />
      <SafetySection />
      <EvidenceSection />
      <PilotSection />
      <CompareSection />
      <FinalCta />
      <LandingFooter />
    </main>
  );
}
