import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VibecoderProfile, FreelanceApplication, VibecoderProject } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Check, ChevronDown, X } from "lucide-react";

const HOURLY_RATES = ["Flexible", "$1-10/hr", "$10-20/hr", "$20-30/hr", "$30-50/hr", ">$50/hr"];

const CAPABILITIES_MAP: Record<string, string[]> = {
    "Web App": [
        "SaaS Platform",
        "Marketplace Platform",
        "Dashboard Application",
        "Internal Tools",
        "Social Platform",
        "E-commerce Platform",
        "Admin Panel",
        "Other"
    ],
    "Mobile App": [
        "Social Mobile App",
        "Marketplace Mobile App",
        "On-demand Service App",
        "Fitness App",
        "E-commerce Mobile App",
        "Other"

    ],
    "Landing Page": [
        "Startup Landing Page",
        "Product Launch Page",
        "Marketing Website",
        "Portfolio Website",
        "Company Website",
        "Other"
    ]
};

export function FreelanceApplicationModal({
    profile,
    projects,
    onClose,
    onSuccess
}: {
    profile: VibecoderProfile,
    projects: VibecoderProject[],
    onClose: () => void,
    onSuccess: (updatedProfile: VibecoderProfile) => void
}) {
    const supabase = createSupabaseBrowserClient();
    const [hourlyRate, setHourlyRate] = useState("");
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const hasProjects = projects && projects.length > 0;

    const toggleCapability = (cap: string) => {
        if (selectedCapabilities.includes(cap)) {
            setSelectedCapabilities(selectedCapabilities.filter(c => c !== cap));
        } else {
            setSelectedCapabilities([...selectedCapabilities, cap]);
        }
    };

    const toggleProject = (id: string) => {
        if (selectedProjectIds.includes(id)) {
            setSelectedProjectIds(selectedProjectIds.filter(pId => pId !== id));
        } else {
            setSelectedProjectIds([...selectedProjectIds, id]);
        }
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSubmit = async () => {
        if (!hourlyRate) return alert("Please select an hourly rate");
        if (selectedCapabilities.length === 0) return alert("Please select at least one capability");
        if (selectedProjectIds.length === 0 && hasProjects) return alert("Please select at least one project");

        setSaving(true);

        const application = {
            profile_id: profile.id,
            hourly_rate: hourlyRate,
            capabilities: selectedCapabilities,
            project_ids: selectedProjectIds,
            status: 'pending'
        };

        const { error: appError } = await supabase
            .from('freelance_applications')
            .insert(application);

        if (appError) {
            console.error("Failed to submit application", appError);
            setSaving(false);
            return alert("Failed to submit application. Please try again.");
        }

        const { error: profileError } = await supabase
            .from('vibecoder_profiles')
            .update({ verification_status: 'pending' })
            .eq('id', profile.id);

        setSaving(false);

        if (!profileError) {
            onSuccess({ ...profile, verification_status: 'pending' });
        } else {
            console.error("Failed to update profile verification status", profileError);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="!max-w-4xl w-[95vw] sm:w-[90vw] md:w-[80vw] bg-card rounded-3xl p-6 md:p-8 border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Apply for Founding 100 Freelance</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-sm text-muted-foreground">Select your ideal hourly rate and the core capabilities you excel at to start receiving matched inbound requests.</p>

                    <div className="space-y-3">
                        <Label>Hourly Rate</Label>
                        <Select value={hourlyRate} onValueChange={setHourlyRate}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select your rate" />
                            </SelectTrigger>
                            <SelectContent>
                                {HOURLY_RATES.map(rate => (
                                    <SelectItem key={rate} value={rate}>{rate}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label>Select Capabilities</Label>
                        {Object.entries(CAPABILITIES_MAP).map(([category, capabilities]) => (
                            <div key={category} className="space-y-2 border border-border/50 rounded-lg p-4 bg-muted/10">
                                <h4 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground">{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {capabilities.map(cap => {
                                        const isSelected = selectedCapabilities.includes(cap);
                                        return (
                                            <button
                                                key={cap}
                                                onClick={() => toggleCapability(cap)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isSelected
                                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                    }`}
                                            >
                                                {cap}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pb-12">
                        <Label>Select Verified Projects</Label>
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">Select the projects that best demonstrate your capabilities from your profile.</p>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between border border-input hover:border-border transition-colors bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md shadow-sm"
                                >
                                    <span className={selectedProjectIds.length === 0 ? "text-muted-foreground" : "text-foreground font-medium"}>
                                        {selectedProjectIds.length === 0
                                            ? "Select projects from your profile..."
                                            : `${selectedProjectIds.length} project(s) selected`}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border shadow-lg rounded-md max-h-56 overflow-y-auto custom-scrollbar flex flex-col p-1">
                                        {projects && projects.length > 0 ? (
                                            projects.map(project => {
                                                const isSelected = selectedProjectIds.includes(project.id);
                                                return (
                                                    <div
                                                        key={project.id}
                                                        onClick={() => toggleProject(project.id)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-sm hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <div className={`w-4 h-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-medium truncate leading-tight">{project.name}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                                                No projects found on your profile.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Render selected project tags */}
                            {selectedProjectIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {selectedProjectIds.map(id => {
                                        const project = projects?.find(p => p.id === id);
                                        if (!project) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-xs font-medium shadow-sm">
                                                <span className="truncate max-w-[150px]">{project.name}</span>
                                                <button type="button" onClick={() => toggleProject(id)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                    <Button variant="outline" onClick={onClose} disabled={saving} className="font-semibold">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving || selectedProjectIds.length === 0} className="font-semibold">
                        {saving ? "Submitting..." : "Submit Application"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
