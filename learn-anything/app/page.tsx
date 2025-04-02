"use client"

import { useState, useEffect } from "react"
import { User, Session } from '@supabase/supabase-js';
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client"
import { Onboarding } from "@/app/(onboarding)/onboarding/page";

import { Button } from "@/components/ui/button";


export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [userSession, setUserSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
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

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push("/login")
        }
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                {user ? (
                    <div className="flex flex-col">
                        <h1>Welcome: {user.user_metadata.full_name}</h1>
                        <Button onClick={handleSignOut}>
                            Sign Out
                        </Button>
                        <Onboarding userSession={userSession} />
                    </div>
                ) : (
                    <Link href={"/login"}>
                        <Button>Login</Button>
                    </Link>
                )}
            </main>
        </div>
    );
}
