import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, Download, Clock, Shield, AlertCircle, Hash, FileIcon, ArrowLeft, ShieldCheck, Copy, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatTimeRemaining } from '../utils/crypto';
import { supabase } from '../lib/supabase';
import storageEncryptionService from '../services/storageEncryptionService';

interface SharedFileData {
    id: string;
    name: string;
    size: string;
    hash: string;
    expiryDate: Date;
    uploadDate: string;
    downloadCount: number;
    maxDownloads?: number;
}

function toFriendlyError(message: string): string {
    const value = message.toLowerCase();
    if (value.includes('expired')) return 'This share link has expired. Ask the sender for a new one.';
    if (value.includes('download limit')) return 'This file has reached its download limit.';
    if (value.includes('not found') || value.includes('deactivated')) return 'This file is unavailable or has been removed.';
    return 'Unable to load this encrypted file right now.';
}

export default function SharedFile() {
    const { token } = useParams<{ token: string }>();
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    const [fileData, setFileData] = useState<SharedFileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

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
                const { data: fileRecord, error: dbError } = await supabase
                    .from('shared_files')
                    .select('*')
                    .eq('share_token', token)
                    .eq('is_active', true)
                    .single();

                if (dbError || !fileRecord) {
                    setError('File not found or link expired');
                } else if (new Date(fileRecord.expiry_date) < new Date()) {
                    setError('This share link has expired');
                } else {
                    setFileData({
                        id: fileRecord.id,
                        name: fileRecord.file_name,
                        size: fileRecord.file_size,
                        hash: fileRecord.file_hash,
                        expiryDate: new Date(fileRecord.expiry_date),
                        uploadDate: fileRecord.created_at?.split('T')[0] || 'Unknown',
                        downloadCount: fileRecord.download_count || 0,
                        maxDownloads: fileRecord.max_downloads || 0,
                    });
                }
            } catch (err) {
                console.error('Error fetching file metadata:', err);
                setError('An unexpected error occurred while looking up the file');
            }

            setLoading(false);
        };

        fetchFileData();
    }, [token]);

    const handleCopyLink = async () => {
        if (!token) return;
        const shortLink = storageEncryptionService.getAppShareUrl(token);
        await navigator.clipboard.writeText(shortLink);
        addToast({
            type: 'success',
            title: 'Link Copied',
            message: 'Share link copied to clipboard.',
        });
    };

    const handleDownloadEncrypted = async () => {
        if (!token) return;

        setDownloading(true);
        try {
            const result = await storageEncryptionService.downloadEncryptedPackage(token);
            if (!result.success || !result.blob || !result.fileName) {
                throw result.error || new Error('Failed to download encrypted file');
            }

            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addToast({
                type: 'success',
                title: 'Encrypted File Downloaded',
                message: 'Now decrypt it in CyberVault Decryption Tool using the passphrase.',
            });
        } catch (err) {
            const friendly = toFriendlyError((err as Error).message);
            addToast({
                type: 'error',
                title: 'Download Failed',
                message: friendly,
            });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Shield className="h-8 w-8 text-primary-500" />
                    </div>
                    <p className={textMuted}>Loading encrypted share...</p>
                </div>
            </div>
        );
    }

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

    if (!fileData) return null;

    const timeRemaining = formatTimeRemaining(fileData.expiryDate);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="glass-card p-8 max-w-xl w-full">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-10 w-10 text-primary-500" />
                    </div>
                    <h2 className={`text-xl font-bold mb-1 ${textPrimary}`}>Encrypted File Link</h2>
                    <p className={`text-sm ${textMuted}`}>This page only provides the encrypted package (.enc).</p>
                </div>

                <div className={`p-4 rounded-xl mb-5 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <p className={`font-semibold mb-2 ${textPrimary}`}>{fileData.name}</p>
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
                    </div>
                </div>

                <div className={`rounded-xl border p-4 mb-5 ${isDark ? 'bg-[#0F172A]/60 border-[#334155]' : 'bg-white border-[#CBD5E1]'}`}>
                    <p className={`text-sm font-semibold mb-2 ${textPrimary}`}>How Receiver Uses This</p>
                    <ol className={`text-xs space-y-1 ${textMuted}`}>
                        <li>1. Download encrypted `.enc` file from this page.</li>
                        <li>2. Open CyberVault Decryption Tool.</li>
                        <li>3. Enter decryption passphrase to read the original file.</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleDownloadEncrypted}
                        disabled={downloading}
                        className="btn-primary w-full justify-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading ? 'Downloading...' : 'Download Encrypted .enc'}
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={handleCopyLink} className="btn-secondary justify-center">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                        </button>
                        <Link to="/file-encrypt-decrypt" className="btn-secondary justify-center inline-flex">
                            <KeyRound className="h-4 w-4 mr-2" />
                            Open Decryption Tool
                        </Link>
                    </div>
                </div>

                <div className={`mt-5 p-4 rounded-xl text-xs ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <p className={`flex items-start gap-1.5 ${textMuted}`}>
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                        <span>
                            Security note: this link shares only encrypted content. Plain file content is visible only after decryption with the correct passphrase in CyberVault.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
