'use client';

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProject, VibecoderProfile } from "@/types";
import { ProjectCard } from "@/components/ProjectCard";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import useSWR from 'swr';

// Interface for the joined data returned from Supabase
interface ProjectWithAuthor extends VibecoderProject {
    author: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
}

const fetchAllProjects = async ([_key, limit]: [string, number]) => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
        .from('vibecoder_projects')
        .select(`
            *,
            author:vibecoder_profiles(id, name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    if (data) {
        const formattedProjects = (data as any[]).map(p => ({
            ...p,
            author: Array.isArray(p.author) ? p.author[0] : p.author
        })) as ProjectWithAuthor[];

        const sortOrder: Record<string, number> = {
            "shipped": 1,
            "experiment": 2,
            "half baked": 3
        };

        formattedProjects.sort((a, b) => {
            const aHighTag = Math.min(...a.tags.map(t => {
                const lookup = t.toLowerCase() === 'in progress' ? 'half baked' : t.toLowerCase();
                return sortOrder[lookup] || 99;
            }));
            const bHighTag = Math.min(...b.tags.map(t => {
                const lookup = t.toLowerCase() === 'in progress' ? 'half baked' : t.toLowerCase();
                return sortOrder[lookup] || 99;
            }));

            if (aHighTag !== bHighTag) {
                return aHighTag - bHighTag;
            }

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        return formattedProjects;
    }
    return [];
};

export function AllProjectsSection() {
    const [pageLimit, setPageLimit] = useState(12);
    const { data: projects = [], isLoading: loading } = useSWR(['all_projects', pageLimit], fetchAllProjects, {
        dedupingInterval: 30000,
        revalidateOnFocus: false,
    });

    const hasMore = projects.length === pageLimit;

    return (
        <div className="w-full pt-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground">
                        <p className="text-xl">No projects found on the platform yet.</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="flex flex-col h-full group">
                            <div className="flex-grow">
                                <ProjectCard project={project} />
                            </div>

                            {/* Author Attribution Footer */}
                            {project.author && (
                                <Link href={`/profile/${project.author.id}`} className="mt-3 inline-flex items-center gap-2 hover:opacity-80 transition-opacity ml-2 w-fit">
                                    {project.author.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={project.author.avatar_url}
                                            alt={project.author.name}
                                            className="w-6 h-6 rounded-full object-cover ring-1 ring-border/50"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-border">
                                            <span className="font-bold text-[10px] text-primary">
                                                {(project.author.name || "?").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                        by {project.author.name}
                                    </span>
                                </Link>
                            )}
                        </div>
                    ))
                )}
            </div>

            {!loading && hasMore && (
                <div className="flex justify-center mt-12 w-full">
                    <button
                        onClick={() => setPageLimit(prev => prev + 12)}
                        className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-full border border-border transition-colors shadow-sm"
                    >
                        Load More Projects
                    </button>
                </div>
            )}
        </div>
    );
}
