'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateProfileButton } from "@/components/CreateProfileButton";
import Link from "next/link";
import { ActiveVibecodersSection } from "@/components/ActiveVibecodersSection";
import { AllProjectsSection } from "@/components/AllProjectsSection";
import { cn } from "@/lib/utils";

export function HireTab({ tabs }: { tabs?: React.ReactNode }) {
    const [view, setView] = useState<'coders' | 'projects'>('coders');

    return (
        <div className="flex flex-col items-center justify-center text-center w-full">
            {/* Top Section Depth Container: Nav Tabs + Hero */}
            <div className="w-full bg-[#161616] pb-16 pt-8 shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.1)] border-b border-border/40">
                <div className="w-full max-w-7xl mx-auto px-4">
                    {tabs && <div className="mb-12">{tabs}</div>}

                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-medium mb-2 pb-3 bg-gradient-to-br from-primary via-primary/80 to-muted-foreground bg-clip-text text-transparent leading-tight">
                            Monetize Your <br /> Vibe Coding Skills
                        </h1>
                        <p className="text-xl text-muted-foreground mb-10 leading-relaxed tracking-medium max-w-xl mx-auto">
                            A new place to showcase your projects, <br /> get seen and hired for gigs.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
                            <div className="flex flex-col items-center gap-3">
                                <CreateProfileButton size="lg" className="rounded-lg text-base font-semibold px-8 h-14 shadow-xl hover:-translate-y-1 transition-transform bg-primary">
                                    Create Portfolio
                                </CreateProfileButton>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">If you are vibe coder</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto mt-10">
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-muted/50 p-1.5 rounded-full items-center shrink-0 border border-border/50 shadow-sm">
                        <button
                            onClick={() => setView('coders')}
                            className={cn(
                                "px-6 py-2 md:py-2.5 text-sm md:text-base font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
                                view === 'coders'
                                    ? "bg-background text-foreground shadow-md ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            Active Vibecoders
                        </button>
                        <button
                            onClick={() => setView('projects')}
                            className={cn(
                                "px-6 py-2 md:py-2.5 text-sm md:text-base font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
                                view === 'projects'
                                    ? "bg-background text-foreground shadow-md ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            Projects
                        </button>
                    </div>
                </div>
                {view === 'coders' ? <ActiveVibecodersSection /> : <AllProjectsSection />}
            </div>
        </div>
    );
}
