"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadPopupProps {
  onSuccess: (file: File) => void;
  onClose: () => void;
}

export default function UploadPopup({ onSuccess, onClose }: UploadPopupProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: false,
  });

  const handleUpload = useCallback(() => {
    if (!file) return;
    onSuccess(file);
    onClose();
  }, [file, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Upload File</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          {file ? (
            <p className="mt-2 text-sm text-gray-600">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : isDragActive ? (
            <p className="mt-2 text-sm text-gray-600">Drop the file here ...</p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop a file here, or click to select
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          Make sure to upload high-quality images for the best results.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={handleUpload} disabled={!file}>
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
