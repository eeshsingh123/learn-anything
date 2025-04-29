"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

export default function Editor() {
    // Create a new editor instance
    const editor = useCreateBlockNote({
        // Enable image upload
        uploadFile: async (file: File) => {
            // For now, we'll just create an object URL
            // In production, you should upload to your storage service
            const url = URL.createObjectURL(file);
            return url;
        },
    });

    return <BlockNoteView editor={editor} theme="light" />;
}
