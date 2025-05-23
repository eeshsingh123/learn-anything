import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(new URL(next, request.url))
        }
    }
    // Redirect to login on error or no code
    return NextResponse.redirect(new URL("/login", request.url));
}