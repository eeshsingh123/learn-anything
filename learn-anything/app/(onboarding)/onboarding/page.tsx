"use client"

import { useState } from 'react';

import { Session, User } from '@supabase/supabase-js';

import { OnboardingStep1 } from '@/components/onboarding/step1';
import { OnboardingStep2 } from '@/components/onboarding/step2';

import { Button } from '@/components/ui/button';

type OnboardingProps = {
    user: User
    userSession: Session | null;  // this is only for sending the token to the backend for validation
}

export const Onboarding = ({ user, userSession }: OnboardingProps) => {

    const [step, setStep] = useState<number>(1)

    const handleNext = () => {
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setStep(prev => prev - 1)
    }

    const userName = user.user_metadata.full_name;

    return (
        <div className='flex flex-col max-w-4xl w-full'>
            {step > 1 && (
                <div className='flex justify-start m-1'>
                    <Button onClick={handleBack} variant={'secondary'}>Back</Button>
                </div>
            )}
            {step === 1 && <OnboardingStep1 userSession={userSession} userName={userName} onNext={handleNext} />}
            {step === 2 && <OnboardingStep2 />}
        </div>
    )
}