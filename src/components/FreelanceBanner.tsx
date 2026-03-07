'use client';

import React, { useState } from 'react';
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FreelanceApplicationModal } from "@/components/FreelanceApplicationModal";
import type { VibecoderProject, VibecoderProfile } from "@/types";

interface FreelanceBannerProps {
    verificationStatus: string;
    profile?: VibecoderProfile;
    projects: VibecoderProject[];
    onApplicationSubmitted?: () => void;
}

export function FreelanceBanner({ verificationStatus, profile, projects, onApplicationSubmitted }: FreelanceBannerProps) {
    const [isFreelanceModalOpen, setIsFreelanceModalOpen] = useState(false);

    if (!profile || (verificationStatus !== 'none' && verificationStatus !== 'pending')) {
        return null;
    }

    return (
        <>
            {verificationStatus === 'none' && (
                <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-primary/20 py-4">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-primary" />
                                Apply for Founding 100 Freelance
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">Submit hourly rate, capabilities and start getting verified inbounds.</p>
                        </div>
                        <Button onClick={() => setIsFreelanceModalOpen(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm rounded-full px-6">
                            Apply Now
                        </Button>
                    </div>
                </div>
            )}

            {verificationStatus === 'pending' && (
                <div className="w-full bg-muted/50 border-b border-border py-3">
                    <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <p className="text-sm font-medium text-muted-foreground">Your freelance verification application is currently pending review.</p>
                    </div>
                </div>
            )}

            {isFreelanceModalOpen && (
                <FreelanceApplicationModal
                    profile={profile}
                    projects={projects}
                    onClose={() => setIsFreelanceModalOpen(false)}
                    onSuccess={() => {
                        setIsFreelanceModalOpen(false);
                        if (onApplicationSubmitted) {
                            onApplicationSubmitted();
                        }
                    }}
                />
            )}
        </>
    );
}
