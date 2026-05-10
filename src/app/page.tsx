'use client';

import React from "react";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { ActiveVibecodersSection } from "@/components/ActiveVibecodersSection";
import { CreateProfileButton } from "@/components/CreateProfileButton";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export default function HomePage() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero */}
      <div className="w-full bg-gradient-to-b from-[#121212] to-[#506b81] pb-16 pt-16 shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.1)] border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1
            className={cn(
              "text-6xl md:text-8xl tracking-tight mb-4 pb-3 bg-gray-200 bg-clip-text text-transparent leading-tight",
              instrumentSerif.className
            )}
          >
            Build your Product 10x Faster With AI-Native Builders
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-xl mx-auto mb-10">
            Browse portfolios and hire project-ready builders who ship real,
            working products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
            <CreateProfileButton size="lg" className="rounded-lg text-base font-semibold px-8 h-14 shadow-xl">
              Build Your Portfolio
            </CreateProfileButton>
          </div>
        </div>
      </div>

      {/* Vibecoders Grid */}
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 tracking-tight">Active Vibecoders</h2>
        <ActiveVibecodersSection />
      </div>
    </div>
  );
}
