'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VibecoderProject } from "@/types";

const TAG_OPTIONS = ["shipped", "half baked", "experiment"];

export function ProjectFormModal({
    profileId,
    existingProject,
    onClose,
    onSave
}: {
    profileId: string;
    existingProject?: VibecoderProject;
    onClose: () => void;
    onSave: (p: VibecoderProject) => void;
}) {
    const [name, setName] = useState(existingProject?.name || "");
    const [description, setDescription] = useState(existingProject?.description || "");
    const [selectedTags, setSelectedTags] = useState<string[]>(existingProject?.tags?.map(t => t.toLowerCase() === 'in progress' ? 'half baked' : t) || []);
    const [liveLink, setLiveLink] = useState(existingProject?.live_link || "");
    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(existingProject?.images || []);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const supabase = createSupabaseBrowserClient();

    // Re-derive and sync the project count columns on the profile from actual project tags
    const syncProfileCounts = async (profileId: string) => {
        const { data: allProjects } = await supabase
            .from('vibecoder_projects')
            .select('tags')
            .eq('profile_id', profileId);

        if (!allProjects) return;

        let shipped = 0, inProgress = 0, experiment = 0;
        for (const proj of allProjects) {
            const tags: string[] = Array.isArray(proj.tags) ? proj.tags : [];
            for (const tag of tags) {
                const t = tag.toLowerCase();
                if (t === 'shipped') shipped++;
                else if (t === 'in progress') inProgress++;
                else if (t === 'experiment') experiment++;
            }
        }

        await supabase
            .from('vibecoder_profiles')
            .update({
                total_projects: allProjects.length,
                shipped_projects: shipped,
                in_progress_projects: inProgress,
                experiment_projects: experiment,
            })
            .eq('id', profileId);
    };

    const handleSelectTags = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const totalImages = files.length + existingImages.length + selectedFiles.length;
            if (totalImages > 5) {
                setError("Maximum 5 images allowed in total.");
            } else {
                setFiles([...files, ...selectedFiles].slice(0, 5 - existingImages.length));
                setError("");
            }
        }
    };

    const removeFile = (idx: number) => {
        setFiles(files.filter((_, i) => i !== idx));
    };

    const removeExistingImage = (idx: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !description.trim()) {
            setError("Name and description are required.");
            return;
        }
        const totalImagesCount = files.length + existingImages.length;
        if (totalImagesCount < 1 || totalImagesCount > 5) {
            setError("Please upload between 1 to 5 images total.");
            return;
        }
        if (selectedTags.length === 0) {
            setError("Please select at least one tag.");
            return;
        }
        if (selectedTags.includes("shipped") && !liveLink.trim()) {
            setError("A live link is required for shipped projects.");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload Images
            const imageUrls: string[] = [];
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${profileId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('project_images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('project_images')
                    .getPublicUrl(data.path);

                imageUrls.push(publicUrl);
            }

            // Convert 'half baked' back to 'in progress' for the database
            const dbTags = selectedTags.map(t => t.toLowerCase() === 'half baked' ? 'in progress' : t);

            if (existingProject) {
                const projectData = {
                    name,
                    description,
                    tags: dbTags,
                    live_link: liveLink || null,
                    images: [...existingImages, ...imageUrls]
                };

                const { data: updatedProject, error: dbError } = await supabase
                    .from('vibecoder_projects')
                    .update(projectData)
                    .eq('id', existingProject.id)
                    .select()
                    .single();

                if (dbError) throw dbError;
                await syncProfileCounts(profileId);
                onSave(updatedProject as VibecoderProject);
            } else {
                const projectData = {
                    profile_id: profileId,
                    name,
                    description,
                    tags: dbTags,
                    live_link: liveLink || null,
                    images: [...existingImages, ...imageUrls]
                };

                const { data: insertedProject, error: dbError } = await supabase
                    .from('vibecoder_projects')
                    .insert([projectData])
                    .select()
                    .single();

                if (dbError) throw dbError;
                await syncProfileCounts(profileId);
                onSave(insertedProject as VibecoderProject);
            }
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to save project. Please try again.";
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6">{existingProject ? 'Edit Project' : 'Add New Project'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label className="block mb-2 text-sm font-semibold">Project Name</Label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Dashboard"
                        />
                    </div>

                    <div>
                        <Label className="block mb-2 text-sm font-semibold">Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none h-28"
                            placeholder="What did you build?"
                        />
                    </div>

                    <div>
                        <Label className="block mb-3 text-sm font-semibold">Status</Label>
                        <div className="flex gap-3 flex-wrap">
                            {TAG_OPTIONS.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleSelectTags(tag)}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all border ${selectedTags.includes(tag)
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                        : 'bg-background hover:bg-muted border-border text-muted-foreground'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="block mb-2 text-sm font-semibold">Live Site Link</Label>
                        <Input
                            type="url"
                            value={liveLink}
                            onChange={(e) => setLiveLink(e.target.value)}
                            placeholder="https://acme.com (required if 'shipped')"
                        />
                    </div>

                    <div>
                        <Label className="block mb-2 text-sm font-semibold">Images (1 to 5 required)</Label>
                        <p className="text-xs text-muted-foreground mb-3">Upload screenshots or mockups showcasing your project.</p>

                        <div className="flex gap-4 flex-wrap mb-4">
                            {existingImages.map((imgUrl, idx) => (
                                <div key={`ext-${idx}`} className="relative w-24 h-24 rounded-lg border border-border overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imgUrl} alt="existing preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(idx)}
                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}

                            {files.map((f, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-lg border border-border overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}

                            {(files.length + existingImages.length) < 5 && (
                                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                                    <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-xs font-semibold">Upload</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div>
                            {existingProject && (
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
                                            setUploading(true);
                                            const { error } = await supabase
                                                .from('vibecoder_projects')
                                                .delete()
                                                .eq('id', existingProject.id);
                                            if (error) {
                                                console.error(error);
                                                setError(error.message);
                                                setUploading(false);
                                            } else {
                                                await syncProfileCounts(profileId);
                                                onClose();
                                                window.location.reload();
                                            }
                                        }
                                    }}
                                    disabled={uploading}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" type="button" onClick={onClose} disabled={uploading}>Cancel</Button>
                            <Button type="submit" disabled={uploading} className="shadow-md min-w-[120px]">
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : existingProject ? "Update Project" : "Save Project"}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
