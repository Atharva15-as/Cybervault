import { useState } from 'react';
import { X, Lock, Clock, Upload, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { generateFileHash, validatePin, calculateExpiryDate } from '../utils/crypto';

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
    }) => void;
}

export default function UploadModal({ isOpen, onClose, file, onUploadComplete }: UploadModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [expiryDuration, setExpiryDuration] = useState('24h');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    const handlePinChange = (value: string) => {
        // Only allow digits, max 6 characters
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setPin(cleaned);
        setError(null);
    };

    const handleConfirmPinChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setConfirmPin(cleaned);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!file) return;

        // Validate PIN
        if (!validatePin(pin)) {
            setError('PIN must be 4-6 digits');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            // Stage 1: Generate file hash
            setProgressStage('Generating SHA-256 hash...');
            setProgress(20);
            const hash = await generateFileHash(file);

            // Stage 2: Hash the PIN
            setProgressStage('Encrypting PIN...');
            setProgress(50);
            const encoder = new TextEncoder();
            const pinData = encoder.encode(pin);
            const pinHashBuffer = await crypto.subtle.digest('SHA-256', pinData);
            const pinHashArray = Array.from(new Uint8Array(pinHashBuffer));
            const pinHash = pinHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Stage 3: Calculate expiry
            setProgressStage('Setting expiry...');
            setProgress(80);
            const expiryDate = calculateExpiryDate(expiryDuration);

            // Stage 4: Complete
            setProgressStage('Finalizing...');
            setProgress(100);

            await new Promise(resolve => setTimeout(resolve, 500));

            onUploadComplete({
                file,
                hash,
                pin,
                pinHash,
                expiryDuration,
                expiryDate
            });

            // Reset form
            setPin('');
            setConfirmPin('');
            setExpiryDuration('24h');
            setIsProcessing(false);
            setProgress(0);
            onClose();
        } catch (err) {
            setError('Failed to process file. Please try again.');
            setIsProcessing(false);
        }
    };

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`glass-card p-6 max-w-md w-full animate-slide-up ${isDark ? '' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Secure Upload</h3>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} disabled:opacity-50`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {isProcessing ? (
                    <div className="py-8 text-center">
                        <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
                        <p className={`font-medium mb-2 ${textPrimary}`}>{progressStage}</p>
                        <div className="max-w-xs mx-auto h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* File Info */}
                        <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-primary-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${textPrimary}`}>{file.name}</p>
                                    <p className={`text-sm ${textMuted}`}>
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* PIN Input */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                <Lock className="h-4 w-4 inline mr-1" />
                                Security PIN (4-6 digits)
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                placeholder="••••••"
                                className={`input-field text-center text-lg tracking-widest font-mono ${isDark ? 'placeholder:text-gray-600' : 'placeholder:text-gray-400'
                                    }`}
                                maxLength={6}
                            />
                            <div className="flex justify-center gap-2 mt-3">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${i < pin.length
                                            ? 'bg-primary-500 border-primary-500 text-white'
                                            : isDark
                                                ? 'bg-dark-700 border-dark-600'
                                                : 'bg-gray-100 border-gray-300'
                                            }`}
                                    >
                                        {i < pin.length && (
                                            <span className="text-lg">•</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confirm PIN */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                Confirm PIN
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={confirmPin}
                                onChange={(e) => handleConfirmPinChange(e.target.value)}
                                placeholder="••••••"
                                className={`input-field text-center text-lg tracking-widest font-mono ${isDark ? 'placeholder:text-gray-600' : 'placeholder:text-gray-400'
                                    }`}
                                maxLength={6}
                            />
                            {confirmPin.length >= 4 && (
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    {pin === confirmPin ? (
                                        <span className="text-green-500 text-xs flex items-center gap-1">
                                            <Check className="h-3 w-3" /> PINs match
                                        </span>
                                    ) : (
                                        <span className="text-red-500 text-xs flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> PINs don't match
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Expiry Duration */}
                        <div className="mb-6">
                            <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                <Clock className="h-4 w-4 inline mr-1" />
                                Access Duration
                            </label>
                            <select
                                value={expiryDuration}
                                onChange={(e) => setExpiryDuration(e.target.value)}
                                className="input-field"
                            >
                                <option value="1h">1 Hour</option>
                                <option value="6h">6 Hours</option>
                                <option value="24h">24 Hours</option>
                                <option value="7d">7 Days</option>
                                <option value="30d">30 Days</option>
                            </select>
                        </div>

                        {/* Info Box */}
                        <div className={`p-4 rounded-xl mb-6 text-sm ${isDark ? 'bg-primary-500/10 text-primary-300' : 'bg-primary-50 text-primary-700'}`}>
                            <p className="font-medium mb-1">🔒 Security Features:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• SHA-256 file integrity hash generated</li>
                                <li>• PIN required for file access</li>
                                <li>• Auto-expires after selected duration</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn-secondary flex-1"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={pin.length < 4 || pin !== confirmPin}
                                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Secure Upload
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
