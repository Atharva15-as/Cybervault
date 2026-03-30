import { useState } from 'react';
import { X, Lock, Clock, Upload, AlertCircle, Check, Eye, EyeOff, RefreshCw, Shield, ShieldCheck, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import encryptionService from '../services/encryptionService';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    onUploadComplete: (fileData: {
        file: File;
        hash: string;
        pin: string;
        pinHash: string;
        expiryDuration: string;
        expiryDate: Date;
        encryptedBlob: Blob;
        encryptedHash: string;
    }) => void;
    inline?: boolean;
}

export default function UploadModal({ isOpen, onClose, file, onUploadComplete, inline = false }: UploadModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [passphrase, setPassphrase] = useState('');
    const [confirmPassphrase, setConfirmPassphrase] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [expiryDuration, setExpiryDuration] = useState('24h');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const strength = passphrase ? encryptionService.estimateStrength(passphrase) : null;

    const handlePassphraseChange = (value: string) => {
        setPassphrase(value);
        setError(null);
    };

    const handleConfirmPassphraseChange = (value: string) => {
        setConfirmPassphrase(value);
        setError(null);
    };

    const generateRandomPassphrase = () => {
        const generated = encryptionService.generatePassphrase(4);
        setPassphrase(generated);
        setConfirmPassphrase(generated);
        setShowPassphrase(true);
    };

    const calculateExpiryDate = (duration: string): Date => {
        const now = new Date();
        switch (duration) {
            case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
            case '6h': return new Date(now.getTime() + 6 * 60 * 60 * 1000);
            case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        // Validate passphrase
        if (passphrase.length < 6) {
            setError('Passphrase must be at least 6 characters');
            return;
        }

        if (passphrase !== confirmPassphrase) {
            setError('Passphrases do not match');
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            // Stage 1: Encrypt file in browser
            setProgressStage('Encrypting file with AES-256-GCM...');
            setProgress(10);

            const encrypted = await encryptionService.encryptFile(file, passphrase, (stage, pct) => {
                setProgressStage(stage);
                setProgress(Math.floor(pct * 0.7)); // 0-70%
            });

            // Stage 2: Hash passphrase for DB storage (never store plaintext!)
            setProgressStage('Securing passphrase...');
            setProgress(75);
            const encoder = new TextEncoder();
            const pinData = encoder.encode(passphrase);
            const pinHashBuffer = await crypto.subtle.digest('SHA-256', pinData);
            const pinHashArray = Array.from(new Uint8Array(pinHashBuffer));
            const pinHash = pinHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Stage 3: Calculate expiry
            setProgressStage('Setting expiry...');
            setProgress(85);
            const expiryDate = calculateExpiryDate(expiryDuration);

            // Stage 4: Complete
            setProgressStage('Finalizing...');
            setProgress(100);

            await new Promise(resolve => setTimeout(resolve, 400));

            onUploadComplete({
                file,
                hash: encrypted.originalHash,
                pin: passphrase,
                pinHash,
                expiryDuration,
                expiryDate,
                encryptedBlob: encrypted.blob,
                encryptedHash: encrypted.encryptedHash,
            });

            // Reset form
            setPassphrase('');
            setConfirmPassphrase('');
            setExpiryDuration('24h');
            setIsProcessing(false);
            setProgress(0);
            onClose();
        } catch (err) {
            setError('Failed to encrypt file. Please try again.');
            setIsProcessing(false);
        }
    };

    if (!isOpen || !file) return null;

    const passphraseMatch = passphrase.length >= 6 && passphrase === confirmPassphrase;

    const content = (
        <div className={`glass-card p-5 w-full animate-slide-up ${isDark ? '' : 'bg-[#F9FEFC]'} ${inline ? 'max-w-md mx-auto' : 'max-w-md'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className={`text-base font-semibold ${textPrimary}`}>Secure Upload</h3>
                </div>
                <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className={`p-1.5 rounded-lg ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-gray-500 hover:text-gray-900 hover:bg-[#E4F3EC]'} disabled:opacity-50`}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {isProcessing ? (
                <div className="py-8 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" stroke={isDark ? '#334155' : '#E4F3EC'} strokeWidth="6" fill="none" />
                            <circle cx="40" cy="40" r="34" stroke="#10b981" strokeWidth="6" fill="none"
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    <p className={`text-sm font-medium mb-1 ${textPrimary}`}>{progressStage}</p>
                    <p className={`text-xs ${textMuted}`}>{progress}% complete</p>

                    {/* Encryption flow diagram */}
                    <div className={`mt-4 p-3 rounded-xl text-xs ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                        <div className="flex items-center justify-center gap-2">
                            <span className={`flex items-center gap-1 ${progress >= 10 ? 'text-emerald-500' : textMuted}`}>
                                <Upload className="h-3 w-3" /> File
                            </span>
                            <span className={textMuted}>→</span>
                            <span className={`flex items-center gap-1 ${progress >= 40 ? 'text-emerald-500' : textMuted}`}>
                                <Lock className="h-3 w-3" /> Encrypt
                            </span>
                            <span className={textMuted}>→</span>
                            <span className={`flex items-center gap-1 ${progress >= 70 ? 'text-emerald-500' : textMuted}`}>
                                <ShieldCheck className="h-3 w-3" /> Verify
                            </span>
                            <span className={textMuted}>→</span>
                            <span className={`flex items-center gap-1 ${progress >= 100 ? 'text-emerald-500' : textMuted}`}>
                                <Check className="h-3 w-3" /> Done
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* File Info */}
                    <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                <Upload className="h-4 w-4 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${textPrimary}`}>{file.name}</p>
                                <p className={`text-xs ${textMuted}`}>
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Passphrase Input */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className={`text-xs font-medium ${textMuted}`}>
                                <KeyRound className="h-3.5 w-3.5 inline mr-1" />
                                Encryption Passphrase
                            </label>
                            <button
                                onClick={generateRandomPassphrase}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Generate
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassphrase ? 'text' : 'password'}
                                value={passphrase}
                                onChange={(e) => handlePassphraseChange(e.target.value)}
                                placeholder="Enter a strong passphrase..."
                                className={`input-field py-2 pr-10 text-sm font-mono ${isDark ? 'placeholder:text-gray-600' : 'placeholder:text-gray-400'}`}
                            />
                            <button
                                onClick={() => setShowPassphrase(!showPassphrase)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}
                            >
                                {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Strength meter */}
                        {strength && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                strength.score >= 80 ? 'bg-green-500' :
                                                strength.score >= 60 ? 'bg-emerald-500' :
                                                strength.score >= 40 ? 'bg-yellow-500' :
                                                strength.score >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${strength.score}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium ${strength.color}`}>{strength.label}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Passphrase */}
                    <div className="mb-3">
                        <label className={`block text-xs font-medium mb-1.5 ${textMuted}`}>
                            Confirm Passphrase
                        </label>
                        <input
                            type={showPassphrase ? 'text' : 'password'}
                            value={confirmPassphrase}
                            onChange={(e) => handleConfirmPassphraseChange(e.target.value)}
                            placeholder="Re-enter passphrase..."
                            className={`input-field py-2 text-sm font-mono ${isDark ? 'placeholder:text-gray-600' : 'placeholder:text-gray-400'}`}
                        />
                        {confirmPassphrase.length >= 6 && (
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                                {passphrase === confirmPassphrase ? (
                                    <span className="text-green-500 text-[11px] flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Passphrases match
                                    </span>
                                ) : (
                                    <span className="text-red-500 text-[11px] flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Passphrases don't match
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Expiry Duration */}
                    <div className="mb-4">
                        <label className={`block text-xs font-medium mb-1.5 ${textMuted}`}>
                            <Clock className="h-3.5 w-3.5 inline mr-1" />
                            Access Duration
                        </label>
                        <select
                            value={expiryDuration}
                            onChange={(e) => setExpiryDuration(e.target.value)}
                            className="input-field py-2 text-sm"
                        >
                            <option value="1h">1 Hour</option>
                            <option value="6h">6 Hours</option>
                            <option value="24h">24 Hours</option>
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                        </select>
                    </div>

                    {/* Zero-Knowledge Notice */}
                    <div className={`mb-4 p-3 rounded-xl text-xs ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <p className={`flex items-start gap-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span><strong>Zero-Knowledge:</strong> Your file is encrypted in the browser before upload. The server never sees unencrypted data or your passphrase.</span>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5">
                        <button
                            onClick={onClose}
                            className="btn-secondary flex-1 py-2.5 text-sm"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!passphraseMatch}
                            className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            <Lock className="h-4 w-4 mr-1.5" />
                            Encrypt & Upload
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    if (inline) {
        return content;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            {content}
        </div>
    );
}
