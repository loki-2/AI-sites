'use client';

import React, { useEffect, useState, use } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProfile, VibecoderProject } from "@/types";
import { ProjectCard } from "@/components/ProjectCard";
import { GithubActivityWidget } from "@/components/GithubActivityWidget";
import { BADGE_EMOJIS } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [profile, setProfile] = useState<VibecoderProfile | null>(null);
    const [projects, setProjects] = useState<VibecoderProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        async function fetchProfile() {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('vibecoder_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError || !profileData) {
                setError(true);
                setLoading(false);
                return;
            }

            // 2. Fetch Projects
            const { data: projectsData } = await supabase
                .from('vibecoder_projects')
                .select('*')
                .eq('profile_id', id)
                .order('created_at', { ascending: false });

            let loadedProjects: VibecoderProject[] = [];
            if (projectsData) {
                loadedProjects = projectsData as VibecoderProject[];
                setProjects(loadedProjects);
            }

            const shipped = loadedProjects.filter(p => p.tags.includes('shipped') || p.tags.includes('Shipped')).length;
            const inProgress = loadedProjects.filter(p => p.tags.includes('in progress') || p.tags.includes('In Progress')).length;
            const experiments = loadedProjects.filter(p => p.tags.includes('experiment') || p.tags.includes('Experiment')).length;

            setProfile({
                ...(profileData as VibecoderProfile),
                total_projects: loadedProjects.length,
                shipped_projects: shipped,
                in_progress_projects: inProgress,
                experiment_projects: experiments
            });

            setLoading(false);
        }

        fetchProfile();
    }, [id, supabase]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-muted-foreground">The vibecoder you are looking for doesn&apos;t exist.</p>
                <Link href="/" className="inline-block mt-8 text-primary hover:underline font-semibold">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Sidebar: User Details */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Profile Header */}
                    <div className="flex flex-col gap-6">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-32 h-32 rounded-full border-2 border-border object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-border">
                                <span className="font-bold text-5xl text-primary">
                                    {(profile?.name ?? "?").charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-extrabold tracking-tight">{profile?.name}</h1>
                            </div>
                            {profile?.location && (
                                <p className="text-muted-foreground flex items-center gap-2 text-sm mb-4">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {profile.location}
                                </p>
                            )}

                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                                {profile.bio}
                            </p>

                            {profile?.build_tags && profile.build_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {profile.build_tags.map(tag => (
                                        <span key={tag} className="px-2.5 py-1 bg-muted/50 border border-border/50 text-muted-foreground rounded-md text-xs font-semibold tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {profile?.social_url && (
                                <div className="mt-6">
                                    <a
                                        href={profile.social_url.startsWith('http') ? profile.social_url : `https://${profile.social_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        Get in touch
                                        {/* <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg> */}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Stats Summary */}
                        <div className="flex flex-col items-left gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-md border border-border">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <div><span className="text-primary">{profile?.shipped_projects || 0}</span> Shipped</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-md border border-border">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <div><span className="text-primary">{profile?.in_progress_projects || 0}</span> In Progress</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-md border border-border">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </span>
                                <div><span className="text-primary">{profile?.experiment_projects || 0}</span> Experiments</div>
                            </div>
                        </div>

                        {profile?.badges && profile.badges.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-border/50">
                                <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground pt-4 mb-2">Expertise</Label>
                                <div className="flex flex-wrap gap-2">
                                    {profile.badges.map(badge => (
                                        <div key={badge.name} className="flex items-center gap-1.5 bg-muted/50 border border-border px-3 py-1.5 rounded-md shadow-sm">
                                            <span className="text-sm">{BADGE_EMOJIS[badge.name] || "✨"}</span>
                                            <span className="text-sm font-medium text-foreground">{badge.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize border-l border-border/50 pl-1.5 ml-1">{badge.level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Projects */}
                <div className="lg:col-span-9">
                    <div className="flex items-center justify-between mb-8 pb-3">
                        <div className="flex gap-6 text-sm font-medium">
                            <button className="text-foreground border-b-2 border-foreground pb-3">Projects</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-muted/20 border border-dashed border-border/60 rounded-3xl">
                                <p className="text-xl font-bold text-muted-foreground">No projects to show</p>
                            </div>
                        ) : (
                            projects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        )}
                    </div>

                    {/* GitHub Activity Integration */}
                    {profile?.github_username && (
                        <div className="pt-6 border-t border-border/40 mt-10">
                            <GithubActivityWidget
                                isOwner={false}
                                username={profile.github_username}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
