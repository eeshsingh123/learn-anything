"use client"

import { useState, useEffect } from "react"
import { User, Session } from '@supabase/supabase-js';
import Link from "next/link";

import { createClient } from "@/lib/supabase/client"
import { OnboardingFlow } from "@/app/(onboarding)/onboarding/page";

import { Button } from "@/components/ui/button";


export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [userSession, setUserSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const { data: { user }, error } = await supabase.auth.getUser();
                const { data: { session } } = await supabase.auth.getSession();
                if (error) throw error;
                setUser(user)
                setUserSession(session)
            } catch (error) {
                console.log('Error fetching user:', error);
            }
            finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [supabase])

    if (loading) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    return (
        <div>
            <main>
                {user ? (
                    <div className="flex flex-col justify-center items-center min-h-screen">
                        <OnboardingFlow userName={user.user_metadata.full_name} userSession={userSession} />
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Link href={"/login"}>
                            <Button>Login</Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
