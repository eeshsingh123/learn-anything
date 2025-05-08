"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Session } from "@supabase/supabase-js"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage
} from "@/components/ui/form"

type OnboardingStep1Props = {
    userSession: Session | null;
    userName: string;
    onNext: (workspaceId: string) => void;
}

const FormSchema = z.object({
    topic: z
        .string()
        .min(3, { message: "Project topic must be atleast 10 characters." })
        .max(100, { message: "Project topic must not be more than 100 characters." })
})

export const OnboardingStep1 = ({ userSession, userName, onNext }: OnboardingStep1Props) => {

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    const handleTopicSubmit = async (data: z.infer<typeof FormSchema>) => {
        try {
            const response = await fetch('http://localhost:8000/workspaces/create_workspace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userSession?.access_token}`,
                },
                body: JSON.stringify({
                    topic: data.topic,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create workspace');
            }

            const result = await response.json();
            const workspaceId = result.data.workspace_id;

            onNext(workspaceId);
        } catch (error) {
            console.error('Error creating workspace:', error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleTopicSubmit)} className="w-full flex flex-col gap-4 border-2 p-6 rounded-md">
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-start">
                            <span className="text-3xl font-medium pb-2">Hello, {userName}</span>
                            <FormLabel className="mb-2 text-lg">Let&apos;s start with creating a workspace</FormLabel>
                            <FormControl className="w-full">
                                <Textarea
                                    placeholder="Name your project"
                                    className="resize-none w-full"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 mt-1">
                    <Button variant="outline" type="button" onClick={() => form.reset()}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Create Workspace
                    </Button>
                </div>
            </form>
        </Form>
    )

}