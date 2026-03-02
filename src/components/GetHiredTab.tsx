'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { CreateProfileButton } from "@/components/CreateProfileButton";
import Link from "next/link";
import { ActiveVibecodersSection } from "@/components/ActiveVibecodersSection";

export function GetHiredTab({ tabs }: { tabs?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center text-center w-full">
            {/* Top Section Depth Container: Nav Tabs + Hero */}
            <div className="w-full bg-muted/20 pb-16 pt-8 shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.1)] border-b border-border/40">
                <div className="w-full max-w-7xl mx-auto px-4">
                    {tabs && <div className="mb-12">{tabs}</div>}

                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-medium mb-2 pb-3 bg-gradient-to-br from-primary via-primary/80 to-muted-foreground bg-clip-text text-transparent leading-tight">
                            Ship Faster With AI-Native Builders
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
                            Browse portfolios, and hire project-ready builders who ship real, working products.                     </p>

                        <div className="flex justify-center mt-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
                                <div className="flex flex-col items-center gap-3">
                                    <Button size="lg" variant="outline" disabled className="rounded-lg text-base font-semibold px-8 h-14 shadow-xl opacity-80 cursor-not-allowed bg-background">
                                        Post a Gig
                                    </Button>
                                    <span className="text-xs font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">Coming soon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <ActiveVibecodersSection /> */}
        </div>
    );
}
