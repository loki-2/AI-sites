"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GigsNewsletterSection } from "./GigsNewsletterSection";

interface GigsNewsletterModalProps {
    children: React.ReactNode;
}

export function GigsNewsletterModal({ children }: GigsNewsletterModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            {/* max-w-5xl prevents the dialog from squishing the two columns too early */}
            <DialogContent className="max-w-5xl p-0 border-none bg-transparent shadow-none overflow-hidden">
                <DialogTitle className="sr-only">Subscribe to Gigs or Join Discord</DialogTitle>
                <DialogDescription className="sr-only">
                    Join our Discord community to connect with other builders and get notified about freelance gigs, or subscribe to our newsletter.
                </DialogDescription>
                <GigsNewsletterSection />
            </DialogContent>
        </Dialog>
    );
}
