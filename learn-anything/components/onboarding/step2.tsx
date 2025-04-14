/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useRef, type ChangeEvent, type DragEvent, useMemo } from "react"

import {
    UploadCloud,
    FileText,
    File,
    ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Cloud
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"


type FileWithPreview = {
    file: File
    id: string
    preview?: string
    progress?: number
}

export const OnboardingStep2 = () => {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const itemsPerPage = 8

    const totalPages = Math.max(1, Math.ceil(files.length / itemsPerPage))
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return files.slice(startIndex, startIndex + itemsPerPage)
    }, [files, currentPage, itemsPerPage])

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />
        if (file.type === "application/pdf") return <FileText className="h-6 w-6 text-red-500" />
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            return <FileText className="h-6 w-6 text-blue-700" />
        }
        if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            return <FileText className="h-6 w-6 text-green-600" />
        }
        if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
            return <FileText className="h-6 w-6 text-orange-600" />
        }

        return <File className="h-6 w-6 text-gray-500" />
    }

    const getFileTypeLabel = (file: File) => {
        if (file.type.startsWith("image/")) return "Image"

        if (file.type === "application/pdf") return "PDF"

        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            return "Document"
        }
        if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            return "Spreadsheet"
        }
        if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
            return "Powerpoint"
        }
        return "File"
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const processFiles = (fileList: FileList) => {
        const newFiles = Array.from(fileList).map((file) => {
            let preview = undefined
            if (file.type.startsWith("image/")) {
                preview = URL.createObjectURL(file)

            }
            return {
                file: file,
                id: Math.random().toString(36).substring(2, 9),
                preview,
                progress: 0
            }
        })

        setFiles((prevFiles) => [...prevFiles, ...newFiles])
        setCurrentPage(1)
    }

    const removeFile = (fileId: string) => {
        setFiles((prev) => {
            const filtered = prev.filter((file) => file.id !== fileId)
            const fileToRemove = prev.find((file) => file.id === fileId)
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview)
            }

            const totalPages = Math.ceil(filtered.length / itemsPerPage)
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages)
            }

            return filtered;
        })

    }

    // once the files are dropped, process them as filechange is handled
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files)
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files)
        }
    }

    const handleBrowseClick = () => {
        fileInputRef.current?.click()
    }

    const handleFilesUpload = async () => {
        if (files.length === 0) return

        setIsUploading(true)

        // send the files to the backed in parts and process the upload there
        console.log("Uploading files")
        return true
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-2">
            <div className={cn("border-2 border-dashed rounded-lg p-6 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25")}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}

            >
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <UploadCloud className={cn("h-12 w-12",
                        isDragging ? "text-primary" : "text-muted-foreground/50")} />
                    <div>
                        <p className="text-lg font-medium">Drag & drop files here</p>
                        <p className="text-sm text-muted-foreground">or click to browse from your device</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                    <Button onClick={handleBrowseClick} variant="outline" className="mt-2">
                        Browse Files
                    </Button>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {paginatedFiles.map((fileItem) => (
                            <Card key={fileItem.id} className="overflow-hidden p-0">
                                <CardContent className="p-0">
                                    <div className="flex flex-col p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-shrink-0">
                                                {fileItem.preview ? (
                                                    <div className="h-12 w-12 rounded overflow-hidden">
                                                        <img
                                                            src={fileItem.preview || "/placeholder.svg"}
                                                            alt={fileItem.file.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                        {getFileIcon(fileItem.file)}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => removeFile(fileItem.id)}
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove file</span>
                                            </Button>
                                        </div>
                                        <div className="flex-1 min-w-0 mt-2">
                                            <p className="text-sm text-start font-medium truncate">{fileItem.file.name}</p>
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <span>{getFileTypeLabel(fileItem.file)}</span>
                                                <Separator orientation="vertical" className="mx-2 min-h-[14px] " />
                                                <span>{(fileItem.file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(currentPage * itemsPerPage, files.length)} of {files.length} files
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm mx-2">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleFilesUpload} disabled={isUploading} className="gap-2">
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Cloud className="h-4 w-4" />
                                    Upload all {files.length} files
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

}