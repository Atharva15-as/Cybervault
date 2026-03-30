import React, { useState, useRef } from 'react';
import { Upload, Lock, Unlock, AlertCircle, CheckCircle, Eye, EyeOff, Key, Shield } from 'lucide-react';
import fernetEncryptionService from '../services/fernetEncryptionService';

/**
 * Fernet-Style Encryption Tool
 * Based on: https://github.com/Vikranth3140/Encryption-Decryption-Tool
 * 
 * Features:
 * - Password-based encryption (PBKDF2 + AES-256-CBC + HMAC)
 * - Stored key encryption (Random key + AES-256-CBC + HMAC)
 * - Password strength validation
 * - HMAC integrity verification
 */

type EncryptionMode = 'password' | 'stored-key';
type OperationMode = 'encrypt' | 'decrypt';

export const FernetEncryptionTool: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [operationMode, setOperationMode] = useState<OperationMode>('encrypt');
    const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>('password');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [storedKey, setStoredKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [result, setResult] = useState<{
        fileName: string;
        key?: string;
        hmac?: string;
    } | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        feedback: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toEncFileName = (name: string) => {
        const lastDotIndex = name.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0;
        const baseName = hasExtension ? name.slice(0, lastDotIndex) : name;
        return `${baseName}.enc`;
    };

    const stripEncExtension = (name: string) => {
        return name.toLowerCase().endsWith('.enc') ? name.slice(0, -4) : name;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSuccess(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (value && operationMode === 'encrypt') {
            const strength = fernetEncryptionService.checkPasswordStrength(value);
            setPasswordStrength({
                score: strength.score,
                feedback: strength.feedback,
            });
        } else {
            setPasswordStrength(null);
        }
    };

    const handleEncrypt = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (encryptionMode === 'password') {
            if (!password.trim()) {
                setError('Please enter a password');
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            const strength = fernetEncryptionService.checkPasswordStrength(password);
            if (!strength.isStrong) {
                setError(`Weak password: ${strength.feedback.join(', ')}`);
                return;
            }
        }

        setProcessing(true);
        setError(null);
        setSuccess(false);
        setProgress(0);

        try {
            if (encryptionMode === 'password') {
                // Password-based encryption
                const encrypted = await fernetEncryptionService.encryptFile(
                    file,
                    password,
                    (stage, percent) => {
                        setProgressStage(stage);
                        setProgress(Math.round(percent));
                    }
                );

                // Create encrypted file
                const encryptedBlob = new Blob([encrypted.encryptedData], {
                    type: 'application/octet-stream',
                });

                // Download encrypted file
                const url = URL.createObjectURL(encryptedBlob);
                const link = document.createElement('a');
                link.href = url;
                const encryptedName = toEncFileName(file.name);
                link.download = encryptedName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setResult({
                    fileName: encryptedName,
                    hmac: fernetEncryptionService.bufferToHex(encrypted.hmac),
                });
            } else {
                // Stored key encryption
                const encrypted = await fernetEncryptionService.encryptFileWithStoredKey(
                    file,
                    (stage, percent) => {
                        setProgressStage(stage);
                        setProgress(Math.round(percent));
                    }
                );

                // Create encrypted file
                const encryptedBlob = new Blob([encrypted.encryptedData], {
                    type: 'application/octet-stream',
                });

                // Download encrypted file
                const url = URL.createObjectURL(encryptedBlob);
                const link = document.createElement('a');
                link.href = url;
                const encryptedName = toEncFileName(file.name);
                link.download = encryptedName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setResult({
                    fileName: encryptedName,
                    key: encrypted.key,
                });
            }

            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Encryption failed';
            setError(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleDecrypt = async () => {
        if (!file) {
            setError('Please select an encrypted file');
            return;
        }

        if (encryptionMode === 'password') {
            if (!password.trim()) {
                setError('Please enter the password');
                return;
            }
        } else {
            if (!storedKey.trim()) {
                setError('Please enter the stored key');
                return;
            }
        }

        setProcessing(true);
        setError(null);
        setSuccess(false);
        setProgress(0);

        try {
            let decrypted;

            if (encryptionMode === 'password') {
                // Password-based decryption
                decrypted = await fernetEncryptionService.decryptFile(
                    file,
                    password,
                    (stage, percent) => {
                        setProgressStage(stage);
                        setProgress(Math.round(percent));
                    }
                );
            } else {
                // Stored key decryption
                decrypted = await fernetEncryptionService.decryptFileWithStoredKey(
                    file,
                    storedKey,
                    (stage, percent) => {
                        setProgressStage(stage);
                        setProgress(Math.round(percent));
                    }
                );
            }

            // Create decrypted file
            const decryptedBlob = new Blob([decrypted.decryptedData], {
                type: 'application/octet-stream',
            });

            // Download decrypted file
            const originalName = stripEncExtension(file.name);
            const url = URL.createObjectURL(decryptedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${originalName}.decrypted`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setResult({
                fileName: `${originalName}.decrypted`,
            });

            setSuccess(true);
            setPassword('');
            setStoredKey('');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Decryption failed';
            setError(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-purple-400" />
                        <h1 className="text-4xl font-bold text-white">Fernet Encryption Tool</h1>
                    </div>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Encrypt and decrypt files using Fernet-style encryption with AES-256-CBC, PBKDF2 key derivation, and HMAC integrity verification.
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                        Based on:{' '}
                        <a
                            href="https://github.com/Vikranth3140/Encryption-Decryption-Tool"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline"
                        >
                            Vikranth3140/Encryption-Decryption-Tool
                        </a>
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
                    {/* Operation Mode */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Operation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setOperationMode('encrypt');
                                    setError(null);
                                    setSuccess(false);
                                }}
                                className={`px-6 py-3 rounded border-2 transition flex items-center justify-center gap-2 ${
                                    operationMode === 'encrypt'
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                <Lock className="w-4 h-4" />
                                Encrypt
                            </button>
                            <button
                                onClick={() => {
                                    setOperationMode('decrypt');
                                    setError(null);
                                    setSuccess(false);
                                }}
                                className={`px-6 py-3 rounded border-2 transition flex items-center justify-center gap-2 ${
                                    operationMode === 'decrypt'
                                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                <Unlock className="w-4 h-4" />
                                Decrypt
                            </button>
                        </div>
                    </div>

                    {/* Encryption Mode */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Encryption Method
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setEncryptionMode('password');
                                    setError(null);
                                }}
                                className={`px-6 py-3 rounded border-2 transition flex items-center justify-center gap-2 ${
                                    encryptionMode === 'password'
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                <Lock className="w-4 h-4" />
                                Password-Based
                            </button>
                            <button
                                onClick={() => {
                                    setEncryptionMode('stored-key');
                                    setError(null);
                                }}
                                className={`px-6 py-3 rounded border-2 transition flex items-center justify-center gap-2 ${
                                    encryptionMode === 'stored-key'
                                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                <Key className="w-4 h-4" />
                                Stored Key
                            </button>
                        </div>
                    </div>

                    {/* File Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Select File
                        </label>
                        <div
                            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-300">
                                {file ? file.name : 'Click to select file'}
                            </p>
                            {file && (
                                <p className="text-xs text-slate-400 mt-2">
                                    {fernetEncryptionService.formatFileSize(file.size)}
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

                    {/* Password Input (for password-based mode) */}
                    {encryptionMode === 'password' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter password"
                                        disabled={processing}
                                        className="w-full px-4 py-3 pr-10 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength */}
                                {passwordStrength && operationMode === 'encrypt' && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 bg-slate-600 rounded h-2">
                                                <div
                                                    className={`h-full rounded transition-all ${
                                                        passwordStrength.score >= 80
                                                            ? 'bg-emerald-500'
                                                            : passwordStrength.score >= 60
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${passwordStrength.score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {passwordStrength.score}%
                                            </span>
                                        </div>
                                        {passwordStrength.feedback.length > 0 && (
                                            <ul className="text-xs text-slate-400 space-y-1">
                                                {passwordStrength.feedback.map((f, i) => (
                                                    <li key={i}>• {f}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {operationMode === 'encrypt' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        disabled={processing}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stored Key Input (for stored-key mode and decrypt) */}
                    {encryptionMode === 'stored-key' && operationMode === 'decrypt' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Stored Key
                            </label>
                            <textarea
                                value={storedKey}
                                onChange={(e) => setStoredKey(e.target.value)}
                                placeholder="Paste the stored key here"
                                disabled={processing}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                            />
                        </div>
                    )}

                    {/* Progress */}
                    {processing && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-300">{progressStage}</span>
                                <span className="text-sm font-medium text-purple-400">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-purple-400 h-2 rounded-full transition-all"
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
                                <p className="text-red-300 text-sm font-medium">Error</p>
                                <p className="text-red-300 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {success && result && (
                        <div className="p-4 bg-emerald-900/20 border border-emerald-700 rounded">
                            <div className="flex gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-emerald-300 text-sm font-medium">
                                        {operationMode === 'encrypt' ? 'Encryption' : 'Decryption'} Successful!
                                    </p>
                                    <p className="text-emerald-300 text-xs mt-1">
                                        File: <span className="font-mono">{result.fileName}</span>
                                    </p>
                                </div>
                            </div>

                            {result.key && (
                                <div className="mt-4 p-3 bg-slate-700/50 rounded">
                                    <p className="text-xs font-medium text-amber-300 mb-2">
                                        🔑 Stored Key (Save this securely!)
                                    </p>
                                    <textarea
                                        value={result.key}
                                        readOnly
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                                    />
                                    <p className="text-xs text-amber-400 mt-2">
                                        ⚠️ Keep this key secure. You'll need it to decrypt the file.
                                    </p>
                                </div>
                            )}

                            {result.hmac && (
                                <div className="mt-4 p-3 bg-slate-700/50 rounded">
                                    <p className="text-xs font-medium text-slate-300 mb-2">
                                        HMAC Checksum
                                    </p>
                                    <code className="text-xs text-slate-400 font-mono break-all">
                                        {result.hmac}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={operationMode === 'encrypt' ? handleEncrypt : handleDecrypt}
                        disabled={!file || processing}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition flex items-center justify-center gap-2"
                    >
                        {operationMode === 'encrypt' ? (
                            <>
                                <Lock className="w-4 h-4" />
                                {processing ? 'Encrypting...' : 'Encrypt File'}
                            </>
                        ) : (
                            <>
                                <Unlock className="w-4 h-4" />
                                {processing ? 'Decrypting...' : 'Decrypt File'}
                            </>
                        )}
                    </button>
                </div>

                {/* Information Sections */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    {/* Features */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-400" />
                            Security Features
                        </h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>✓ AES-256-CBC encryption</li>
                            <li>✓ PBKDF2 key derivation (100,000 iterations)</li>
                            <li>✓ HMAC-SHA256 integrity verification</li>
                            <li>✓ Password strength validation</li>
                            <li>✓ Salt-based key derivation</li>
                            <li>✓ Client-side processing</li>
                        </ul>
                    </div>

                    {/* Methods */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-amber-400" />
                            Encryption Methods
                        </h3>
                        <div className="text-sm text-slate-300 space-y-3">
                            <div>
                                <p className="font-medium text-emerald-400">Password-Based</p>
                                <p className="text-xs text-slate-400">
                                    Uses PBKDF2 to derive key from password
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-amber-400">Stored Key</p>
                                <p className="text-xs text-slate-400">
                                    Generates random key for encryption
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="mt-8 p-6 bg-amber-900/20 border border-amber-700 rounded-lg">
                    <h3 className="text-sm font-semibold text-amber-300 mb-3">⚠️ Important Notes</h3>
                    <ul className="text-sm text-amber-200 space-y-2">
                        <li>• Keep your password or stored key secure</li>
                        <li>• If you lose the password/key, files cannot be recovered</li>
                        <li>• HMAC checksum verifies file integrity</li>
                        <li>• All processing happens in your browser</li>
                        <li>• Encrypted files have .enc extension</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default FernetEncryptionTool;
