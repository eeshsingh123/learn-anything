"use client"

import { useState, useEffect } from "react"
import { User, Session } from '@supabase/supabase-js';
import Link from "next/link";

import { createClient } from "@/lib/supabase/client"
import { Onboarding } from "@/app/(onboarding)/onboarding/page";

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
        <div className="flex flex-col justify-center items-center min-h-screen">
            <main className="w-full mx-auto py-8 px-4">
                {user ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Onboarding user={user} userSession={userSession} />
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
