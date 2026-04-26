import React, { useState, useRef } from 'react';
import { Upload, FileCheck, X, AlertCircle } from 'lucide-react';

interface DocumentUploadsProps {
  onFileChange: (field: string, file: File | null) => void;
  files: {
    pan_file: File | null;
    aadhaar_file: File | null;
    bank_statement_file: File | null;
  }
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Invalid file type. Allowed: PDF, JPG, PNG`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large. Max size: 5MB`;
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploads({ onFileChange, files }: DocumentUploadsProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(field);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const processFile = (file: File, field: string) => {
    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      return;
    }
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    onFileChange(field, file);
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, field);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, field);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleRemove = (e: React.MouseEvent, field: string) => {
    e.stopPropagation();
    onFileChange(field, null);
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const FileUploadBox = ({ title, subtitle, field }: { title: string; subtitle: string; field: string }) => {
    const currentFile = (files as any)[field] as File | null;
    const isDragging = dragOver === field;
    const hasError = !!errors[field];

    return (
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/50 mt-1">{subtitle}</p>
          </div>
          <div className="bg-white/10 text-white/70 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
            Required
          </div>
        </div>

        <div
          onDragOver={(e) => handleDragOver(e, field)}
          onDragEnter={(e) => handleDragOver(e, field)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, field)}
          onClick={() => !currentFile && inputRefs.current[field]?.click()}
          className={`
            relative w-full h-32 border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center
            ${currentFile
              ? 'border-green-500/40 bg-green-500/5 cursor-default'
              : isDragging
              ? 'border-white/60 bg-white/10 scale-[1.01] cursor-copy'
              : hasError
              ? 'border-red-500/40 bg-red-500/5 cursor-pointer'
              : 'border-white/20 bg-[#111] hover:border-white/40 hover:bg-[#151515] cursor-pointer'
            }
          `}
        >
          {currentFile ? (
            // ✅ File loaded state
            <div className="flex items-center gap-3 px-4 w-full">
              <FileCheck className="w-8 h-8 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-400 truncate">{currentFile.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{formatBytes(currentFile.size)}</p>
              </div>
              <button
                onClick={(e) => handleRemove(e, field)}
                className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-red-400/40 hover:bg-red-500/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
              </button>
            </div>
          ) : isDragging ? (
            // 🎯 Drag-over state
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <Upload className="w-7 h-7 text-white animate-bounce" />
              <p className="text-sm font-bold text-white tracking-wide">DROP TO UPLOAD</p>
            </div>
          ) : (
            // 📁 Default idle state
            <div className="flex flex-col items-center gap-2">
              <Upload className={`w-6 h-6 ${hasError ? 'text-red-400' : 'text-white/50'}`} />
              <p className="text-xs text-white/70">
                <span className="font-semibold text-white">Drag & drop</span> or{' '}
                <span className="underline text-white/70">click to browse</span>
              </p>
              <p className="text-[10px] text-white/40">PDF, JPG, PNG · Max 5 MB</p>
            </div>
          )}

          <input
            ref={(el) => { inputRefs.current[field] = el; }}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleInputChange(e, field)}
          />
        </div>

        {hasError && (
          <div className="flex items-center gap-2 mt-2 text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p className="text-[10px] font-semibold">{errors[field]}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-white">Required Documentation</h2>
        <p className="text-sm text-white/60">
          Drag and drop files directly onto each zone, or click to browse. Max 5 MB per file.
        </p>
      </div>

      <div className="space-y-6">
        <FileUploadBox
          title="Permanent Account Number (PAN)"
          subtitle="Company or Individual PAN card."
          field="pan_file"
        />
        <FileUploadBox
          title="Aadhaar Card"
          subtitle="Front and back of the Authorized Signatory's Aadhaar."
          field="aadhaar_file"
        />
        <FileUploadBox
          title="Bank Statement"
          subtitle="Latest 3 months statement or cancelled cheque."
          field="bank_statement_file"
        />
      </div>
    </div>
  );
}
