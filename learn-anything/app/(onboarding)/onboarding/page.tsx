"use client"

import { Button } from '@/components/ui/button';
import { Session } from '@supabase/supabase-js';

type OnboardingProps = {
    userSession: Session | null;
}

const handleSampleUserCreation = async (token: string | undefined) => {
    const response = await fetch(`http://localhost:8000/sample_hit`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )

    console.log(response)
}

export const Onboarding = ({ userSession }: OnboardingProps) => {

    return (
        <div className='flex flex-col gap-4'>
            Onboarding start for {userSession?.user.email}
            <Button onClick={() => { handleSampleUserCreation(userSession?.access_token) }}>
                Start
            </Button>
        </div>
    )
}