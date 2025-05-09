"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Session } from '@supabase/supabase-js';

import { OnboardingStep1 } from '@/components/onboarding/step1';
import { OnboardingStep2 } from '@/components/onboarding/step2';


// Only store non-sensitive information
type OnboardingStorageState = {
    workspaceId: string | null;
    currentStep: number;
}

// Full state type including sensitive info that won't be stored
type OnboardingState = OnboardingStorageState & {
    userSession: Session | null;
    userName: string;
}

const ONBOARDING_STORAGE_KEY = 'onboarding_state';
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export const OnboardingFlow = ({ userSession, userName }: { userSession: Session | null; userName: string }) => {
    const router = useRouter()
    const [state, setState] = useState<OnboardingState>(() => {
        const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        const parsedState: OnboardingStorageState = savedState
            ? JSON.parse(savedState)
            : {
                workspaceId: null,
                currentStep: 1,
            };

        return {
            ...parsedState,
            userSession,
            userName
        };
    });

    useEffect(() => {
        const storageState: OnboardingStorageState = {
            workspaceId: state.workspaceId,
            currentStep: state.currentStep
        };
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storageState));
    }, [state.workspaceId, state.currentStep]);

    useEffect(() => {
        if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true") {
            router.push(`/workspace`)
        }
    }, [router])

    const handleStep1Complete = (workspaceId: string) => {
        setState(prev => ({
            ...prev,
            workspaceId,
            currentStep: 2
        }));
    };

    const handleOnboardingComplete = () => {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        router.push(`/workspace/${state.workspaceId}`)
    }

    return (
        <div className='flex flex-col max-w-4xl w-full'>
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
                    onNext={handleOnboardingComplete}
                />
            )}
        </div>
    );
};

export default OnboardingFlow;