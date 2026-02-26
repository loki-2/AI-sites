import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VibecoderProfile, VibecoderBadge } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { BADGE_EMOJIS } from "@/lib/utils";

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

const BUILD_TAGS_OPTIONS = [
    "Web apps", "Mobile apps"
];

export function ProfileEditModal({
    profile,
    onClose,
    onSave
}: {
    profile: VibecoderProfile,
    onClose: () => void,
    onSave: (p: VibecoderProfile) => void
}) {
    const supabase = createSupabaseBrowserClient();
    const [name, setName] = useState(profile.name || "");
    const [bio, setBio] = useState(profile.bio || "");
    const [badges, setBadges] = useState<VibecoderBadge[]>(profile.badges || []);
    const [socialUrl, setSocialUrl] = useState(profile.social_url || "");
    const [buildTags, setBuildTags] = useState<string[]>(profile.build_tags || []);
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarUrl(URL.createObjectURL(e.target.files[0]));
        }
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

    const handleBuildTagToggle = (tag: string) => {
        if (buildTags.includes(tag)) {
            setBuildTags(buildTags.filter(t => t !== tag));
        } else {
            setBuildTags([...buildTags, tag]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        let finalAvatarUrl = profile.avatar_url || "";

        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);

            if (!uploadError) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                finalAvatarUrl = data.publicUrl;
            } else {
                console.error("Failed to upload avatar:", uploadError);
            }
        }

        const { error } = await supabase
            .from('vibecoder_profiles')
            .update({ name, bio, badges, social_url: socialUrl, avatar_url: finalAvatarUrl, build_tags: buildTags })
            .eq('id', profile.id);

        if (!error) {
            // Tell the Supabase Auth session about these changes so the Navbar reacts instantly
            await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    ...(finalAvatarUrl ? { avatar_url: finalAvatarUrl } : {})
                }
            });
        }

        setSaving(false);
        if (!error) {
            onSave({ ...profile, name, bio, badges, social_url: socialUrl, avatar_url: finalAvatarUrl, build_tags: buildTags });
        } else {
            console.error("Failed to save profile", error);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl bg-card rounded-3xl p-6 border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex flex-col items-center gap-4 mb-2">
                        <div className="relative group">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                                    <span className="text-3xl font-bold text-muted-foreground">{name.charAt(0) || 'U'}</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-[10px] font-semibold">Change</span>
                                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Reach out social (X/LinkedIn URL)</Label>
                        <Input
                            value={socialUrl}
                            onChange={e => setSocialUrl(e.target.value)}
                            placeholder="https://x.com/yourhandle"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>About You</Label>
                        <Textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="h-32 resize-none"
                            placeholder="Helping businesses and creatives grow..."
                        />
                    </div>

                    <div className="space-y-4">
                        <Label>What do you build?</Label>
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
                        <Label>Expertise</Label>
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
                                    <div key={badge.name} className="flex items-center justify-between gap-2 text-sm bg-muted/20 p-2 rounded-lg border border-border/30">
                                        <span className="font-medium text-foreground ml-2">
                                            <span className="mr-2">{BADGE_EMOJIS[badge.name] || "✨"}</span>
                                            {badge.name}
                                        </span>
                                        <Select
                                            value={badge.level}
                                            onValueChange={(val) => handleBadgeLevelChange(badge.name, val)}
                                        >
                                            <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border shadow-sm">
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SKILL_LEVELS.map(level => (
                                                    <SelectItem key={level} value={level} className="text-xs capitalize">{level}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                    <Button variant="outline" onClick={onClose} disabled={saving} className="font-semibold">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="font-semibold">{saving ? "Saving..." : "Save Changes"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
