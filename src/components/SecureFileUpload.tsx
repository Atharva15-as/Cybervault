import React, { useState, useRef } from 'react';
import { Upload, Lock, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import storageEncryptionService from '../services/storageEncryptionService';
import { encryptionService } from '../services/encryptionService';

interface SecureFileUploadProps {
    onUploadSuccess?: (fileId: string, shareToken: string, passphrase: string) => void;
    onUploadError?: (error: Error) => void;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
    onUploadSuccess,
    onUploadError,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadedData, setUploadedData] = useState<{
        fileId: string;
        shareToken: string;
        shareUrl: string;
        passphrase: string;
    } | null>(null);
    const [expiryDuration, setExpiryDuration] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
    const [maxDownloads, setMaxDownloads] = useState(0);
    const [useCustomPassphrase, setUseCustomPassphrase] = useState(false);
    const [customPassphrase, setCustomPassphrase] = useState('');
    const [passphraseStrength, setPassphraseStrength] = useState<{
        score: number;
        label: string;
        color: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSuccess(false);
        }
    };

    const handlePassphraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomPassphrase(value);
        if (value) {
            const strength = encryptionService.estimateStrength(value);
            setPassphraseStrength(strength);
        } else {
            setPassphraseStrength(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);
        setProgress(0);

        try {
            const result = await storageEncryptionService.uploadEncryptedFile(file, {
                passphrase: useCustomPassphrase ? customPassphrase : undefined,
                expiryDuration,
                maxDownloads: maxDownloads > 0 ? maxDownloads : 0,
                onProgress: (stage, percent) => {
                    setProgressStage(stage);
                    setProgress(Math.round(percent));
                },
            });

            if (!result.success || !result.fileId) {
                throw result.error || new Error('Upload failed');
            }

            setSuccess(true);
            setUploadedData({
                fileId: result.fileId,
                shareToken: result.shareToken!,
                shareUrl: result.shareUrl!,
                passphrase: result.passphrase!,
            });

            onUploadSuccess?.(result.fileId, result.shareToken!, result.passphrase!);

            // Reset form
            setFile(null);
            setCustomPassphrase('');
            setPassphraseStrength(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMsg);
            onUploadError?.(err instanceof Error ? err : new Error(errorMsg));
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Secure File Upload</h2>
            </div>

            {/* File Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    Select File to Encrypt
                </label>
                <div
                    className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-300">
                        {file ? file.name : 'Click to select file or drag and drop'}
                    </p>
                    {file && (
                        <p className="text-xs text-slate-400 mt-2">
                            {storageEncryptionService.formatFileSize(file.size)}
                        </p>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Expiry Duration */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Link Expiry Duration
                </label>
                <select
                    value={expiryDuration}
                    onChange={(e) => setExpiryDuration(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-400"
                >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                </select>
            </div>

            {/* Max Downloads */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Downloads (0 = Unlimited)
                </label>
                <input
                    type="number"
                    min="0"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-400"
                />
            </div>

            {/* Custom Passphrase */}
            <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <input
                        type="checkbox"
                        checked={useCustomPassphrase}
                        onChange={(e) => setUseCustomPassphrase(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Use Custom Passphrase
                </label>
                {useCustomPassphrase && (
                    <div>
                        <input
                            type="password"
                            value={customPassphrase}
                            onChange={handlePassphraseChange}
                            placeholder="Enter a strong passphrase"
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-400 mb-2"
                        />
                        {passphraseStrength && (
                            <div className="text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 bg-slate-600 rounded h-2">
                                        <div
                                            className={`h-full rounded transition-all ${passphraseStrength.color}`}
                                            style={{ width: `${passphraseStrength.score}%` }}
                                        />
                                    </div>
                                    <span className={passphraseStrength.color}>
                                        {passphraseStrength.label}
                                    </span>
                                </div>
                                {passphraseStrength.score < 100 && (
                                    <ul className="text-slate-400 space-y-1">
                                        {encryptionService.estimateStrength(customPassphrase).suggestions.map((s, i) => (
                                            <li key={i}>• {s}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Progress */}
            {uploading && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">{progressStage}</span>
                        <span className="text-sm font-medium text-emerald-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-emerald-400 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Success */}
            {success && uploadedData && (
                <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-700 rounded">
                    <div className="flex gap-3 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-300 text-sm">File uploaded and encrypted successfully!</p>
                    </div>

                    {/* Share URL */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Share URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={uploadedData.shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300"
                            />
                            <button
                                onClick={() => copyToClipboard(uploadedData.shareUrl)}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-xs font-medium flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Passphrase */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Decryption Passphrase
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={uploadedData.passphrase}
                                readOnly
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                            />
                            <button
                                onClick={() => copyToClipboard(uploadedData.passphrase)}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-xs font-medium flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Share this passphrase securely with recipients
                        </p>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition flex items-center justify-center gap-2"
            >
                <Lock className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Encrypt & Upload'}
            </button>
        </div>
    );
};

export default SecureFileUpload;
