/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useRef, useMemo, ChangeEvent, DragEvent } from "react"
import axios, { AxiosError, AxiosProgressEvent } from "axios"
import {
    UploadCloud,
    FileText,
    File,
    ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Cloud,
    AudioLines,
    Video,
    Table
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Session } from "@supabase/supabase-js"

interface FileWithPreview {
    file: File
    id: string
    preview?: string
    progress: number // Made non-optional with default 0
}

interface OnboardingStep2Props {
    userSession: Session | null;
    workspaceId: string;
    userName: string;
    onNext: () => void;
}

export const OnboardingStep2 = ({ userSession, workspaceId, onNext }: OnboardingStep2Props) => {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [urls, setUrls] = useState<string[]>([])
    const [newUrl, setNewUrl] = useState<string>("")
    const [isDragging, setIsDragging] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const itemsPerPage = 8

    const totalPages = Math.max(1, Math.ceil(files.length / itemsPerPage))
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return files.slice(startIndex, startIndex + itemsPerPage)
    }, [files, currentPage])

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />
        if (file.type === "application/pdf") return <FileText className="h-6 w-6 text-red-500" />
        if (file.type.includes("wordprocessingml.document")) return <FileText className="h-6 w-6 text-blue-700" />
        if (file.type.includes("presentationml.presentation")) return <FileText className="h-6 w-6 text-orange-600" />
        if (file.type === "text/plain") return <FileText className="h-6 w-6 text-gray-500" />
        if (file.type === "text/csv") return <Table className="h-6 w-6 text-green-600" />
        if (file.type.includes("spreadsheetml.sheet")) return <Table className="h-6 w-6 text-green-600" />
        if (file.type.startsWith("audio/")) return <AudioLines className="h-6 w-6 text-purple-500" />
        if (file.type.startsWith("video/")) return <Video className="h-6 w-6 text-red-600" />
        return <File className="h-6 w-6 text-gray-500" />
    }

    const getFileTypeLabel = (file: File) => {
        if (file.type.startsWith("image/")) return "Image"
        if (file.type === "application/pdf") return "PDF"
        if (file.type.includes("wordprocessingml.document")) return "Document"
        if (file.type.includes("presentationml.presentation")) return "Powerpoint"
        if (file.type === "text/plain") return "Text"
        if (file.type === "text/csv") return "CSV"
        if (file.type.includes("spreadsheetml.sheet")) return "Spreadsheet"
        if (file.type.startsWith("audio/")) return "Audio"
        if (file.type.startsWith("video/")) return "Video"
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
            let preview: string | undefined
            if (file.type.startsWith("image/")) {
                preview = URL.createObjectURL(file)
            }
            return {
                file,
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
            return filtered
        })
    }

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

    const handleFileUpload = async () => {
        if (files.length === 0 && urls.length === 0) {
            alert("Please select at least one file or add a URL.")
            return
        }

        setIsUploading(true)

        const maxFileSize = 100 * 1024 * 1024 // 100MB
        const invalidFiles = files.filter((fileItem) => fileItem.file.size > maxFileSize)
        if (invalidFiles.length > 0) {
            alert(`The following files exceed 100MB: ${invalidFiles.map((f) => f.file.name).join(", ")}`)
            setIsUploading(false)
            return
        }

        const formData = new FormData()
        files.forEach((fileItem) => {
            formData.append("files", fileItem.file)
        })
        formData.append("urls", JSON.stringify(urls))
        formData.append("workspace_id", workspaceId)

        try {
            const response = await axios.post("http://localhost:8000/workspaces/upload-files", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${userSession?.access_token}`,
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        files.forEach((fileItem) => {
                            setFiles((prev) =>
                                prev.map((f) =>
                                    f.file.name === fileItem.file.name ? { ...f, progress: percentCompleted } : f
                                )
                            )
                        })
                    }
                },
            })

            console.log("Upload response:", response.data)

            setFiles((prev) => {
                prev.forEach((fileItem) => {
                    if (fileItem.preview) {
                        URL.revokeObjectURL(fileItem.preview)
                    }
                })
                return []
            })
            setUrls([])
            setCurrentPage(1)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }

            onNext()
        } catch (error: unknown) {
            const errorMessage = error instanceof AxiosError
                ? error.response?.data?.detail || error.message
                : "An unexpected error occurred"
            alert(`Upload failed: ${errorMessage}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 border-2 rounded-md">
            <div className="mb-4">
                <div className="flex flex-col gap-2 mb-4">
                    <span className="text-2xl font-semibold mb-1">Add Sources</span>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-emerald-500" />
                            <FileText className="h-4 w-4 text-red-500" />
                            <AudioLines className="h-4 w-4 text-purple-500" />
                            <Video className="h-4 w-4 text-red-600" />
                            <Cloud className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="max-w-prose text-sm text-muted-foreground">
                            Import your documents, media, and web links to enhance AI responses with your personal knowledge base.
                        </span>
                    </div>
                </div>
                <label className="block text-sm font-medium mb-2">Add URL:</label>
                <div className="flex gap-2 justify-center items-center">
                    <input
                        type="text"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 border rounded p-2"
                    />
                    <Button
                        onClick={() => {
                            if (newUrl && /^https?:\/\/[^\s$.?#].[^\s]*$/.test(newUrl)) {
                                setUrls([...urls, newUrl])
                                setNewUrl("")
                            } else {
                                alert("Invalid URL")
                            }
                        }}
                    >
                        Add URL
                    </Button>
                </div>
                {urls.length > 0 && (
                    <ul className="mt-2">
                        {urls.map((url, index) => (
                            <li key={index} className="text-sm flex items-center">
                                {url}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                                    className="ml-2"
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <UploadCloud
                        className={cn("h-12 w-12", isDragging ? "text-primary" : "text-muted-foreground/50")}
                    />
                    <div>
                        <p className="text-lg font-medium">Drag & drop files here</p>
                        <p className="text-sm text-muted-foreground">or click to browse from your device</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xlsx,.mp3,.wav,.mp4"
                    />
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
                                                            src={fileItem.preview}
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
                                                disabled={isUploading}
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove file</span>
                                            </Button>
                                        </div>
                                        <div className="flex-1 min-w-0 mt-2">
                                            <p className="text-sm text-start font-medium truncate">{fileItem.file.name}</p>
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <span>{getFileTypeLabel(fileItem.file)}</span>
                                                <Separator orientation="vertical" className="mx-2 min-h-[14px]" />
                                                <span>{(fileItem.file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            {fileItem.progress > 0 && (
                                                <div className="mt-2">
                                                    <Progress value={fileItem.progress} className="h-2" />
                                                    <p className="text-xs text-muted-foreground mt-1 text-center">
                                                        {fileItem.progress}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

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
                        <Button onClick={handleFileUpload} disabled={isUploading} className="gap-2">
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Cloud className="h-4 w-4" />
                                    Upload all {files.length + urls.length} items
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}