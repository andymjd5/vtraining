import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadFileToFirebase } from '../../lib/firebaseStorage';
import Button from '../ui/Button';

interface FileUploaderProps {
  onUploadComplete?: (fileUrl: string) => void;
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.companyId) return;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOC, DOCX, XLS, XLSX files are allowed');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const { url } = await uploadFileToFirebase(
        file, 
        user.companyId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      onUploadComplete?.(url);
      setUploadProgress(100);
      
      // Reset the input
      event.target.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Create a synthetic event to reuse the existing logic
      const syntheticEvent = {
        target: { files: [file], value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label 
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, DOC, DOCX, XLS, XLSX up to 10MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm">Uploading... {Math.round(uploadProgress)}%</span>
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-md">
          <span className="text-sm">{error}</span>
          <Button
            variant="text"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;