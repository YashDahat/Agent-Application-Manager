import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PdfUploadDialogProps {
    name: string;
    onSave: (file: File | null) => void;
    icon?: React.ReactNode;
}

export function PdfUploadDialog(props: PdfUploadDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [open, setOpen] = useState(false); // Controls dialog visibility
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        if (file.type === "application/pdf") {
            setSelectedFile(file);
        } else {
            alert("Only PDF files are allowed.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFile(file);
        }
        event.target.value = ""; // reset input value
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleCancel = () => {
        setSelectedFile(null);
    };

    const handleSave = () => {
        if (selectedFile) {
            props.onSave(selectedFile);
            setOpen(false);          // ✅ Close dialog
            setSelectedFile(null);   // Optionally clear file
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    {props.icon} {props.name}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Resume (PDF)</DialogTitle>
                </DialogHeader>

                <div
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
                        isDragging ? "bg-muted" : ""
                    }`}
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <p className="text-sm text-muted-foreground">
                        Drag and drop your PDF here, or click to upload.
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {selectedFile && (
                    <div className="mt-4 flex items-center justify-between border rounded-md p-2">
                        <span className="truncate">{selectedFile.name}</span>
                        <Button variant="ghost" size="icon" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <DialogFooter className="mt-4">
                    <Button onClick={handleSave} disabled={!selectedFile}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

