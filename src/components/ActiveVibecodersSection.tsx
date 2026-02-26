'use client';

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProfile, VibecoderProject } from "@/types";
import { VibecoderCard } from "@/components/VibecoderCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export function ActiveVibecodersSection() {
    const [profiles, setProfiles] = useState<VibecoderProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();
    const router = useRouter();

    const handleCreateProfileClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            router.push('/profile');
        } else {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
        }
    };

    useEffect(() => {
        async function fetchActiveVibecoders() {
            // Fetch users who have at least 1 project, along with their projects
            const { data, error } = await supabase
                .from('vibecoder_profiles')
                .select('*, vibecoder_projects(*)')
                .gt('total_projects', 0)
                .order('total_projects', { ascending: false });

            if (data) {
                // Map the nested vibecoder_projects to the standard projects property
                const mappedProfiles = (data as any[]).map(p => ({
                    ...p,
                    projects: p.vibecoder_projects || []
                }));
                // Sort projects by newest first to get the best thumbnails
                mappedProfiles.forEach(p => {
                    p.projects.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                });
                setProfiles(mappedProfiles);
            } else if (error) {
                console.error("Error fetching active vibecoders:", error);
            }
            setLoading(false);
        }
        fetchActiveVibecoders();
    }, [supabase]);

    return (
        <div className="w-full pt-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {profiles.map(profile => (
                            <VibecoderCard key={profile.id} profile={profile} />
                        ))}

                        {/* Placeholder Card (Clickable to Create Profile) */}
                        <Link href="/profile" onClick={handleCreateProfileClick} className="block group outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-3xl h-full">
                            <Card className="rounded-3xl border-dashed border-2 border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full min-h-[320px] bg-muted/10 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">You belongs here.</h3>
                                <p className="text-muted-foreground text-lg">Create your profile and start shipping</p>
                            </Card>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
