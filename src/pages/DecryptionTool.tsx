import React, { useState, useRef } from 'react';
import { Upload, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Loader, FileText } from 'lucide-react';
import { encryptionService } from '../services/encryptionService';
import storageEncryptionService from '../services/storageEncryptionService';
import { supabase } from '../lib/supabase';
import DownloadReceipt from '../components/DownloadReceipt';

interface DecryptionResult {
    fileName: string;
    fileSize: number;
    originalHash: string;
    decryptedBlob: Blob;
    downloadTime: Date;
    shareToken?: string;
}

export const DecryptionTool: React.FC = () => {
    const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
    const [passkey, setPasskey] = useState('');
    const [showPasskey, setShowPasskey] = useState(false);
    const [decrypting, setDecrypting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [decryptionResult, setDecryptionResult] = useState<DecryptionResult | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [databaseMatch, setDatabaseMatch] = useState<{
        found: boolean;
        fileName?: string;
        uploadedBy?: string;
        uploadedAt?: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check if file has .enc extension
            if (!selectedFile.name.endsWith('.enc')) {
                setError('Please select an encrypted file (.enc extension)');
                return;
            }
            setEncryptedFile(selectedFile);
            setError(null);
            setSuccess(false);
            setDatabaseMatch(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (!droppedFile.name.endsWith('.enc')) {
                setError('Please drop an encrypted file (.enc extension)');
                return;
            }
            setEncryptedFile(droppedFile);
            setError(null);
            setSuccess(false);
            setDatabaseMatch(null);
        }
    };

    const verifyHashInDatabase = async (hash: string): Promise<{
        found: boolean;
        fileName?: string;
        uploadedBy?: string;
        uploadedAt?: string;
        shareToken?: string;
    }> => {
        try {
            setProgressStage('Verifying file in database...');
            setProgress(70);

            // Query database for matching encrypted hash
            const { data, error: dbError } = await supabase
                .from('shared_files')
                .select('file_name, user_id, created_at, share_token, encrypted_hash')
                .eq('encrypted_hash', hash)
                .single();

            if (dbError || !data) {
                return { found: false };
            }

            // Get user info if available
            let uploadedBy = 'Unknown User';
            try {
                const { data: userData } = await supabase.auth.admin.getUserById(data.user_id);
                if (userData?.user?.email) {
                    uploadedBy = userData.user.email;
                }
            } catch {
                // User info not available
            }

            return {
                found: true,
                fileName: data.file_name,
                uploadedBy: uploadedBy,
                uploadedAt: new Date(data.created_at).toLocaleString(),
                shareToken: data.share_token,
            };
        } catch (err) {
            console.error('Database verification error:', err);
            return { found: false };
        }
    };

    const handleDecrypt = async () => {
        if (!encryptedFile) {
            setError('Please select an encrypted file');
            return;
        }

        if (!passkey.trim()) {
            setError('Please enter the passkey');
            return;
        }

        setDecrypting(true);
        setError(null);
        setSuccess(false);
        setProgress(0);
        setDatabaseMatch(null);

        try {
            setProgressStage('Reading encrypted file...');
            setProgress(10);

            // Read encrypted file
            const encryptedBuffer = await encryptedFile.arrayBuffer();

            if (encryptedBuffer.byteLength < 28) {
                throw new Error('Invalid encrypted file. File is too small.');
            }

            // Extract salt and IV
            setProgressStage('Extracting cryptographic parameters...');
            setProgress(20);
            const bytes = new Uint8Array(encryptedBuffer);
            const salt = bytes.slice(0, 16);
            const iv = bytes.slice(16, 28);
            const cipherText = bytes.slice(28);

            // Derive key using passkey
            setProgressStage('Deriving decryption key...');
            setProgress(30);
            const { key } = await encryptionService.deriveKeyFromPassphrase(passkey, salt);

            // Decrypt
            setProgressStage('Decrypting file...');
            setProgress(50);
            let decryptedBuffer: ArrayBuffer;
            try {
                decryptedBuffer = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv as any },
                    key,
                    cipherText.buffer
                );
            } catch {
                throw new Error('Decryption failed. Wrong passkey or corrupted file.');
            }

            // Parse metadata
            setProgressStage('Extracting file metadata...');
            setProgress(65);
            const decrypted = new Uint8Array(decryptedBuffer);
            const metadataLength = new Uint32Array(decrypted.slice(0, 4).buffer)[0];
            const metadataBytes = decrypted.slice(4, 4 + metadataLength);
            const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
            const fileData = decrypted.slice(4 + metadataLength);

            // Verify integrity
            setProgressStage('Verifying file integrity...');
            setProgress(75);
            const computedHash = await encryptionService.computeHash(fileData.buffer);
            const originalHash = metadata.originalHash || '';

            if (originalHash && computedHash !== originalHash) {
                throw new Error('File integrity verification failed! The file may have been tampered with.');
            }

            // Compute encrypted file hash for database lookup
            setProgressStage('Computing encrypted file hash...');
            setProgress(80);
            const encryptedHash = await encryptionService.computeHash(encryptedBuffer);

            // Verify in database
            const dbMatch = await verifyHashInDatabase(encryptedHash);
            setDatabaseMatch(dbMatch);

            setProgressStage('Finalizing decryption...');
            setProgress(90);

            // Create result
            const decryptedBlob = new Blob([fileData], {
                type: metadata.type || 'application/octet-stream',
            });

            setDecryptionResult({
                fileName: metadata.name,
                fileSize: metadata.size,
                originalHash: originalHash,
                decryptedBlob: decryptedBlob,
                downloadTime: new Date(),
                shareToken: dbMatch.shareToken,
            });

            setSuccess(true);
            setProgress(100);
            setProgressStage('Decryption complete!');

            // Auto-download
            setTimeout(() => {
                const url = URL.createObjectURL(decryptedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = metadata.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Show receipt
                setShowReceipt(true);
            }, 500);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Decryption failed';
            setError(errorMsg);
        } finally {
            setDecrypting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !decrypting && encryptedFile && passkey) {
            handleDecrypt();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-12 px-4">
            {showReceipt && decryptionResult && (
                <DownloadReceipt
                    fileName={decryptionResult.fileName}
                    fileSize={decryptionResult.fileSize}
                    downloadTime={decryptionResult.downloadTime}
                    shareToken={decryptionResult.shareToken}
                    originalHash={decryptionResult.originalHash}
                />
            )}

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Lock className="w-8 h-8 text-blue-400" />
                        <h1 className="text-4xl font-bold text-white">Decryption Tool</h1>
                    </div>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Decrypt your encrypted files (.enc) using your passkey. Supports files encrypted with AES-256-GCM encryption.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
                    {/* File Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Select Encrypted File (.enc)
                        </label>
                        <div
                            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-300">
                                {encryptedFile ? encryptedFile.name : 'Click to select or drag and drop encrypted file'}
                            </p>
                            {encryptedFile && (
                                <p className="text-xs text-slate-400 mt-2">
                                    {storageEncryptionService.formatFileSize(encryptedFile.size)}
                                </p>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept=".enc"
                            className="hidden"
                        />
                    </div>

                    {/* Passkey Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Decryption Passkey
                        </label>
                        <div className="relative">
                            <input
                                type={showPasskey ? 'text' : 'password'}
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter the passkey used to encrypt the file"
                                disabled={decrypting}
                                className="w-full px-4 py-3 pr-10 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasskey(!showPasskey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                                {showPasskey ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    {decrypting && (
                        <div>
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
                        <div className="p-4 bg-red-900/20 border border-red-700 rounded flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-300 text-sm font-medium">Decryption Failed</p>
                                <p className="text-red-300 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {success && decryptionResult && (
                        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
                            <div className="flex gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-blue-300 text-sm font-medium">Decryption Successful!</p>
                                    <p className="text-blue-300 text-xs mt-1">
                                        File: <span className="font-mono">{decryptionResult.fileName}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Database Match Info */}
                            {databaseMatch && (
                                <div className="mt-4 p-3 bg-slate-700/50 rounded text-xs space-y-1">
                                    {databaseMatch.found ? (
                                        <>
                                            <p className="text-emerald-400 font-medium">✓ File verified in database</p>
                                            <p className="text-slate-300">
                                                Original Name: <span className="font-mono">{databaseMatch.fileName}</span>
                                            </p>
                                            <p className="text-slate-300">
                                                Uploaded By: <span className="font-mono">{databaseMatch.uploadedBy}</span>
                                            </p>
                                            <p className="text-slate-300">
                                                Uploaded At: <span className="font-mono">{databaseMatch.uploadedAt}</span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-amber-400">
                                            ⚠️ File not found in database (may be locally encrypted)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Decrypt Button */}
                    <button
                        onClick={handleDecrypt}
                        disabled={!encryptedFile || !passkey.trim() || decrypting}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition flex items-center justify-center gap-2"
                    >
                        {decrypting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Decrypting...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Decrypt File
                            </>
                        )}
                    </button>
                </div>

                {/* Information Sections */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    {/* How It Works */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            How It Works
                        </h3>
                        <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                            <li>Select your encrypted file (.enc)</li>
                            <li>Enter the passkey used for encryption</li>
                            <li>Click "Decrypt File"</li>
                            <li>File is decrypted in your browser</li>
                            <li>Original file downloads automatically</li>
                            <li>Receipt shows verification details</li>
                        </ol>
                    </div>

                    {/* Security Information */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-400" />
                            Security Features
                        </h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>✓ AES-256-GCM encryption</li>
                            <li>✓ SHA-256 integrity verification</li>
                            <li>✓ PBKDF2 key derivation</li>
                            <li>✓ Client-side decryption only</li>
                            <li>✓ Database hash verification</li>
                            <li>✓ Original extension restored</li>
                        </ul>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="mt-8 p-6 bg-amber-900/20 border border-amber-700 rounded-lg">
                    <h3 className="text-sm font-semibold text-amber-300 mb-3">⚠️ Important Notes</h3>
                    <ul className="text-sm text-amber-200 space-y-2">
                        <li>• Keep your passkey secure and never share it</li>
                        <li>• Decryption happens entirely in your browser</li>
                        <li>• Your passkey is never sent to the server</li>
                        <li>• File integrity is verified using SHA-256</li>
                        <li>• If passkey is wrong, decryption will fail</li>
                        <li>• Encrypted files have .enc extension</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DecryptionTool;
