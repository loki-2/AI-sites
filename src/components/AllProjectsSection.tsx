'use client';

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProject, VibecoderProfile } from "@/types";
import { ProjectCard } from "@/components/ProjectCard";
import Link from "next/link";
import { Card } from "@/components/ui/card";

// Interface for the joined data returned from Supabase
interface ProjectWithAuthor extends VibecoderProject {
    author: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
}

export function AllProjectsSection() {
    const [projects, setProjects] = useState<ProjectWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        async function fetchAllProjects() {
            // Fetch all projects along with their author's basic profile details
            const { data, error } = await supabase
                .from('vibecoder_projects')
                .select(`
                    *,
                    author:vibecoder_profiles(id, name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching all projects:", error);
                setLoading(false);
                return;
            }

            if (data) {
                // Handle Supabase's array mapping for foreign keys. author is likely returned as an array or a single object depending on relation type. Since a project has one author profile, it should be an object (or first index of array).
                const formattedProjects = (data as any[]).map(p => ({
                    ...p,
                    author: Array.isArray(p.author) ? p.author[0] : p.author
                })) as ProjectWithAuthor[];

                // Sort by specified tag hierarchy: Shipped -> Experiment -> In Progress
                const sortOrder: Record<string, number> = {
                    "shipped": 1,
                    "experiment": 2,
                    "in progress": 3
                };

                formattedProjects.sort((a, b) => {
                    // Find the most 'prestigious' tag for a project to sort by
                    const aHighTag = Math.min(...a.tags.map(t => sortOrder[t.toLowerCase()] || 99));
                    const bHighTag = Math.min(...b.tags.map(t => sortOrder[t.toLowerCase()] || 99));

                    if (aHighTag !== bHighTag) {
                        return aHighTag - bHighTag;
                    }

                    // Fallback to newest if tags are identical tier
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                setProjects(formattedProjects);
            }
            setLoading(false);
        }

        fetchAllProjects();
    }, [supabase]);

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
        </div>
    );
}
