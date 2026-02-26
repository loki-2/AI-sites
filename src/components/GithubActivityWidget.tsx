'use client';

import React, { useState, useEffect } from 'react';
import { GitHubCalendar } from 'react-github-calendar';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface GithubWidgetProps {
    username?: string; // If provided, shows calendar directly (public profile mode)
    isOwner?: boolean; // If true, shows "Connect GitHub" button if no identity found (private profile mode)
    onConnected?: (username: string) => void;
    onDisconnected?: () => void;
}

export function GithubActivityWidget({ username, isOwner, onConnected, onDisconnected }: GithubWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [githubUser, setGithubUser] = useState<string | null>(username || null);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        if (username) {
            setGithubUser(username);
            setLoading(false);
            return;
        }

        if (isOwner) {
            checkGithubIdentity();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, isOwner]);

    async function checkGithubIdentity() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if the user already has a linked github identity
            const githubIdentity = user.identities?.find(id => id.provider === 'github');

            if (githubIdentity) {
                // Identity data usually contains 'preferred_username' or 'user_name'
                // @ts-ignore Types on identity data are un-strict 
                const handle = githubIdentity.identity_data?.preferred_username || githubIdentity.identity_data?.user_name;

                if (handle) {
                    setGithubUser(handle);
                    // Automatically save to profile if just found
                    if (!username && onConnected) {
                        onConnected(handle);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check github identity", error);
        } finally {
            setLoading(false);
        }
    }

    const connectGithub = async () => {
        try {
            await supabase.auth.linkIdentity({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/profile`,
                }
            });
        } catch (error) {
            console.error("Error linking github:", error);
        }
    };

    const disconnectGithub = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const githubIdentity = user.identities?.find(id => id.provider === 'github');
            if (githubIdentity) {
                const { error } = await supabase.auth.unlinkIdentity(githubIdentity);
                if (error) {
                    console.error("Error unlinking github identity:", error);
                    setLoading(false);
                    return;
                }
            }

            setGithubUser(null);
            if (onDisconnected) {
                onDisconnected();
            }
        } catch (error) {
            console.error("Error disconnecting github:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-40 bg-muted/20 animate-pulse rounded-xl border border-border/50 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-medium">Checking GitHub connection...</p>
            </div>
        );
    }

    if (!githubUser && isOwner) {
        return (
            <div className="w-full p-8 bg-card border border-border/50 rounded-xl flex flex-col items-center justify-center text-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-1 tracking-tight">Showcase Your GitHub</h3>
                    <p className="text-sm text-muted-foreground w-full max-w-sm mx-auto">Link your GitHub developer account to proudly display your contribution graph directly on your profile.</p>
                </div>
                <Button onClick={connectGithub} variant="default" className="mt-2 font-semibold">
                    Connect GitHub
                </Button>
            </div>
        );
    }

    if (!githubUser) return null;

    return (
        <div className="w-full p-6 pt-5 bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden overflow-x-auto relative group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] uppercase font-primary tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-foreground/70" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    @{githubUser}
                </h3>
                {isOwner && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={disconnectGithub}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Disconnect
                    </Button>
                )}
            </div>
            <div className="min-w-[700px]">
                <GitHubCalendar
                    username={githubUser}
                />
            </div>
        </div>
    );
}
