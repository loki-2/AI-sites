"use client";

import { useActionState, useEffect, useState } from "react";
import { subscribeToGigs } from "@/app/actions/subscribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export function GigsNewsletterSection() {
    const [state, formAction, isPending] = useActionState(subscribeToGigs, null);
    const [email, setEmail] = useState("");

    // Clear email input on success
    useEffect(() => {
        if (state?.success) {
            setEmail("");
        }
    }, [state?.success]);

    return (
        <div id="gigs-newsletter" className="w-full max-w-7xl mx-auto px-4 py-8 md:my-6 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

                {/* Left Section: Discord CTA */}
                <div className="py-8 md:pr-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2 flex flex-col items-center">
                        <h3 className="text-xl font-semibold tracking-tight">Join the Community</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            To get notified about freelance gigs and connect with other builders, join our Discord community.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        asChild
                    >
                        <a href="https://discord.gg/your-invite-link" target="_blank" rel="noopener noreferrer">
                            Join Discord
                        </a>
                    </Button>
                </div>

                {/* Right Section: Newsletter Subscription */}
                <div className="py-8 md:pl-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2 w-full flex flex-col items-center">
                        <h3 className="text-xl font-semibold tracking-tight">Subscribe to Gigs</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Get monthly or weekly notifications directly to your inbox about new freelance opportunities.
                        </p>
                    </div>

                    <form action={formAction} className="w-full max-w-sm space-y-3 mt-2 text-left">
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-background"
                                disabled={isPending}
                            />
                            <Button variant="outline" type="submit" disabled={isPending} className="whitespace-nowrap w-full sm:w-auto">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting
                                    </>
                                ) : (
                                    "Get Notified"
                                )}
                            </Button>
                        </div>

                        {/* Status Messages */}
                        {state?.message && (
                            <div
                                className={`flex items-center justify-center sm:justify-start gap-2 text-sm mt-2 ${state.success ? "text-emerald-500" : "text-destructive"
                                    }`}
                            >
                                {state.success && <CheckCircle2 className="h-4 w-4" />}
                                <p>{state.message}</p>
                            </div>
                        )}
                    </form>
                </div>

            </div>
        </div>
    );
}
