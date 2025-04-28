
'use client';
import { FeatureSection } from "@/components/main/FeatureSection";
import { HeroSection } from "@/components/main/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeatureSection />
    </div>
  );
}

