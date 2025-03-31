"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client"; // client side supabase
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";


export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        try {
            setLoading(true)

            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/callback`,
                },
            })
            if (error) throw error
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
                {/* SVG background element */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 800 600"
                    fill="none"
                >
                    <circle cx="400" cy="300" r="500" fill="url(#gradient1)" opacity="0.3" />
                    <defs>
                        <radialGradient id="gradient1" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                </svg>

                {/* Card */}
                <Card className="z-10 w-[350px] bg-white bg-opacity-90 dark:bg-neutral-800 shadow-lg rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-gray-800 dark:text-gray-100">Welcome</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Log in to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <Button
                                variant="outline"
                                className="w-full bg-white bg-opacity-80 hover:bg-opacity-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                                onClick={handleLogin}
                                disabled={loading}
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.84 0-5.28-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.31-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign in with Google
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}