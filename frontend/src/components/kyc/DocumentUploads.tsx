import React from 'react';
import { Upload } from 'lucide-react';

interface DocumentUploadsProps {
  onFileChange: (field: string, file: File | null) => void;
  files: {
    pan_file: File | null;
    aadhaar_file: File | null;
    bank_statement_file: File | null;
  }
}

export default function DocumentUploads({ onFileChange, files }: DocumentUploadsProps) {
  const FileUploadBox = ({ title, subtitle, field }: { title: string, subtitle: string, field: string }) => (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/50 mt-1">{subtitle}</p>
        </div>
        <div className="bg-white/10 text-white/70 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
          Required
        </div>
      </div>
      
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 hover:border-white/40 bg-[#111] hover:bg-[#151515] transition-colors cursor-pointer rounded-sm relative">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-6 h-6 mb-3 text-white/70" />
          <p className="mb-1 text-xs text-white">
            <span className="font-semibold">Drag and drop file here, or click to browse</span>
          </p>
          <p className="text-[10px] text-white/50">
            Supported formats: JPEG, PNG, PDF. Max size: 5MB.
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileChange(field, e.target.files[0]);
            }
          }}
        />
        {(files as any)[field] && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-sm font-semibold text-green-400 border border-green-500/30">
            {(files as any)[field]?.name} uploaded
          </div>
        )}
      </label>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-white">Required Documentation</h2>
        <p className="text-sm text-white/60">Upload the following documents to verify your business identity. Ensure all text is legible.</p>
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
