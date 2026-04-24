"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (loading) {
        return <div className="w-20 h-8 rounded-md bg-muted animate-pulse" />;
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {user.user_metadata?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.user_metadata.avatar_url}
                            alt={user.user_metadata?.full_name ?? "User"}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-border">
                            <span className="text-xs font-bold text-primary">
                                {(user.user_metadata?.full_name ?? user.email ?? "?").charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span className="text-sm font-medium hidden md:block truncate max-w-[120px]">
                        {user.user_metadata?.full_name ?? user.email}
                    </span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign out
                </Button>
            </div>
        );
    }

    return (
        <Button onClick={handleSignIn} size="sm" className="flex items-center gap-2 font-bold">
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="currentColor"
                    opacity="0.9"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                    opacity="0.9"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="currentColor"
                    opacity="0.9"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                    opacity="0.9"
                />
            </svg>
            Sign in
        </Button>
    );
}
