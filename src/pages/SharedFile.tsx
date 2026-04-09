import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, Download, Clock, Shield, AlertCircle, Eye, EyeOff, Hash, FileIcon, ArrowLeft, ShieldCheck, KeyRound, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatTimeRemaining } from '../utils/crypto';
import { supabase } from '../lib/supabase';
import storageEncryptionService from '../services/storageEncryptionService';

// Interface for shared file data
interface SharedFileData {
    id: string;
    name: string;
    size: string;
    hash: string;
    pinHash: string;
    expiryDate: Date;
    uploadDate: string;
    downloadCount: number;
    encryptedHash?: string;
    storagePath?: string;
    linkPasswordHash?: string | null;
}

function toFriendlyDecryptError(message: string): string {
    const value = message.toLowerCase();
    if (value.includes('expired')) return 'This share link has expired. Ask the sender for a new link.';
    if (value.includes('download limit')) return 'This file has reached its download limit. Contact the sender to increase the limit.';
    if (value.includes('integrity check failed') || value.includes('tampered')) return 'The encrypted file failed integrity verification and may be corrupted.';
    if (value.includes('unsupported format')) return 'Unsupported encrypted file format. Ensure this file was encrypted using CyberVault.';
    if (value.includes('decrypt') || value.includes('passphrase') || value.includes('wrong')) return 'Incorrect passphrase or link password. Verify both and try again.';
    if (value.includes('not found') || value.includes('deactivated')) return 'This file is unavailable or has been removed by the sender.';
    return 'Unable to decrypt this file right now. Please retry or contact the sender.';
}

