import React, { useState } from 'react';
import { Download, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import storageEncryptionService from '../services/storageEncryptionService';
import DownloadReceipt from './DownloadReceipt';

interface SecureFileDownloadProps {
    shareToken: string;
    onDownloadSuccess?: (fileName: string) => void;
    onDownloadError?: (error: Error) => void;
}

export const SecureFileDownload: React.FC<SecureFileDownloadProps> = ({
    shareToken,
    onDownloadSuccess,
    onDownloadError,
}) => {
    const [passphrase, setPassphrase] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [downloadedFileName, setDownloadedFileName] = useState('');
    const [downloadReceipt, setDownloadReceipt] = useState<{
        fileName: string;
        fileSize: number;
        downloadTime: Date;
        shareToken: string;
        originalHash?: string;
    } | null>(null);

    const handleDownload = async () => {
        if (!passphrase.trim()) {
            setError('Please enter the decryption passphrase');
            return;
        }

        setDownloading(true);
        setError(null);
        setSuccess(false);
        setProgress(0);

        try {
            const result = await storageEncryptionService.downloadEncryptedFile(
                shareToken,
                passphrase,
                {
                    onProgress: (stage, percent) => {
                        setProgressStage(stage);
                        setProgress(Math.round(percent));
                    },
                }
            );

            if (!result.success || !result.blob || !result.fileName) {
                throw result.error || new Error('Download failed');
            }

            // Trigger download
            const url = URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Show receipt
            setDownloadReceipt({
                fileName: result.fileName,
                fileSize: result.blob.size,
                downloadTime: new Date(),
                shareToken: shareToken,
                originalHash: result.originalHash,
            });

            setSuccess(true);
            setDownloadedFileName(result.fileName);
            setPassphrase('');
            onDownloadSuccess?.(result.fileName);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Download failed';
            setError(errorMsg);
            onDownloadError?.(err instanceof Error ? err : new Error(errorMsg));
        } finally {
            setDownloading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !downloading) {
            handleDownload();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700">
            {downloadReceipt && (
                <DownloadReceipt
                    fileName={downloadReceipt.fileName}
                    fileSize={downloadReceipt.fileSize}
                    downloadTime={downloadReceipt.downloadTime}
                    shareToken={downloadReceipt.shareToken}
                    originalHash={downloadReceipt.originalHash}
                />
            )}

            <div className="flex items-center gap-3 mb-6">
                <Download className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Decrypt & Download</h2>
            </div>

            {/* Passphrase Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Decryption Passphrase
                </label>
                <div className="relative">
                    <input
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter the passphrase provided by the sender"
                        disabled={downloading}
                        className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                        {showPassphrase ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Progress */}
            {downloading && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">{progressStage}</span>
                        <span className="text-sm font-medium text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-blue-400 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-300 text-sm font-medium">Decryption Failed</p>
                        <p className="text-red-300 text-xs mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded flex gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-blue-300 text-sm font-medium">Download Complete!</p>
                        <p className="text-blue-300 text-xs mt-1">
                            File: <span className="font-mono">{downloadedFileName}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Download Button */}
            <button
                onClick={handleDownload}
                disabled={!passphrase.trim() || downloading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition flex items-center justify-center gap-2"
            >
                <Lock className="w-4 h-4" />
                {downloading ? 'Decrypting...' : 'Decrypt & Download'}
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded text-xs text-slate-300 space-y-2">
                <p>
                    <span className="font-medium">🔒 End-to-End Encrypted:</span> Your file is decrypted only in your browser
                </p>
                <p>
                    <span className="font-medium">✓ Integrity Verified:</span> File authenticity is checked before decryption
                </p>
                <p>
                    <span className="font-medium">⏱️ Time-Limited:</span> This link will expire after the set duration
                </p>
            </div>
        </div>
    );
};

export default SecureFileDownload;
