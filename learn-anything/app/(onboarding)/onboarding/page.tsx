"use client"

import { useState } from 'react';

import { Session } from '@supabase/supabase-js';

import { OnboardingStep1 } from '@/components/onboarding/step1';
import { OnboardingStep2 } from '@/components/onboarding/step2';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

type OnboardingState = {
    workspaceId: string | null;
    currentStep: number;
    userSession: Session | null;
    userName: string;
}

export const OnboardingFlow = ({ userSession, userName }: { userSession: Session | null; userName: string }) => {
    const [state, setState] = useState<OnboardingState>({
        workspaceId: null,
        currentStep: 1,
        userSession,
        userName
    });

    const handleStep1Complete = (workspaceId: string) => {
        setState(prev => ({
            ...prev,
            workspaceId,
            currentStep: 2
        }));
    };

    const handleBack = () => {
        setState(prev => ({
            ...prev,
            currentStep: prev.currentStep - 1
        }));
    }

    return (
        <div className='flex flex-col max-w-4xl w-full'>
            {state.currentStep > 1 && (
                <div className='flex justify-start mb-12'>
                    <Button onClick={handleBack} variant={'secondary'} className='flex justify-center'>
                        <ChevronLeft />
                        Back
                    </Button>
                </div>
            )}
            {state.currentStep === 1 && (
                <OnboardingStep1
                    userSession={state.userSession}
                    userName={state.userName}
                    onNext={handleStep1Complete}
                />
            )}
            {state.currentStep === 2 && (
                <OnboardingStep2
                    userSession={state.userSession}
                    workspaceId={state.workspaceId!}
                    userName={state.userName}
                    onNext={() => setState(prev => ({ ...prev, currentStep: 3 }))}
                />
            )}
        </div>
    );
};