/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useRef, useMemo, ChangeEvent, DragEvent, useEffect, useCallback } from "react"
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
    Table,
    Folder,
    CloudDownload,
    Unplug,
    ExternalLink,
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
    progress: number
}

interface DriveFileWithPreview {
    id: string
    name: string
    mimeType: string
    progress: number
}

interface OnboardingStep2Props {
    userSession: Session | null;
    workspaceId: string;
    userName: string;
    onNext: () => void;
}

const SELECTED_DRIVE_FILES_STORAGE_KEY = 'onboarding_selected_drive_files';
const SELECTED_URLS_STORAGE_KEY = 'onboarding_selected_urls';
const DRIVE_CONNECTION_STATUS_KEY = 'drive_connection_status';

export const OnboardingStep2 = ({ userSession, workspaceId, onNext }: OnboardingStep2Props) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [urls, setUrls] = useState<string[]>(() => {
        const savedUrls = localStorage.getItem(SELECTED_URLS_STORAGE_KEY);
        return savedUrls ? JSON.parse(savedUrls) : [];
    });

    const [selectedDriveFiles, setSelectedDriveFiles] = useState<DriveFileWithPreview[]>(() => {
        const savedDriveFiles = localStorage.getItem(SELECTED_DRIVE_FILES_STORAGE_KEY);
        return savedDriveFiles ? JSON.parse(savedDriveFiles) : [];
    });

    const [isDriveConnected, setIsDriveConnected] = useState(() => {
        return localStorage.getItem(DRIVE_CONNECTION_STATUS_KEY) === 'true';
    });

    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Google Picker state
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const [newUrl, setNewUrl] = useState<string>("")
    const [isDragging, setIsDragging] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const itemsPerPage = 8

    // Load Google Picker API
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('picker', () => {
                setPickerApiLoaded(true);
            });
        };
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Fetch access token for Google Picker
    const fetchAccessToken = useCallback(async () => {
        try {
            const response = await axios.get("http://localhost:8000/onboarding/auth/google/picker-token", {
                headers: {
                    "Authorization": `Bearer ${userSession?.access_token}`,
                },
            });
            setAccessToken(response.data.access_token);
        } catch (error) {
            setConnectionError('Failed to fetch Google Drive access token');
            console.error(error);
        }
    }, [userSession]);

    // Add useEffect to fetch token on mount and when userSession changes
    useEffect(() => {
        if (userSession?.access_token) {
            fetchAccessToken();
        }
    }, [userSession, fetchAccessToken]);

    // Open Google Picker
    const openGooglePicker = useCallback(() => {
        if (!pickerApiLoaded || !accessToken) {
            setConnectionError('Google Picker not ready or not authenticated');
            return;
        }

        const picker = new window.google.picker.PickerBuilder()
            .addView(
                new window.google.picker.DocsView()
                    .setIncludeFolders(true)
                    .setMimeTypes(
                        'application/pdf,image/jpeg,image/png,video/mp4,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,audio/mpeg,audio/wav'
                    )
            )
            .setOAuthToken(accessToken)
            .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '')
            .setOrigin(window.location.origin)
            .setCallback((data) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const selectedFiles = data.docs.map((doc) => ({
                        id: doc.id,
                        name: doc.name,
                        mimeType: doc.mimeType,
                        progress: 0,
                    }));
                    setSelectedDriveFiles((prev) => {
                        const newFiles = selectedFiles.filter(
                            (newFile) => !prev.some((f) => f.id === newFile.id)
                        );
                        return [...prev, ...newFiles];
                    });
                }
            })
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .build();

        picker.setVisible(true);
    }, [pickerApiLoaded, accessToken]);

    useEffect(() => {
        localStorage.setItem(SELECTED_URLS_STORAGE_KEY, JSON.stringify(urls));
    }, [urls]);

    useEffect(() => {
        localStorage.setItem(SELECTED_DRIVE_FILES_STORAGE_KEY, JSON.stringify(selectedDriveFiles));
    }, [selectedDriveFiles]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const connectionStatus = urlParams.get('connection_status');
        const error = urlParams.get('error');

        if (connectionStatus === 'success') {
            setIsDriveConnected(true);
            setConnectionError(null);
            localStorage.setItem(DRIVE_CONNECTION_STATUS_KEY, 'true');
            fetchAccessToken();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (connectionStatus === 'error' && error) {
            setIsDriveConnected(false);
            setConnectionError(decodeURIComponent(error));
            localStorage.setItem(DRIVE_CONNECTION_STATUS_KEY, 'false');
        }
    }, [fetchAccessToken]);

    const totalPages = Math.max(1, Math.ceil((files.length + selectedDriveFiles.length) / itemsPerPage))
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const allItems = [
            ...files.map((f) => ({ type: "local" as const, item: f })),
            ...selectedDriveFiles.map((f) => ({ type: "drive" as const, item: f }))
        ]
        return allItems.slice(startIndex, startIndex + itemsPerPage)
    }, [files, selectedDriveFiles, currentPage])

    const getFileIcon = (type: string, file?: File, mimeType?: string) => {
        if (type === "drive" && mimeType) {
            if (mimeType.includes("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />
            if (mimeType === "application/pdf") return <FileText className="h-6 w-6 text-red-500" />
            if (mimeType.includes("wordprocessingml.document")) return <FileText className="h-6 w-6 text-blue-700" />
            if (mimeType.includes("presentationml.presentation")) return <FileText className="h-6 w-6 text-orange-600" />
            if (mimeType === "text/plain") return <FileText className="h-6 w-6 text-gray-500" />
            if (mimeType === "text/csv") return <Table className="h-6 w-6 text-green-600" />
            if (mimeType.includes("spreadsheetml.sheet")) return <Table className="h-6 w-6 text-green-600" />
            if (mimeType.includes("audio/")) return <AudioLines className="h-6 w-6 text-purple-500" />
            if (mimeType.includes("video/")) return <Video className="h-6 w-6 text-red-600" />
            if (mimeType.includes("folder")) return <Folder className="h-6 w-6 text-yellow-500" />
        }
        if (type === "local" && file) {
            if (file.type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />
            if (file.type === "application/pdf") return <FileText className="h-6 w-6 text-red-500" />
            if (file.type.includes("wordprocessingml.document")) return <FileText className="h-6 w-6 text-blue-700" />
            if (file.type.includes("presentationml.presentation")) return <FileText className="h-6 w-6 text-orange-600" />
            if (file.type === "text/plain") return <FileText className="h-6 w-6 text-gray-500" />
            if (file.type === "text/csv") return <Table className="h-6 w-6 text-green-600" />
            if (file.type.includes("spreadsheetml.sheet")) return <Table className="h-6 w-6 text-green-600" />
            if (file.type.startsWith("audio/")) return <AudioLines className="h-6 w-6 text-purple-500" />
            if (file.type.startsWith("video/")) return <Video className="h-6 w-6 text-red-600" />
        }
        return <File className="h-6 w-6 text-gray-500" />
    }

    const getFileTypeLabel = (type: string, file?: File, mimeType?: string) => {
        if (type === "drive" && mimeType) {
            if (mimeType.includes("image/")) return "Image"
            if (mimeType === "application/pdf") return "PDF"
            if (mimeType.includes("wordprocessingml.document")) return "Document"
            if (mimeType.includes("presentationml.presentation")) return "Powerpoint"
            if (mimeType === "text/plain") return "Text"
            if (mimeType === "text/csv") return "CSV"
            if (mimeType.includes("spreadsheetml.sheet")) return "Spreadsheet"
            if (mimeType.includes("audio/")) return "Audio"
            if (mimeType.includes("video/")) return "Video"
            if (mimeType.includes("folder")) return "Folder"
        }
        if (type === "local" && file) {
            if (file.type.startsWith("image/")) return "Image"
            if (file.type === "application/pdf") return "PDF"
            if (file.type.includes("wordprocessingml.document")) return "Document"
            if (file.type.includes("presentationml.presentation")) return "Powerpoint"
            if (file.type === "text/plain") return "Text"
            if (file.type === "text/csv") return "CSV"
            if (file.type.includes("spreadsheetml.sheet")) return "Spreadsheet"
            if (file.type.startsWith("audio/")) return "Audio"
            if (file.type.startsWith("video/")) return "Video"
        }
        return "File"
    }

    const handleConnectDrive = async () => {
        try {
            setConnectionError(null);
            const response = await axios.get("http://localhost:8000/onboarding/auth/google");
            window.location.href = response.data.authorization_url;
        } catch (error) {
            setIsDriveConnected(false);
            setConnectionError('Failed to initiate Google Drive authentication');
            localStorage.setItem(DRIVE_CONNECTION_STATUS_KEY, 'false');
            console.error(error);
        }
    };

    const removeDriveFile = (fileId: string) => {
        setSelectedDriveFiles((prev) => prev.filter((f) => f.id !== fileId))
        const totalPages = Math.ceil((files.length + selectedDriveFiles.length - 1) / itemsPerPage)
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages)
        }
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
            const totalPages = Math.ceil((filtered.length + selectedDriveFiles.length) / itemsPerPage)
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages)
            }
            // Reset file input to allow reselection of the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
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
            // Reset the input value to allow reselection of the same file
            e.target.value = '';
        }
    }

    const handleBrowseClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = async () => {
        if (files.length === 0 && urls.length === 0 && selectedDriveFiles.length === 0) {
            alert("Please select at least one file, add a URL, or choose Google Drive files.")
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
        formData.append("drive_file_ids", JSON.stringify(selectedDriveFiles.map((f) => f.id)))
        formData.append("workspace_id", workspaceId)

        try {
            const response = await axios.post("http://localhost:8000/onboarding/upload-files", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${userSession?.access_token}`,
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        setFiles((prev) =>
                            prev.map((f) => ({ ...f, progress: percentCompleted }))
                        )
                        setSelectedDriveFiles((prev) =>
                            prev.map((f) => ({ ...f, progress: percentCompleted }))
                        )
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
            setSelectedDriveFiles([])
            setCurrentPage(1)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }

            localStorage.removeItem(SELECTED_URLS_STORAGE_KEY);
            localStorage.removeItem(SELECTED_DRIVE_FILES_STORAGE_KEY);

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
                        placeholder="https://medium.com/teradata/build-a-data-analyst-ai-agent-from-scratch"
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
                            <li key={index} className="text-sm p-1 flex items-center w-fit border-1 bg-secondary rounded-md">
                                <div className="flex gap-2 justify-center items-center">
                                    <ExternalLink className="ml-2 w-4 h-4" />
                                    <a href={url} target="_blank">{url}</a>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                                        className="ml-2"
                                        disabled={isUploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
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
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xlsx,.mp3,.wav,.mp4,.jpg,.jpeg,.png"
                    />
                    <div className="flex gap-4 justify-center items-end">
                        <Button onClick={handleBrowseClick} variant="outline" className="mt-2">
                            Browse Files
                        </Button>

                        {!isDriveConnected ? (
                            <Button
                                onClick={handleConnectDrive}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Unplug className="h-4 w-4" />
                                Connect Google Drive
                            </Button>
                        ) : (
                            <Button
                                onClick={openGooglePicker}
                                className="gap-2"
                                disabled={isUploading || !pickerApiLoaded || !accessToken}
                            >
                                <CloudDownload className="h-4 w-4" />
                                Select Drive Files
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {(files.length > 0 || selectedDriveFiles.length > 0 || urls.length > 0) && (
                <div className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {paginatedItems.map(({ type, item }) => (
                            <Card key={type === "local" ? (item as FileWithPreview).id : (item as DriveFileWithPreview).id} className="overflow-hidden p-0">
                                <CardContent className="p-0">
                                    <div className="flex flex-col p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-shrink-0">
                                                {type === "local" && (item as FileWithPreview).preview ? (
                                                    <div className="h-12 w-12 rounded overflow-hidden">
                                                        <img
                                                            src={(item as FileWithPreview).preview}
                                                            alt={(item as FileWithPreview).file.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                        {getFileIcon(
                                                            type,
                                                            type === "local" ? (item as FileWithPreview).file : undefined,
                                                            type === "drive" ? (item as DriveFileWithPreview).mimeType : undefined
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => type === "local" ? removeFile((item as FileWithPreview).id) : removeDriveFile((item as DriveFileWithPreview).id)}
                                                disabled={isUploading}
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove file</span>
                                            </Button>
                                        </div>
                                        <div className="flex-1 min-w-0 mt-2">
                                            <p className="text-sm text-start font-medium truncate">
                                                {type === "local" ? (item as FileWithPreview).file.name : (item as DriveFileWithPreview).name}
                                            </p>
                                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                <span>{getFileTypeLabel(
                                                    type,
                                                    type === "local" ? (item as FileWithPreview).file : undefined,
                                                    type === "drive" ? (item as DriveFileWithPreview).mimeType : undefined
                                                )}</span>
                                                {type === "local" && (
                                                    <>
                                                        <Separator orientation="vertical" className="mx-2 min-h-[14px]" />
                                                        <span>{((item as FileWithPreview).file.size / 1024).toFixed(1)} KB</span>
                                                    </>
                                                )}
                                            </div>
                                            {item.progress > 0 && (
                                                <div className="mt-2">
                                                    <Progress value={item.progress} className="h-2" />
                                                    <p className="text-xs text-muted-foreground mt-1 text-center">
                                                        {item.progress}%
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
                                {Math.min(currentPage * itemsPerPage, files.length + selectedDriveFiles.length)} of {files.length + selectedDriveFiles.length} files
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
                                    Upload all {files.length + urls.length + selectedDriveFiles.length} items
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {connectionError && (
                <div className="text-sm text-red-500 mt-2">
                    {connectionError}
                    <Button
                        variant="link"
                        className="text-red-500 underline ml-2"
                        onClick={() => {
                            setConnectionError(null);
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    )
}