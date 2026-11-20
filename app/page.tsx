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
  PilotSection,
  SafetySection,
  TeamSection,
} from "@/features/landing";

export default function HomePage() {
  return (
    <main lang="en" className="min-h-screen w-full bg-white text-[#061224]">
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
