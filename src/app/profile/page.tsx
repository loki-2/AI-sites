'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@supabase/supabase-js";
import type { VibecoderProfile, VibecoderBadge, VibecoderProject } from "@/types";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectFormModal } from "@/components/ProjectFormModal";

const BUILD_TAGS_OPTIONS = [
    "Web apps", "Mobile apps", "MVP Builder", "SaaS Builder", "AI Apps", "Automation Engineer", "Websites",
];
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { GithubActivityWidget } from "@/components/GithubActivityWidget";
import { Edit2, Share2, Check } from "lucide-react";
import { BADGE_EMOJIS } from "@/lib/utils";

// Predefined badges
const AVAILABLE_BADGES = [
    "Frontend",
    "Web UI",
    "Mobile UI",
    "Security",
    "Backend",
    "Mobile Dev",
    "Fullstack Dev",
];

const SKILL_LEVELS = ["beginner", "moderate", "expert"];

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<VibecoderProfile | null>(null);
    const [projects, setProjects] = useState<VibecoderProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<VibecoderProject | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const handleShareProfile = async () => {
        if (!profile?.id) return;
        const url = `${window.location.origin}/profile/${profile.id}`;
        try {
            await navigator.clipboard.writeText(url);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy profile link", err);
        }
    };

    // Form State for completion
    const [bio, setBio] = useState("");
    const [socialUrl, setSocialUrl] = useState("");
    const [availability, setAvailability] = useState("");
    const [badges, setBadges] = useState<VibecoderBadge[]>([]);
    const [buildTags, setBuildTags] = useState<string[]>([]);

    // If both are empty, the user has not completed their profile setup
    const isProfileIncomplete = !profile?.bio && (!profile?.badges || profile.badges.length === 0);

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Redirect to login or home if not authenticated
                router.push('/');
                return;
            }
            setUser(user);

            // Load Profile
            const { data: profileData, error: profileError } = await supabase
                .from('vibecoder_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Load Projects
            const { data: projectsData } = await supabase
                .from('vibecoder_projects')
                .select('*')
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false });

            let loadedProjects: VibecoderProject[] = [];
            if (projectsData) {
                loadedProjects = projectsData as VibecoderProject[];
                // Sort by status
                const getStatusWeight = (tags: string[]) => {
                    if (tags.some(t => t.toLowerCase() === 'shipped')) return 1;
                    if (tags.some(t => t.toLowerCase() === 'half baked' || t.toLowerCase() === 'in progress')) return 2;
                    if (tags.some(t => t.toLowerCase() === 'experiment')) return 3;
                    return 4;
                };
                loadedProjects.sort((a, b) => {
                    const weightA = getStatusWeight(a.tags);
                    const weightB = getStatusWeight(b.tags);
                    if (weightA !== weightB) return weightA - weightB;
                    // Fallback to recent if same status
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setProjects(loadedProjects);
            }

            if (profileData) {
                // Compute project stats based on loaded projects tags
                const shipped = loadedProjects.filter(p => p.tags.includes('shipped') || p.tags.includes('Shipped')).length;
                const inProgress = loadedProjects.filter(p => p.tags.some(t => t.toLowerCase() === 'half baked' || t.toLowerCase() === 'in progress')).length;
                const experiments = loadedProjects.filter(p => p.tags.includes('experiment') || p.tags.includes('Experiment')).length;

                setProfile({
                    ...(profileData as VibecoderProfile),
                    total_projects: loadedProjects.length,
                    shipped_projects: shipped,
                    in_progress_projects: inProgress,
                    experiment_projects: experiments
                });

                setBio(profileData.bio || "");
                setSocialUrl(profileData.social_url || "");
                setAvailability(profileData.availability || "");
                setBadges(profileData.badges || []);
            } else if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist, create it auto
                const newProfile = {
                    id: user.id,
                    name: user.user_metadata?.full_name || user.email || "New Vibecoder",
                    avatar_url: user.user_metadata?.avatar_url || "",
                    badges: [],
                };
                const { data: insertedData } = await supabase
                    .from('vibecoder_profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (insertedData) {
                    setProfile({
                        ...(insertedData as VibecoderProfile),
                        total_projects: loadedProjects.length,
                        shipped_projects: 0,
                        in_progress_projects: 0,
                        experiment_projects: 0
                    });
                }
            }

            setLoading(false);
        }
        loadData();
    }, [router, supabase]);

    const handleSaveProfile = async () => {
        if (!user || !profile) return;
        setSaving(true);
        const { error } = await supabase
            .from('vibecoder_profiles')
            .update({ bio, badges, social_url: socialUrl, availability, build_tags: buildTags })
            .eq('id', user.id);

        if (!error) {
            setProfile({ ...profile, bio, badges, social_url: socialUrl, availability, build_tags: buildTags });
        }
        setSaving(false);
    };

    const handleProfileSaved = (updatedProfile: VibecoderProfile) => {
        setProfile({ ...updatedProfile, ...updatedProfile.projects && { projects: projects } });
        setBio(updatedProfile.bio || "");
        setSocialUrl(updatedProfile.social_url || "");
        setAvailability(updatedProfile.availability || "");
        setBuildTags(updatedProfile.build_tags || []);
        setBadges(updatedProfile.badges || []);
        setIsEditModalOpen(false);
    };

    const handleBadgeToggle = (badgeName: string) => {
        if (badges.some(b => b.name === badgeName)) {
            setBadges(badges.filter(b => b.name !== badgeName));
        } else {
            setBadges([...badges, { name: badgeName, level: 'moderate' }]);
        }
    };

    const handleBadgeLevelChange = (badgeName: string, level: string) => {
        setBadges(badges.map(b => b.name === badgeName ? { ...b, level } : b));
    };

    const fetchProjects = async () => {
        if (!user) return;
        const { data: projectsData } = await supabase
            .from('vibecoder_projects')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false });

        if (projectsData) {
            setProjects(projectsData as VibecoderProject[]);
        }
    };

    const onProjectSaved = () => {
        fetchProjects();
        setIsProjectModalOpen(false);
        setProjectToEdit(null);
    };

    const handleBuildTagToggle = (tag: string) => {
        if (buildTags.includes(tag)) {
            setBuildTags(buildTags.filter(t => t !== tag));
        } else {
            setBuildTags([...buildTags, tag]);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse text-center space-y-4">
                <div className="h-10 w-48 bg-muted rounded mx-auto" />
                <div className="h-6 w-3/4 bg-muted rounded mx-auto" />
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
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleShareProfile}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                                        title="Share Profile"
                                    >
                                        {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                                    </button>
                                    {!isProfileIncomplete && (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                                            title="Edit Profile"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
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

                            {!isProfileIncomplete && profile?.bio && (
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">
                                    {profile.bio}
                                </p>
                            )}

                            {profile?.build_tags && profile.build_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {profile.build_tags.map(tag => (
                                        <span key={tag} className="px-2.5 py-1 bg-muted/50 border border-border/50 text-muted-foreground rounded-md text-xs font-semibold tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {profile?.availability && !isProfileIncomplete && (
                                <div className="mt-6">
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background text-sm font-medium shadow-sm">
                                        <span className={`w-2 h-2 rounded-full ${profile.availability === 'Available for gigs' ? 'bg-green-500' :
                                            profile.availability === 'Not looking for gigs' ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }`} />
                                        {profile.availability}
                                    </span>
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
                                <div className="flex items-center gap-2"><span className="text-primary font-bold">{profile?.shipped_projects || 0}</span> Shipped</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-md border border-border">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <div className="flex items-center gap-2"><span className="text-primary font-bold">{profile?.in_progress_projects || 0}</span> Half baked</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-md border border-border">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </span>
                                <div className="flex items-center gap-2"><span className="text-primary font-bold">{profile?.experiment_projects || 0}</span> Experiments</div>
                            </div>
                        </div>

                        {/* Profile Completion or Skills Display */}
                        {isProfileIncomplete ? (
                            <div className="space-y-6 bg-card border border-primary shadow-sm p-6 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="text-xl font-bold mb-1 tracking-tight flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
                                        Profile Completion
                                    </h2>

                                </div>
                                <div className="space-y-3">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">About</Label>
                                    <Textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none h-32"
                                        placeholder="I build web app MVPs in 2 days..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">Reach out social</Label>
                                    <Input
                                        value={socialUrl}
                                        onChange={(e) => setSocialUrl(e.target.value)}
                                        className="bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="https://x.com/yourhandle or LinkedIn"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">Availability</Label>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { label: "Available for gigs", dot: "bg-green-500" },
                                            { label: "Not looking for gigs", dot: "bg-blue-500" },
                                            { label: "Loaded up with projects", dot: "bg-orange-500" }
                                        ].map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => setAvailability(opt.label)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${availability === opt.label
                                                    ? 'bg-primary/10 border-primary shadow-sm'
                                                    : 'bg-background hover:bg-muted/50 border-border text-foreground'
                                                    }`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${opt.dot} shadow-sm`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">What do you build?</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {BUILD_TAGS_OPTIONS.map((tag) => {
                                            const isActive = buildTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleBuildTagToggle(tag)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isActive
                                                        ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_BADGES.map((badge) => {
                                            const isActive = badges.some(b => b.name === badge);
                                            return (
                                                <button
                                                    key={badge}
                                                    onClick={() => handleBadgeToggle(badge)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${isActive
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                                        }`}
                                                >
                                                    <span className="mr-1.5">{BADGE_EMOJIS[badge] || "✨"}</span>
                                                    {badge}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {badges.length > 0 && (
                                        <div className="space-y-3 pt-4">
                                            {badges.map(badge => (
                                                <div key={badge.name} className="flex items-center justify-between gap-2 text-sm bg-muted/20 p-2 rounded-lg">
                                                    <span className="font-medium text-muted-foreground truncate ml-2">
                                                        <span className="mr-1.5">{BADGE_EMOJIS[badge.name] || "✨"}</span>
                                                        {badge.name}
                                                    </span>
                                                    <Select
                                                        value={badge.level}
                                                        onValueChange={(val) => handleBadgeLevelChange(badge.name, val)}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-8 text-xs bg-background border-border">
                                                            <SelectValue placeholder="Level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SKILL_LEVELS.map(level => (
                                                                <SelectItem key={level} value={level} className="text-xs">{level}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="w-full font-semibold mt-4"
                                >
                                    {saving ? "Saving..." : "Save Profile"}
                                </Button>
                            </div>
                        ) : (
                            profile?.badges && profile.badges.length > 0 && (
                                <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground pt-4 mb-2">Expertise</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.badges.map(badge => (
                                            <div key={badge.name} className="flex items-center gap-1.5 bg-muted/30 border border-border px-3 py-1.5 rounded-md">
                                                <span className="text-sm">{BADGE_EMOJIS[badge.name] || "✨"}</span>
                                                <span className="text-sm font-medium text-foreground">{badge.name}</span>
                                                <span className="text-xs text-muted-foreground capitalize border-l border-border/50 pl-1.5 ml-1">{badge.level}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Right Area: Projects */}
                <div className="lg:col-span-9">
                    <div className="flex items-center justify-between mb-8 pb-3">
                        <div className="flex gap-6 text-sm font-medium">
                            <button className="text-foreground border-b-2 border-foreground pb-3">Projects</button>
                            {/* <button className="text-muted-foreground hover:text-foreground transition-colors pb-3 -mb-[13px]">Templates</button> */}
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="font-semibold shadow-sm"
                            onClick={() => {
                                setProjectToEdit(null);
                                setIsProjectModalOpen(true);
                            }}
                        >
                            + Add New Project
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.length === 0 ? (
                            <div className="col-span-full">
                                <button
                                    onClick={() => setIsProjectModalOpen(true)}
                                    className="w-full text-left group bg-card hover:bg-muted/30 border border-border shadow-sm rounded-lg overflow-hidden transition-all duration-300"
                                >
                                    <div className="aspect-[16/10] bg-muted/20 flex flex-col items-center justify-center border-b border-border/50 p-8">
                                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm border border-border mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight mb-2">Create Your First Project</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-sm">Showcase your best work. Start by adding a project to your portfolio.</p>
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2"></div>
                                            <div className="h-3 w-24 bg-muted/60 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            projects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onEdit={(p) => {
                                        setProjectToEdit(p);
                                        setIsProjectModalOpen(true);
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* GitHub Activity Integration */}
                    <div className="pt-6 border-t border-border/40 mt-10">
                        <GithubActivityWidget
                            isOwner={true}
                            username={profile?.github_username}
                            onConnected={async (username: string) => {
                                if (!user) return;
                                await supabase.from('vibecoder_profiles').update({ github_username: username }).eq('id', user.id);
                                if (profile) setProfile({ ...profile, github_username: username });
                            }}
                            onDisconnected={async () => {
                                if (!user) return;
                                await supabase.from('vibecoder_profiles').update({ github_username: null }).eq('id', user.id);
                                if (profile) setProfile({ ...profile, github_username: undefined });
                            }}
                        />
                    </div>
                </div>
            </div>

            {isProjectModalOpen && profile && (
                <ProjectFormModal
                    existingProject={projectToEdit || undefined}
                    onClose={() => {
                        setIsProjectModalOpen(false);
                        setProjectToEdit(null);
                    }}
                    onSave={onProjectSaved}
                    profileId={profile.id}
                />
            )}

            {isEditModalOpen && profile && (
                <ProfileEditModal
                    profile={profile}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleProfileSaved}
                />
            )}
        </div>
    );
}
