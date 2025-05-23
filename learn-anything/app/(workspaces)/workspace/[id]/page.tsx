"use client"

import dynamic from "next/dynamic"

import { SidebarLeft } from "@/components/sidebar/sidebar-left"
import { SidebarRight } from "@/components/sidebar/sidebar-right"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import "@blocknote/core/fonts/inter.css"


const Editor = dynamic(() => import("@/components/editor/editor-main"), { ssr: false })

export default function Page() {
    return (
        <>
            <SidebarProvider>
                <SidebarLeft />
                <SidebarInset>
                    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
                        <div className="flex flex-1 items-center gap-2 px-3">
                            <SidebarTrigger />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="line-clamp-1">
                                            Project Management & Task Tracking
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <div className="mx-auto w-full">
                            <Editor />
                        </div>
                    </div>
                </SidebarInset>
                <SidebarRight />
            </SidebarProvider>
        </>
    )
}
