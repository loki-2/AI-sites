// ===========================================
// Dev Route Auth Guard
// ===========================================
// Protects /api/test/* routes with CRON_SECRET.
// These routes exist for development tooling only and must
// never be callable without authorization.

import { NextRequest, NextResponse } from "next/server";

/**
 * Returns a 401/503 NextResponse if the request is not authorized,
 * or null if the request is valid and may proceed.
 *
 * Usage:
 *   const authError = requireDevAuth(request);
 *   if (authError) return authError;
 */
export function requireDevAuth(request: NextRequest): NextResponse | null {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        console.error("[DevAuth] CRON_SECRET is not set — dev routes are disabled");
        return NextResponse.json(
            { error: "Dev routes disabled: server not properly configured" },
            { status: 503 }
        );
    }

    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null; // authorized
}

/**
 * Verifies a cron/internal secret — denies ALL requests when secret is unset.
 * This is stricter than the dev auth guard and used for production pipelines.
 */
export function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Cron] CRON_SECRET is not set — denying request for security");
        return false;
    }

    return authHeader === `Bearer ${cronSecret}`;
}
