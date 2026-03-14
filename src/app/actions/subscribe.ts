"use server";

import { z } from "zod";
import { supabase } from "@/lib/supabase/client";

// Define schema for input validation
const subscribeSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

export async function subscribeToGigs(prevState: any, formData: FormData) {
    try {
        const email = formData.get("email");

        // Validate email
        const validatedFields = subscribeSchema.safeParse({
            email: email,
        });

        if (!validatedFields.success) {
            return {
                success: false,
                message: validatedFields.error.issues[0].message,
            };
        }

        const validEmail = validatedFields.data.email;

        // Use service role client (which bypasses RLS if needed) to ensure insertion
        // Note: process.env.SUPABASE_SERVICE_ROLE_KEY is required for supabase.client on the server
        const { error } = await supabase.client
            .from("gigs_subscriptions")
            .insert({ email: validEmail });

        if (error) {
            // Handle unique constraint error (usually string matching "unique constraint")
            if (error.code === "23505" || error.message.includes("unique")) {
                return {
                    success: true, // We treat it as success so the user feels they are subscribed
                    message: "You are already subscribed to the list!",
                };
            }

            console.error("Error inserting subscription:", error);
            return {
                success: false,
                message: "Failed to subscribe. Please try again later.",
            };
        }

        return {
            success: true,
            message: "Successfully subscribed to freelance gigs!",
        };
    } catch (err) {
        console.error("Unknown error in subscribeToGigs:", err);
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}