export default function SharedFile() {
    const { token } = useParams<{ token: string }>();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [fileData, setFileData] = useState<SharedFileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [passphrase, setPassphrase] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [passphraseError, setPassphraseError] = useState<string | null>(null);
    const [linkPassword, setLinkPassword] = useState('');
    const [showLinkPassword, setShowLinkPassword] = useState(false);

    // Decryption state
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptProgress, setDecryptProgress] = useState('');
    const [decryptPercent, setDecryptPercent] = useState(0);
    const [decryptedFile, setDecryptedFile] = useState<{ blob: Blob; fileName: string; fileSize: number } | null>(null);
    const [integrityStatus, setIntegrityStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

    // Brute-force protection
    const [pinAttempts, setPinAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const MAX_PIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 30000; // 30 seconds

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        const fetchFileData = async () => {
            setLoading(true);

            if (!token) {
                setError('Invalid share link');
                setLoading(false);
                return;
            }

            try {
                // Only fetch METADATA from Supabase by share token
                const { data: fileRecord, error: dbError } = await supabase
                    .from('shared_files')
                    .select('*')
                    .eq('share_token', token)
                    .eq('is_active', true)
                    .single();

                if (dbError || !fileRecord) {
                    setError('File not found or link expired');
                } else {
                    // Check expiry
                    if (new Date(fileRecord.expiry_date) < new Date()) {
                        setError('This share link has expired');
                    } else {
                        setFileData({
                            id: fileRecord.id,
                            name: fileRecord.file_name,
                            size: fileRecord.file_size,
                            hash: fileRecord.file_hash,
                            pinHash: fileRecord.pin_hash,
                            expiryDate: new Date(fileRecord.expiry_date),
                            uploadDate: fileRecord.created_at?.split('T')[0] || 'Unknown',
                            downloadCount: fileRecord.download_count || 0,
                            encryptedHash: fileRecord.encrypted_hash,
                            storagePath: fileRecord.storage_path,
                            linkPasswordHash: fileRecord.link_password_hash,
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching file metadata:', err);
                setError('An unexpected error occurred while looking up the file');
            }

            setLoading(false);
        };

        fetchFileData();
    }, [token]);

    const handlePassphraseChange = (value: string) => {
        setPassphrase(value);
        setPassphraseError(null);
    };

    const handleDecrypt = async () => {
        // Brute force protection/lockout logic
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setPassphraseError(`Too many attempts. Please wait ${remainingSec} seconds.`);
            return;
        }

        if (lockoutUntil && Date.now() >= lockoutUntil) {
            setLockoutUntil(null);
            setPinAttempts(0);
        }

        if (!fileData || passphrase.length < 1) {
            setPassphraseError('Please enter the decryption passphrase');
            return;
        }

        if (fileData.linkPasswordHash) {
            if (!linkPassword.trim()) {
                setPassphraseError('This link requires an additional link password');
                return;
            }

            const isLinkPasswordValid = await storageEncryptionService.verifyPassword(
                linkPassword.trim(),
                fileData.linkPasswordHash
            );

            if (!isLinkPasswordValid) {
                const newAttempts = pinAttempts + 1;
                setPinAttempts(newAttempts);
                setIntegrityStatus('failed');
                if (newAttempts >= MAX_PIN_ATTEMPTS) {
                    setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
                    setPassphraseError('Too many failed attempts. Locked out for 30 seconds.');
                    setPassphrase('');
                    setLinkPassword('');
                } else {
                    setPassphraseError(`Invalid link password. ${MAX_PIN_ATTEMPTS - newAttempts} attempt(s) remaining.`);
                }
                return;
            }
        }

        setIsDecrypting(true);
        setDecryptPercent(0);
        setDecryptProgress('Preparing secure decryption...');

        try {
            if (!token) {
                throw new Error('Invalid share link');
            }

            const result = await storageEncryptionService.downloadEncryptedFile(token, passphrase, {
                onProgress: (stage, percent) => {
                    setDecryptProgress(stage);
                    setDecryptPercent(Math.round(percent));
                },
            });

            if (!result.success || !result.blob || !result.fileName) {
                throw result.error || new Error('Failed to decrypt file');
            }

            setDecryptPercent(90);
            setDecryptProgress('Verifying decrypted data...');
            setDecryptedFile({
                blob: result.blob,
                fileName: result.fileName,
                fileSize: result.blob.size,
            });

            setDecryptPercent(100);
            setDecryptProgress('File ready!');
            setIntegrityStatus('verified');
            setPinAttempts(0);

        } catch (err) {
            const newAttempts = pinAttempts + 1;
            setPinAttempts(newAttempts);
            setIntegrityStatus('failed');
            const friendlyMessage = toFriendlyDecryptError((err as Error).message);

            if (newAttempts >= MAX_PIN_ATTEMPTS) {
                setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
                setPassphraseError(`Too many failed attempts. Locked out for 30 seconds.`);
                setPassphrase('');
            } else {
                setPassphraseError(`${friendlyMessage} ${MAX_PIN_ATTEMPTS - newAttempts} attempt(s) remaining.`);
            }
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleDownload = () => {
        if (!decryptedFile) return;

        const url = URL.createObjectURL(decryptedFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = decryptedFile.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setDecryptedFile(null);
        setPassphrase('');
        setIntegrityStatus('pending');
        setDecryptPercent(0);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Shield className="h-8 w-8 text-primary-500" />
                    </div>
                    <p className={textMuted}>Loading secure file...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>Access Denied</h2>
                    <p className={`${textMuted} mb-6`}>{error}</p>
                    <Link to="/" className="btn-primary inline-flex">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // Success - file found
    if (fileData) {
        const timeRemaining = formatTimeRemaining(fileData.expiryDate);

        return (
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="glass-card p-8 max-w-lg w-full">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                            {decryptedFile ? (
                                <ShieldCheck className="h-10 w-10 text-green-500" />
                            ) : (
                                <Lock className="h-10 w-10 text-primary-500" />
                            )}
                        </div>
                        <h2 className={`text-xl font-bold mb-1 ${textPrimary}`}>
                            {decryptedFile ? 'File Decrypted!' : 'Encrypted File'}
                        </h2>
                        <p className={`text-sm ${textMuted}`}>{fileData.name}</p>
                    </div>

                    {/* File Info */}
                    <div className={`p-4 rounded-xl mb-5 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${textMuted}`}>
                                <FileIcon className="h-3 w-3" /> {fileData.size}
                            </span>
                            <span className={`flex items-center gap-1 ${textMuted}`}>
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">{fileData.hash.slice(0, 12)}...</span>
                            </span>
                            <span className={`flex items-center gap-1 ${timeRemaining === 'Expired' ? 'text-red-500' : 'text-green-500'}`}>
                                <Clock className="h-3 w-3" />
                                {timeRemaining === 'Expired' ? 'Expired' : `${timeRemaining} left`}
                            </span>
                            <span className={`flex items-center gap-1 ${textMuted}`}>
                                <Download className="h-3 w-3" />
                                {fileData.downloadCount} downloads
                            </span>
                        </div>
                    </div>

                    {/* Decryption Flow */}
                    {isDecrypting ? (
                        /* Decryption Progress */
                        <div className="py-6 text-center">
                            <div className="relative w-20 h-20 mx-auto mb-4">
                                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" stroke={isDark ? '#334155' : '#E4F3EC'} strokeWidth="6" fill="none" />
                                    <circle cx="40" cy="40" r="34" stroke="#10b981" strokeWidth="6" fill="none"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - decryptPercent / 100)}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-300" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <KeyRound className="h-6 w-6 text-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <p className={`text-sm font-medium mb-1 ${textPrimary}`}>{decryptProgress}</p>
                            <p className={`text-xs ${textMuted}`}>{decryptPercent}% complete</p>

                            {/* Decryption flow diagram */}
                            <div className={`mt-4 p-3 rounded-xl text-xs ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`flex items-center gap-1 ${decryptPercent >= 10 ? 'text-emerald-500' : textMuted}`}>
                                        <Download className="h-3 w-3" /> Fetch
                                    </span>
                                    <span className={textMuted}>→</span>
                                    <span className={`flex items-center gap-1 ${decryptPercent >= 30 ? 'text-emerald-500' : textMuted}`}>
                                        <KeyRound className="h-3 w-3" /> Key
                                    </span>
                                    <span className={textMuted}>→</span>
                                    <span className={`flex items-center gap-1 ${decryptPercent >= 50 ? 'text-emerald-500' : textMuted}`}>
                                        <Lock className="h-3 w-3" /> Decrypt
                                    </span>
                                    <span className={textMuted}>→</span>
                                    <span className={`flex items-center gap-1 ${decryptPercent >= 85 ? 'text-emerald-500' : textMuted}`}>
                                        <ShieldCheck className="h-3 w-3" /> Verify
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : !decryptedFile ? (
                        /* Passphrase Entry */
                        <>
                            <div className="mb-5">
                                <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                    <KeyRound className="h-4 w-4 inline mr-1" />
                                    Enter Decryption Passphrase
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassphrase ? 'text' : 'password'}
                                        value={passphrase}
                                        onChange={(e) => handlePassphraseChange(e.target.value)}
                                        placeholder="Enter the passphrase..."
                                        className="input-field text-center text-lg tracking-wide font-mono pr-12"
                                        autoComplete="off"
                                        disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassphrase(!showPassphrase)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted}`}
                                    >
                                        {showPassphrase ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {passphraseError && (
                                    <p className="text-red-500 text-sm mt-2 text-center flex items-center justify-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {passphraseError}
                                    </p>
                                )}
                            </div>

                            {fileData.linkPasswordHash && (
                                <div className="mb-5">
                                    <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                        <Lock className="h-4 w-4 inline mr-1" />
                                        Link Password Required
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showLinkPassword ? 'text' : 'password'}
                                            value={linkPassword}
                                            onChange={(e) => {
                                                setLinkPassword(e.target.value);
                                                setPassphraseError(null);
                                            }}
                                            placeholder="Enter link password..."
                                            className="input-field text-center text-lg tracking-wide font-mono pr-12"
                                            autoComplete="off"
                                            disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLinkPassword(!showLinkPassword)}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted}`}
                                        >
                                            {showLinkPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleDecrypt}
                                disabled={passphrase.length < 1 || isDecrypting}
                                className="btn-primary w-full justify-center disabled:opacity-50"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Decrypt & Download
                            </button>
                        </>
                    ) : (
                        /* Decrypted — Show Results */
                        <>
                            {/* Integrity Verification */}
                            <div className={`p-4 rounded-xl mb-5 border ${
                                integrityStatus === 'verified'
                                    ? isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                                    : isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {integrityStatus === 'verified' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className={`font-medium ${integrityStatus === 'verified' ? 'text-green-500' : 'text-red-500'}`}>
                                        {integrityStatus === 'verified' ? 'Integrity Verified' : 'Integrity Check Failed'}
                                    </span>
                                </div>
                                <div className={`text-xs space-y-1 ${integrityStatus === 'verified' ? (isDark ? 'text-green-200' : 'text-green-700') : (isDark ? 'text-red-200' : 'text-red-700')}`}>
                                    <p>✓ AES-256-GCM authenticated decryption</p>
                                    <p>✓ SHA-256 hash verification passed</p>
                                    <p>✓ File size: {(decryptedFile.fileSize / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="btn-primary w-full justify-center mb-3"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Download {decryptedFile.fileName}
                            </button>

                            <button
                                onClick={handleReset}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all ${
                                    isDark ? 'text-dark-400 hover:bg-[#334155]' : 'text-gray-500 hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Decrypt Another File
                            </button>
                        </>
                    )}

                    {/* Security Notice */}
                    <div className={`mt-5 p-4 rounded-xl text-xs ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                        <p className={`flex items-start gap-1.5 ${textMuted}`}>
                            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                            <span>
                                <strong className="text-emerald-500">Secure Client-Side Decryption.</strong> Access is gated by your secret passphrase. 
                                Decryption happens in the browser after encrypted download from secure storage.
                                Your files remain encrypted at rest using AES-256-GCM.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
