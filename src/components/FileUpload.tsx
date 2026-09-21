import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function FileUpload({
  onFilesAccepted,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  title = 'Drop PDF files here',
  subtitle = 'or click to browse',
  icon,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`drop-zone px-4 py-6 text-center cursor-pointer transition-all ${
        isDragActive ? 'drag-over border-primary-500 bg-primary-50 scale-[1.01]' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
        <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          {icon || <Upload className="w-5 h-5 text-primary-600" />}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 leading-tight">
            {isDragActive ? 'Drop files here...' : title}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <FileText className="w-3 h-3" />
          <span>Processed locally in your browser</span>
        </div>
      </div>
    </div>
  );
}