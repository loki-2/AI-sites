'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { VibecoderProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";

export function VibecoderCard({ profile }: { profile: VibecoderProfile }) {
    const router = useRouter();
    const projects = profile.projects?.filter(p => p.tags.some(t => t.toLowerCase() === 'shipped')).slice(0, 2) || [];

    const handleCardClick = () => {
        router.push(`/profile/${profile.id}`);
    };

    const handleCtaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.social_url) {
            window.open(profile.social_url.startsWith('http') ? profile.social_url : `https://${profile.social_url}`, '_blank');
        } else {
            router.push(`/profile/${profile.id}`);
        }
    };

    return (
        <Card
            onClick={handleCardClick}
            className="cursor-pointer text-left rounded-lg border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group-hover:border-primary/50 bg-card flex flex-col h-full"
        >
            <CardContent className="p-6 sm:p-8 flex-grow flex flex-col">
                {/* Header: Avatar, Info, and CTA */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {profile.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-border/50" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-border">
                                <span className="font-bold text-sm text-primary">
                                    {profile.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <h3 className="font-extrabold text-2xl leading-tight hover:text-primary transition-colors group-hover:text-primary flex items-center gap-1.5">
                                {profile.name}
                                {profile.is_verified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
                            </h3>
                            {profile.availability && (
                                <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${profile.availability === 'Available for gigs' ? 'bg-green-500' :
                                        profile.availability === 'Not looking for gigs' ? 'bg-blue-500' :
                                            'bg-orange-500'
                                        }`} />
                                    {profile.availability}
                                </p>
                            )}
                            {profile.location && (
                                <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {profile.location}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Get In Touch CTA */}
                    <div className="shrink-0 hidden sm:flex items-center gap-3">
                        <Button
                            onClick={handleCtaClick}
                            variant="outline"
                        >
                            Get in touch
                        </Button>
                    </div>
                </div>

                {/* Mobile CTA (rendered below header on small screens) */}
                <div className="sm:hidden mb-6 flex flex-col gap-3">
                    <Button
                        onClick={handleCtaClick}
                        className="w-full rounded-full shadow-sm font-semibold"
                    >
                        Get in touch
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 sm:gap-8 mb-6">
                    <div className="flex flex-col items-start">
                        <span className="text-md font-bold">{profile.shipped_projects || 0}</span>
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Shipped</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-md font-bold">{profile.in_progress_projects || 0}</span>
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Half baked</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-md font-bold">{profile.experiment_projects || 0}</span>
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Experiments</span>
                    </div>
                </div>

                {/* Bio */}
                <div className="mb-6 flex-grow">
                    {profile.bio ? (
                        <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 leading-relaxed">
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="text-muted-foreground/50 text-sm sm:text-base italic">No bio provided</p>
                    )}
                </div>

                {/* Project Images Grid (Max 2) */}
                {projects.length > 0 && (
                    <div className={`grid gap-3 ${projects.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} mt-auto`}>
                        {projects.map(project => {
                            const image = project.images && project.images.length > 0 ? project.images[0] : null;

                            return (
                                <div key={project.id} className="relative aspect-video rounded-xs overflow-hidden bg-muted group/project border border-border/50">
                                    {image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={image} alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/project:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                                            <span className="text-primary/40 font-bold text-2xl">{project.name.charAt(0)}</span>
                                        </div>
                                    )}
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/project:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 text-center backdrop-blur-sm rounded-xs">
                                        <span className="text-white font-bold text-sm sm:text-base drop-shadow-md line-clamp-2">{project.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
