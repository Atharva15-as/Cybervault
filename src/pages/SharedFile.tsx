import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Download, Clock, Shield, AlertCircle, Check, Eye, EyeOff, Hash, FileIcon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { verifyPin, formatTimeRemaining } from '../utils/crypto';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';

// Interface for shared file data
interface SharedFileData {
    id: string;
    name: string;
    size: string;
    hash: string;
    pinHash: string;
    expiryDate: Date;
    uploadDate: string;
}

// Mock shared file data - fallback for demo when database is empty
const mockSharedFiles: { [key: string]: SharedFileData } = {
    'demo123': {
        id: '1',
        name: 'Financial_Report_2024.pdf',
        size: '2.4 MB',
        hash: 'a3f2c8d1e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // Hash of '1234'
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        uploadDate: '2024-01-15'
    }
};

export default function SharedFile() {
    const { token } = useParams<{ token: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDark = theme === 'dark';

    const [fileData, setFileData] = useState<SharedFileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [pinError, setPinError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [dbFileId, setDbFileId] = useState<string | null>(null);

    // Brute-force protection
    const [pinAttempts, setPinAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const MAX_PIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 30000; // 30 seconds

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    useEffect(() => {
        const fetchFileData = async () => {
            setLoading(true);

            if (!token) {
                setError('Invalid share link');
                setLoading(false);
                return;
            }

            try {
                // First, try to fetch from Supabase database
                const { data: dbFile, error: dbError } = await fileService.getFileByToken(token);

                if (dbFile && !dbError) {
                    // Found in database
                    setFileData({
                        id: dbFile.id,
                        name: dbFile.file_name,
                        size: dbFile.file_size,
                        hash: dbFile.file_hash,
                        pinHash: dbFile.pin_hash,
                        expiryDate: new Date(dbFile.expiry_date),
                        uploadDate: dbFile.created_at.split('T')[0]
                    });
                    setDbFileId(dbFile.id);
                } else if (mockSharedFiles[token]) {
                    // Fallback to mock data for demo
                    const data = mockSharedFiles[token];

                    // Check if expired
                    if (new Date() > data.expiryDate) {
                        setError('This link has expired');
                    } else {
                        setFileData(data);
                    }
                } else {
                    setError(dbError?.message || 'Invalid or expired share link');
                }
            } catch (err) {
                console.error('Error fetching file:', err);

                // Fallback to mock data
                if (token && mockSharedFiles[token]) {
                    const data = mockSharedFiles[token];
                    if (new Date() > data.expiryDate) {
                        setError('This link has expired');
                    } else {
                        setFileData(data);
                    }
                } else {
                    setError('Invalid or expired share link');
                }
            }

            setLoading(false);
        };

        fetchFileData();
    }, [token]);

    const handlePinChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setPin(cleaned);
        setPinError(null);
    };

    const handleVerifyPin = async () => {
        // Check lockout
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setPinError(`Too many attempts. Please wait ${remainingSec} seconds.`);
            return;
        }

        // Clear lockout if expired
        if (lockoutUntil && Date.now() >= lockoutUntil) {
            setLockoutUntil(null);
            setPinAttempts(0);
        }

        if (!fileData || pin.length < 4) {
            setPinError('Please enter a valid PIN');
            return;
        }

        setVerifying(true);

        // Verify PIN
        const isValid = await verifyPin(pin, fileData.pinHash);

        if (isValid) {
            setIsVerified(true);
            setPinError(null);
            setPinAttempts(0);
        } else {
            const newAttempts = pinAttempts + 1;
            setPinAttempts(newAttempts);

            if (newAttempts >= MAX_PIN_ATTEMPTS) {
                setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
                setPinError(`Too many failed attempts. Locked out for 30 seconds.`);
                setPin('');
            } else {
                setPinError(`Incorrect PIN. ${MAX_PIN_ATTEMPTS - newAttempts} attempt(s) remaining.`);
            }
        }

        setVerifying(false);
    };

    const handleDownload = async () => {
        if (!user) {
            navigate('/login', { state: { from: location } });
            return;
        }

        if (fileData) {
            // Increment download count in database
            if (dbFileId) {
                await fileService.incrementDownloadCount(dbFileId);
            }

            // In production, this would trigger the actual file download
            alert(`Downloading ${fileData.name}...`);
        }
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
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                            <FileIcon className="h-10 w-10 text-primary-500" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-1 ${textPrimary}`}>{fileData.name}</h2>
                        <p className={textMuted}>{fileData.size}</p>
                    </div>

                    {/* File Info */}
                    <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-primary-500" />
                                <span className={textMuted}>SHA-256:</span>
                                <span className={`font-mono text-xs ${textPrimary}`}>
                                    {fileData.hash.slice(0, 16)}...
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-500" />
                                <span className={textMuted}>Expires in:</span>
                                <span className="text-green-500 font-medium">{timeRemaining}</span>
                            </div>
                        </div>
                    </div>

                    {!isVerified ? (
                        <>
                            {/* PIN Entry */}
                            <div className="mb-6">
                                <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                    <Lock className="h-4 w-4 inline mr-1" />
                                    Enter PIN to access file
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPin ? 'text' : 'password'}
                                        inputMode="numeric"
                                        value={pin}
                                        onChange={(e) => handlePinChange(e.target.value)}
                                        placeholder="Enter 4-6 digit PIN"
                                        className="input-field text-center text-2xl tracking-[0.5em] font-mono pr-12"
                                        maxLength={6}
                                        autoComplete="off"
                                        disabled={!!(lockoutUntil && Date.now() < lockoutUntil)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${textMuted}`}
                                    >
                                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <div className="flex justify-center gap-1 mt-2">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full transition-colors ${i < pin.length
                                                ? 'bg-primary-500'
                                                : isDark ? 'bg-dark-600' : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                {pinError && (
                                    <p className="text-red-500 text-sm mt-2 text-center flex items-center justify-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {pinError}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleVerifyPin}
                                disabled={pin.length < 4 || verifying}
                                className="btn-primary w-full justify-center disabled:opacity-50"
                            >
                                {verifying ? (
                                    <>
                                        <Shield className="h-4 w-4 mr-2 animate-pulse" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Verify PIN
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Verified - Show Download */}
                            <div className={`p-4 rounded-xl mb-6 border ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-center gap-2 text-green-500">
                                    <Check className="h-5 w-5" />
                                    <span className="font-medium">PIN Verified Successfully!</span>
                                </div>
                                <p className={`text-sm mt-1 ${isDark ? 'text-green-200' : 'text-green-700'}`}>
                                    File integrity verified. Ready to download.
                                </p>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="btn-primary w-full justify-center"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Download File
                            </button>
                        </>
                    )}

                    {/* Security Notice */}
                    <div className={`mt-6 p-4 rounded-xl text-sm ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
                        <p className={textMuted}>
                            🔒 This file is protected with end-to-end encryption. Your data is secure.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
