import { useState, useEffect } from 'react';
import {
    X,
    Check,
    Clock,
    Lock,
    Hash,
    Share2,
    Mail,
    MessageCircle,
    Eye,
    EyeOff,
    Users,
    Download,
    Ban,
    Send,
    Smartphone,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { generateShareToken, formatTimeRemaining } from '../utils/crypto';
import { useToast } from '../context/ToastContext';
import storageEncryptionService from '../services/storageEncryptionService';

interface ShareFile {
    id: string;
    name: string;
    hash: string;
    expiryDate: Date;
    hasPin: boolean;
    downloadCount?: number;
    maxDownloads?: number;
    isActive?: boolean;
    shareToken?: string;
    shareUrl?: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: ShareFile | null;
    onShareCreated?: (shareData: { token: string; url: string }) => void;
    onRevoke?: (fileId: string) => void;
}

export default function ShareModal({ isOpen, onClose, file, onShareCreated, onRevoke }: ShareModalProps) {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    const [shareUrl, setShareUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'platforms' | 'email'>('platforms');

    // Email sharing
    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailRole, setEmailRole] = useState<'viewer' | 'editor'>('viewer');
    const [emailSent, setEmailSent] = useState(false);

    // Link security
    const [linkPassword, setLinkPassword] = useState('');
    const [showLinkPassword, setShowLinkPassword] = useState(false);
    const [savingLinkPassword, setSavingLinkPassword] = useState(false);
    const [maxDownloads, setMaxDownloads] = useState<number>(0);
    const [savingMaxDownloads, setSavingMaxDownloads] = useState(false);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        if (isOpen && file) {
            const token = file.shareToken || generateShareToken();
            const url = `${window.location.origin}/share/${token}`;
            setShareUrl(url);

            if (onShareCreated) {
                onShareCreated({ token, url });
            }

            // Reset state
            setEmailList([]);
            setEmailInput('');
            setEmailSent(false);
            setLinkPassword('');
            setSavingLinkPassword(false);
            setMaxDownloads(file.maxDownloads ?? 0);
            setSavingMaxDownloads(false);
            setActiveTab('platforms');
        }
    }, [isOpen, file, onShareCreated]);

    const handleSaveLinkPassword = async () => {
        if (!file) return;
        setSavingLinkPassword(true);
        try {
            const result = await storageEncryptionService.setLinkPassword(file.id, linkPassword || null);
            if (!result.success) {
                throw result.error || new Error('Failed to save link password');
            }
            addToast({
                type: 'success',
                title: linkPassword ? 'Link password saved' : 'Link password removed',
                message: linkPassword
                    ? 'Recipients must enter this password before decryption.'
                    : 'Link now works without an additional password.',
            });
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Save failed',
                message: error instanceof Error ? error.message : 'Could not update link password.',
            });
        } finally {
            setSavingLinkPassword(false);
        }
    };

    const addEmail = () => {
        const email = emailInput.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emailList.includes(email)) {
            setEmailList([...emailList, email]);
            setEmailInput('');
        }
    };

    const removeEmail = (email: string) => {
        setEmailList(emailList.filter((e) => e !== email));
    };

    const handleEmailShare = () => {
        if (emailList.length === 0) return;

        const subject = encodeURIComponent(`Secure File Share: ${file?.name}`);
        const body = encodeURIComponent(
            `I'm sharing a secure encrypted file with you via CyberVault.\n\n` +
                `File: ${file?.name}\n` +
                `Access Link: ${shareUrl}\n` +
                `Access Role: ${emailRole === 'viewer' ? 'View & Download' : 'Full Access'}\n\n` +
                `You will need the encryption passphrase to decrypt this file. ` +
                `The passphrase will be shared with you separately for security.\n\n` +
                `This file is protected with AES-256-GCM end-to-end encryption.`
        );

        const mailto = `mailto:${emailList.join(',')}?subject=${subject}&body=${body}`;
        window.open(mailto, '_blank');
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    const handleNativeShare = async () => {
        if (!navigator.share) {
            addToast({
                type: 'info',
                title: 'Native share unavailable',
                message: 'Use WhatsApp, Telegram, or Email in this panel.',
            });
            return;
        }

        try {
            await navigator.share({
                title: 'Secure File Share',
                text: `Secure file share: ${file?.name}`,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleSaveMaxDownloads = async () => {
        if (!file) return;
        setSavingMaxDownloads(true);
        try {
            const result = await storageEncryptionService.setMaxDownloads(file.id, maxDownloads);
            if (!result.success) {
                throw result.error || new Error('Failed to save download limit');
            }
            addToast({
                type: 'success',
                title: 'Download limit updated',
                message: maxDownloads > 0
                    ? `File can be downloaded up to ${maxDownloads} time(s).`
                    : 'Download limit removed.',
            });
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Save failed',
                message: error instanceof Error ? error.message : 'Could not update download limit.',
            });
        } finally {
            setSavingMaxDownloads(false);
        }
    };

    const handleWhatsAppShare = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(`Secure file share: ${file?.name}\n${shareUrl}`)}`,
            '_blank'
        );
    };

    const handleTelegramShare = () => {
        const text = `Secure file share: ${file?.name}`;
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
            '_blank'
        );
    };

    const handleRevoke = () => {
        if (file && onRevoke) {
            onRevoke(file.id);
            onClose();
        }
    };

    if (!isOpen || !file) return null;

    const timeRemaining = formatTimeRemaining(file.expiryDate);
    const isExpired = timeRemaining === 'Expired';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`glass-card p-6 max-w-lg w-full animate-slide-up max-h-[90vh] overflow-y-auto ${isDark ? '' : 'bg-[#F9FEFC]'}`}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <Share2 className="h-4 w-4 text-primary-500" />
                        </div>
                        <h3 className={`text-lg font-semibold ${textPrimary}`}>Share Securely</h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close share dialog"
                        className={`p-2 rounded-lg ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-gray-500 hover:text-gray-900 hover:bg-[#E4F3EC]'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className={`p-4 rounded-xl mb-5 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <p className={`font-medium mb-2 ${textPrimary}`}>{file.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                        <span className={`flex items-center gap-1 ${textMuted}`}>
                            <Hash className="h-3 w-3" />
                            <span className="font-mono">{file.hash.slice(0, 16)}...</span>
                        </span>
                        <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                            <Clock className="h-3 w-3" />
                            {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
                        </span>
                        {file.hasPin && (
                            <span className="flex items-center gap-1 text-primary-500">
                                <Lock className="h-3 w-3" />
                                Encrypted
                            </span>
                        )}
                        {file.downloadCount !== undefined && (
                            <span className={`flex items-center gap-1 ${textMuted}`}>
                                <Download className="h-3 w-3" />
                                {file.downloadCount} downloads
                            </span>
                        )}
                    </div>
                </div>

                <div className={`flex gap-1 mb-5 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <button
                        onClick={() => setActiveTab('platforms')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            activeTab === 'platforms' ? 'bg-primary-500 text-white' : textMuted
                        }`}
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        Platforms
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                            activeTab === 'email' ? 'bg-primary-500 text-white' : textMuted
                        }`}
                    >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                    </button>
                </div>

                {activeTab === 'platforms' ? (
                    <div className="space-y-4">
                        <p className={`text-sm ${textMuted}`}>
                            Share this encrypted file through supported platforms. The access URL is added automatically.
                        </p>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${textMuted}`}>
                                <Lock className="h-3 w-3 inline mr-1" />
                                Additional Link Password (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    type={showLinkPassword ? 'text' : 'password'}
                                    value={linkPassword}
                                    onChange={(e) => setLinkPassword(e.target.value)}
                                    placeholder="Extra password for this link..."
                                    className="input-field text-sm pr-10"
                                />
                                <button
                                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}
                                >
                                    {showLinkPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className={`text-[10px] mt-1 ${textMuted}`}>
                                Recipients will need both the encryption passphrase and this link password
                            </p>
                            <button
                                type="button"
                                onClick={handleSaveLinkPassword}
                                disabled={savingLinkPassword}
                                className="btn-secondary mt-2 text-xs"
                            >
                                {savingLinkPassword ? 'Saving...' : linkPassword ? 'Save Link Password' : 'Remove Link Password'}
                            </button>
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${textMuted}`}>
                                Download Limit (Optional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={maxDownloads}
                                    onChange={(e) => setMaxDownloads(Math.max(0, Number(e.target.value) || 0))}
                                    className="input-field text-sm w-32"
                                    aria-label="Max downloads"
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveMaxDownloads}
                                    disabled={savingMaxDownloads}
                                    className="btn-secondary text-xs"
                                >
                                    {savingMaxDownloads ? 'Saving...' : 'Save Limit'}
                                </button>
                            </div>
                            <p className={`text-[10px] mt-1 ${textMuted}`}>
                                Set to 0 for unlimited downloads.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                onClick={handleNativeShare}
                                aria-label="Share using device share"
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                                    isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <Smartphone className="h-4 w-4 text-primary-500" />
                                <span className={textPrimary}>Device Share</span>
                            </button>
                            <button
                                onClick={handleWhatsAppShare}
                                aria-label="Share on WhatsApp"
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                                    isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                <span className={textPrimary}>WhatsApp</span>
                            </button>
                            <button
                                onClick={handleTelegramShare}
                                aria-label="Share on Telegram"
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                                    isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <Send className="h-4 w-4 text-sky-500" />
                                <span className={textPrimary}>Telegram</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                                    isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <Mail className="h-4 w-4 text-primary-500" />
                                <span className={textPrimary}>Email</span>
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className={`text-sm ${textMuted}`}>
                            Send secure invitations to recipients via email.
                        </p>

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${textMuted}`}>
                                <Mail className="h-3 w-3 inline mr-1" />
                                Recipient Emails
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                                    placeholder="Enter email address..."
                                    className="input-field flex-1 text-sm"
                                />
                                <button onClick={addEmail} className="btn-secondary px-4">
                                    Add
                                </button>
                            </div>
                        </div>

                        {emailList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {emailList.map((email) => (
                                    <span
                                        key={email}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                                            isDark ? 'bg-primary-500/20 text-primary-300' : 'bg-primary-50 text-primary-700'
                                        }`}
                                    >
                                        {email}
                                        <button onClick={() => removeEmail(email)} className="hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className={`block text-xs font-medium mb-2 ${textMuted}`}>
                                <Users className="h-3 w-3 inline mr-1" />
                                Access Role
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEmailRole('viewer')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                                        emailRole === 'viewer'
                                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-500'
                                            : isDark
                                              ? `border-dark-600 ${textMuted}`
                                              : `border-gray-200 ${textMuted}`
                                    }`}
                                >
                                    View and Download
                                </button>
                                <button
                                    onClick={() => setEmailRole('editor')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                                        emailRole === 'editor'
                                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-500'
                                            : isDark
                                              ? `border-dark-600 ${textMuted}`
                                              : `border-gray-200 ${textMuted}`
                                    }`}
                                >
                                    Full Access
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleEmailShare}
                            disabled={emailList.length === 0}
                            className="btn-primary w-full justify-center disabled:opacity-50"
                        >
                            {emailSent ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Invitations Sent!
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Secure Invitations ({emailList.length})
                                </>
                            )}
                        </button>
                    </div>
                )}

                {onRevoke && (
                    <div className={`mt-5 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                        <button
                            onClick={handleRevoke}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isDark
                                    ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20'
                                    : 'text-red-600 hover:bg-red-50 border border-red-200'
                            }`}
                        >
                            <Ban className="h-4 w-4" />
                            Revoke Access and Disable Link
                        </button>
                    </div>
                )}

                <div className="mt-5">
                    <button onClick={onClose} className="btn-secondary w-full" type="button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
