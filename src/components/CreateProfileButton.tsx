'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface CreateProfileButtonProps {
    className?: string;
    variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
    hideWhenComplete?: boolean;
}

export function CreateProfileButton({
    className,
    variant = "default",
    size = "default",
    children = "Create Profile",
    hideWhenComplete = false
}: CreateProfileButtonProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function checkState(currentUser: User | null) {
            if (!isMounted) return;
            setUser(currentUser);

            if (currentUser && hideWhenComplete) {
                const { data: profile } = await supabase
                    .from('vibecoder_profiles')
                    .select('bio, badges')
                    .eq('id', currentUser.id)
                    .single();

                if (profile && isMounted) {
                    const hasBio = !!profile.bio;
                    const hasBadges = profile.badges && profile.badges.length > 0;
                    if (hasBio || hasBadges) {
                        setIsComplete(true);
                    } else {
                        setIsComplete(false);
                    }
                }
            } else if (!currentUser && isMounted) {
                setIsComplete(false);
            }
            if (isMounted) setLoading(false);
        }

        supabase.auth.getUser().then(({ data }) => {
            checkState(data.user);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            checkState(session?.user ?? null);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, hideWhenComplete]);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (loading) return;

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

    if (hideWhenComplete && isComplete) {
        return null;
    }

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            size={size}
            className={className}
            disabled={loading}
        >
            {children}
        </Button>
    );
}
