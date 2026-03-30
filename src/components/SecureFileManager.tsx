import React, { useState, useEffect } from 'react';
import { Trash2, Clock, Download, AlertCircle, Loader } from 'lucide-react';
import storageEncryptionService, { StorageFile } from '../services/storageEncryptionService';

interface SecureFileManagerProps {
    onFileDeleted?: (fileId: string) => void;
}

export const SecureFileManager: React.FC<SecureFileManagerProps> = ({ onFileDeleted }) => {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        setError(null);

        const result = await storageEncryptionService.getUserFiles();
        if (result.success && result.files) {
            setFiles(result.files);
        } else {
            setError(result.error?.message || 'Failed to load files');
        }

        setLoading(false);
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
        }

        setDeleting(fileId);
        const result = await storageEncryptionService.deleteFile(fileId);

        if (result.success) {
            setFiles(files.filter(f => f.id !== fileId));
            onFileDeleted?.(fileId);
        } else {
            setError(result.error?.message || 'Failed to delete file');
        }

        setDeleting(null);
    };

    const isExpired = (expiryDate: Date) => new Date() > expiryDate;

    const getStatusColor = (status: string, expired: boolean) => {
        if (expired) return 'text-red-400 bg-red-900/20';
        switch (status) {
            case 'safe':
                return 'text-emerald-400 bg-emerald-900/20';
            case 'warning':
                return 'text-yellow-400 bg-yellow-900/20';
            case 'danger':
                return 'text-red-400 bg-red-900/20';
            default:
                return 'text-slate-400 bg-slate-900/20';
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-center gap-3 text-slate-300">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Loading files...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">My Encrypted Files</h2>

            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {files.length === 0 ? (
                <div className="text-center py-12">
                    <Download className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No files uploaded yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">File Name</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">Size</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">Expires</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">Downloads</th>
                                <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => {
                                const expired = isExpired(file.expiryDate);
                                const statusLabel = expired ? 'Expired' : file.securityStatus;

                                return (
                                    <tr key={file.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                                        <td className="py-3 px-4 text-slate-200 truncate max-w-xs">
                                            {file.fileName}
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            {storageEncryptionService.formatFileSize(file.fileSize)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(file.securityStatus, expired)}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {file.expiryDate.toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">
                                            {file.maxDownloads > 0
                                                ? `${file.downloadCount}/${file.maxDownloads}`
                                                : file.downloadCount}
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                disabled={deleting === file.id}
                                                className="p-2 text-red-400 hover:bg-red-900/20 rounded transition disabled:opacity-50"
                                                title="Delete file"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary Stats */}
            {files.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-700/50 rounded">
                        <p className="text-xs text-slate-400 mb-1">Total Files</p>
                        <p className="text-2xl font-bold text-white">{files.length}</p>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded">
                        <p className="text-xs text-slate-400 mb-1">Total Size</p>
                        <p className="text-2xl font-bold text-white">
                            {storageEncryptionService.formatFileSize(
                                files.reduce((sum, f) => sum + f.fileSize, 0)
                            )}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded">
                        <p className="text-xs text-slate-400 mb-1">Total Downloads</p>
                        <p className="text-2xl font-bold text-white">
                            {files.reduce((sum, f) => sum + f.downloadCount, 0)}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded">
                        <p className="text-xs text-slate-400 mb-1">Active Files</p>
                        <p className="text-2xl font-bold text-white">
                            {files.filter(f => !isExpired(f.expiryDate)).length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecureFileManager;
