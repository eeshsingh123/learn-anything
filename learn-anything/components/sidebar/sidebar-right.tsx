"use client"

import * as React from "react"
import { useCallback, useState, useRef } from "react"

import {
    Sidebar,
    SidebarHeader,
} from "@/components/ui/sidebar"


// Constants for sidebar width constraints
const MIN_WIDTH = 250; // 250px minimum width
const MAX_WIDTH = 600; // 600px maximum width
const DEFAULT_WIDTH = 288; // 72 * 4 = 288px (default from w-72)

export function SidebarRight({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
    const handleMouseUpRef = useRef<(() => void) | null>(null);

    handleMouseMoveRef.current = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = document.body.clientWidth - e.clientX;
            setWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
        }
    };

    handleMouseUpRef.current = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (e: MouseEvent) => handleMouseMoveRef.current?.(e);
    const mouseUpHandler = () => handleMouseUpRef.current?.();

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }, []);

    return (
        <div className="relative flex" style={{ width: `${width}px` }}>
            <div
                className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-gray-300 transition-colors z-50"
                onMouseDown={startResizing}
                style={{
                    cursor: isResizing ? 'ew-resize' : undefined,
                    transform: 'translateX(-1px)'
                }}
            />
            <Sidebar
                className="sticky hidden lg:flex top-0 h-svh border-l w-full"
                collapsible="none"
                {...props}
            >
                <SidebarHeader>
                    <span>Chat</span>
                </SidebarHeader>
            </Sidebar>
        </div>
    )
}
