'use client';

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { VibecoderProject } from "@/types";
import { Edit2 } from "lucide-react";

export function ProjectCard({ project, onEdit }: { project: VibecoderProject, onEdit?: (project: VibecoderProject) => void }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Use the first image as cover, or a fallback gradient
    const coverImage = project.images && project.images.length > 0 ? project.images[0] : null;

    const getCoverTagColor = (tag: string) => {
        switch (tag.toLowerCase()) {
            case "shipped":
                return "bg-green-500/90 text-white border-green-400/50";
            case "in progress":
                return "bg-orange-500/90 text-white border-orange-400/50";
            case "experiment":
                return "bg-blue-500/90 text-white border-blue-400/50";
            default:
                return "bg-background/90 text-foreground border-border/40";
        }
    };

    return (
        <>
            <Card
                onClick={() => setIsModalOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-lg border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
                <div className="aspect-[4/3] w-full bg-muted/30 overflow-hidden relative">
                    {coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={coverImage}
                            alt={project.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                            <span className="text-primary/40 font-bold text-2xl">{project.name.charAt(0)}</span>
                        </div>
                    )}
                    {/* Tags */}
                    <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                        {project.tags.map(tag => (
                            <span key={tag} className={`px-2.5 py-1 text-xs font-semibold rounded-md backdrop-blur-md shadow-sm border ${getCoverTagColor(tag)}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <CardContent className="p-5 text-left">
                    <h3 className="font-bold text-lg mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors text-left">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 text-left">{project.description}</p>
                </CardContent>
            </Card>

            {isModalOpen && (
                <ProjectDetailsModal project={project} onClose={() => setIsModalOpen(false)} onEdit={onEdit} />
            )}
        </>
    );
}

function ProjectDetailsModal({ project, onClose, onEdit }: { project: VibecoderProject; onClose: () => void; onEdit?: (project: VibecoderProject) => void }) {
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    return (
        <Dialog open={true} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl gap-0 max-h-[90vh]">
                <DialogTitle className="sr-only">{project.name} Details</DialogTitle>
                <div className="relative w-full overflow-y-auto custom-scrollbar">

                    {/* Modal */}
                    <div className="relative bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">

                        {/* Header content / Images */}
                        <div className="p-1">
                            {project.images && project.images.length > 0 ? (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={project.images[currentImageIdx]}
                                        alt={`${project.name} preview`}
                                        className="w-full h-full object-contain bg-black/5"
                                    />

                                    {/* Image Navigation */}
                                    {project.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : project.images.length - 1))}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background/80 backdrop-blur-md rounded-full"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIdx((prev) => (prev < project.images.length - 1 ? prev + 1 : 0))}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background/80 backdrop-blur-md rounded-full"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>

                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {project.images.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIdx(idx)}
                                                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIdx ? 'bg-primary scale-125' : 'bg-foreground/30 hover:bg-foreground/50'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                                    <span className="text-primary/40 font-bold text-6xl">{project.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        {/* Project Info */}
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-4 leading-tight">{project.name}</h2>
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {project.tags.map(tag => {
                                        const getTagColor = (t: string) => {
                                            switch (t.toLowerCase()) {
                                                case "shipped":
                                                    return "bg-green-100/80 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
                                                case "in progress":
                                                    return "bg-orange-100/80 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
                                                case "experiment":
                                                    return "bg-blue-100/80 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
                                                default:
                                                    return "bg-secondary text-secondary-foreground border-border/50";
                                            }
                                        };
                                        return (
                                            <span key={tag} className={`px-3 py-1 text-sm font-semibold rounded-md border ${getTagColor(tag)}`}>
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-8">
                                <h3 className="text-md font-bold mb-3">About the project</h3>
                                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                    {project.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-6 border-t border-border/40">
                                {onEdit && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onEdit(project);
                                        }}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-muted text-foreground font-semibold rounded-full hover:bg-muted/80 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </button>
                                )}
                                {project.live_link && (
                                    <a
                                        href={project.live_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 transition-colors"
                                    >
                                        Visit Live Site
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
