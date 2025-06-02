import { useState, useEffect } from 'react';
import { File, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyFiles, deleteFile } from '../../lib/firebaseStorage';
import FileUploader from './FileUploader';
import Button from '../ui/Button';
import Card from '../ui/Card';

// Define UserRole enum since it's used but not imported
enum UserRole {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  USER = 'USER'
}

interface CompanyFile {
  name: string;
  size: number;
  created_at: string;
  url: string;
  path: string;
}

const CompanyFileManager = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.companyId) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      const companyFiles = await getCompanyFiles(user!.companyId!);
      setFiles(companyFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await deleteFile(path);
      await loadFiles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6">Company Files</h2>

        {user?.role === UserRole.COMPANY_ADMIN && (
          <div className="mb-8">
            <FileUploader onUploadComplete={() => loadFiles()} />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <File className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>

                {user?.role === UserRole.COMPANY_ADMIN && (
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => handleDelete(file.path)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CompanyFileManager;