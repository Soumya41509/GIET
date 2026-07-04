import React, { useCallback, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '../../utils/cn'
import { GlassButton } from './GlassButton'

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void
    maxFiles?: number
    accept?: string
    className?: string
}

const FileUploader: React.FC<FileUploaderProps> = ({
    onFilesSelected,
    maxFiles = 5,
    accept = 'image/*,.pdf,.doc,.docx',
    className,
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const droppedFiles = Array.from(e.dataTransfer.files)
            handleFiles(droppedFiles)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            handleFiles(selectedFiles)
        }
    }

    const handleFiles = (newFiles: File[]) => {
        const updatedFiles = [...files, ...newFiles].slice(0, maxFiles)
        setFiles(updatedFiles)
        onFilesSelected(updatedFiles)
    }

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index)
        setFiles(updatedFiles)
        onFilesSelected(updatedFiles)
    }

    return (
        <div className={cn('w-full space-y-4', className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/20 p-8 text-center transition-all',
                    isDragging
                        ? 'border-cyan-400 bg-cyan-50/30'
                        : 'hover:border-cyan-300 hover:bg-white/30'
                )}
            >
                <input
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFileInput}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100/50 text-cyan-600 mb-3">
                    <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-teal-900">
                    Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    SVG, PNG, JPG or PDF (max {maxFiles} files)
                </p>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-white/40 bg-white/30 p-2 backdrop-blur-sm"
                        >
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100/50 text-cyan-600">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                    <p className="truncate text-sm font-medium text-slate-700">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <GlassButton
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 text-slate-500 hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </GlassButton>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export { FileUploader }
