'use client';

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProfile, VibecoderProject } from "@/types";
import { VibecoderCard } from "@/components/VibecoderCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import useSWR from 'swr';

const fetchActiveVibecoders = async ([_key, limit]: [string, number]) => {
    const supabase = createSupabaseBrowserClient();

    // Check auth in parallel with the profile query
    const [{ data: { user } }, shippedResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
            .from('vibecoder_projects')
            .select('profile_id')
            .contains('tags', ['shipped'])
    ]);

    const shippedProfileIds = [...new Set(
        (shippedResult.data || []).map((p: any) => p.profile_id)
    )] as string[];

    if (shippedProfileIds.length === 0) {
        return { profiles: [] as VibecoderProfile[], userTotalProjects: 0 };
    }

    let currentUserHasShipped = user ? shippedProfileIds.includes(user.id) : false;

    const { data, error } = await supabase
        .from('vibecoder_profiles')
        .select('*, vibecoder_projects(*)')
        .in('id', shippedProfileIds)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) throw error;

    let mappedProfiles = (data as any[]).map(p => ({
        ...p,
        projects: (p.vibecoder_projects || []) as any[]
    }));

    // Sort each profile's projects newest first
    mappedProfiles.forEach(p => {
        p.projects.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    // Pin logged-in user to front
    if (user) {
        const userIdx = mappedProfiles.findIndex(p => p.id === user.id);
        if (userIdx > 0) {
            const [userProfile] = mappedProfiles.splice(userIdx, 1);
            mappedProfiles.unshift(userProfile);
        }
    }

    return { profiles: mappedProfiles as VibecoderProfile[], userTotalProjects: currentUserHasShipped ? 1 : 0 };
};

export function ActiveVibecodersSection() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [pageLimit, setPageLimit] = useState(10);

    const { data, isLoading } = useSWR(['active_vibecoders', pageLimit], fetchActiveVibecoders, {
        dedupingInterval: 30000,
        revalidateOnFocus: false,
    });
    const profiles = data?.profiles || [];
    const currentUserTotalProjects = data?.userTotalProjects ?? null;
    const loading = isLoading;

    const hasMore = profiles.length === pageLimit;

    const handleCreateProfileClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            router.push('/profile');
        } else {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
                },
            });
        }
    };

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
                        {(currentUserTotalProjects === null || currentUserTotalProjects === 0) && (
                            <Link href="/profile" onClick={handleCreateProfileClick} className="block group outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-3xl h-full">
                                <Card className="rounded-3xl border-dashed border-2 border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full min-h-[320px] bg-muted/10 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">Add your first Project</h3>
                                    <p className="text-muted-foreground text-lg">Create your portfolio and start maintaining</p>
                                </Card>
                            </Link>
                        )}
                    </>
                )}
            </div>

            {!loading && hasMore && (
                <div className="flex justify-center mt-12 w-full">
                    <button
                        onClick={() => setPageLimit(prev => prev + 10)}
                        className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full border border-border transition-colors shadow-sm"
                    >
                        Load More Vibecoders
                    </button>
                </div>
            )}
        </div>
    );
}
