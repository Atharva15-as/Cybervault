import { useState, useEffect, useRef } from 'react';
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
    preferredTop?: number;
    onShareCreated?: (shareData: { token: string; url: string }) => void;
    onRevoke?: (fileId: string) => void;
}

export default function ShareModal({ isOpen, onClose, file, preferredTop, onShareCreated, onRevoke }: ShareModalProps) {
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

    // Keep a stable ref to the latest onShareCreated callback so we can
    // call it inside useEffect without adding it to the dependency array
    // (parent components don't memoize it, which caused an infinite loop).
    const onShareCreatedRef = useRef(onShareCreated);
    useEffect(() => {
        onShareCreatedRef.current = onShareCreated;
    }, [onShareCreated]);

    useEffect(() => {
        if (isOpen && file) {
            const token = file.shareToken || generateShareToken();
            const url = storageEncryptionService.getAppShareUrl(token);
            setShareUrl(url);

            if (onShareCreatedRef.current) {
                onShareCreatedRef.current({ token, url });
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
    }, [isOpen, file]);

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

        const subjectRaw = `Secure File Share: ${file?.name}`;
        const bodyRaw =
            `I'm sharing a secure encrypted file with you via CyberVault.\n\n` +
                `File: ${file?.name}\n` +
                `Access Link: ${shareUrl}\n` +
                `Access Role: ${emailRole === 'viewer' ? 'View & Download' : 'Full Access'}\n\n` +
                `You will need the encryption passphrase to decrypt this file. ` +
                `The passphrase will be shared with you separately for security.\n\n` +
                `This file is protected with AES-256-GCM end-to-end encryption.`;

        const subject = encodeURIComponent(subjectRaw);
        const body = encodeURIComponent(bodyRaw);
        const recipients = emailList.join(',');

        // Prefer Gmail compose (web) to avoid blank pages when mailto
        // handlers are not configured in the browser.
        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipients)}&su=${subject}&body=${body}`;
        const popup = window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');

        // Fallback to default mail client if popups are blocked.
        if (!popup) {
            const mailto = `mailto:${recipients}?subject=${subject}&body=${body}`;
            window.location.href = mailto;
        }

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

    const resolvedTop = Math.max(64, Math.min(preferredTop ?? 112, 320));

    return (
        <>
            {/* Professional Backdrop */}
            <div 
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
            />
            
            {/* Professional Modal - anchored below navbar */}
            <div
                style={{ top: `${resolvedTop}px` }}
                className={`fixed left-1/2 -translate-x-1/2 z-50 rounded-2xl w-[900px] max-h-[80vh] overflow-y-auto shadow-2xl border ${
                isDark 
                    ? 'bg-[#0F172A] border-[#334155]' 
                    : 'bg-white border-[#E2E8F0]'
            }`}
            >
                {/* Header */}
                <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                    isDark 
                        ? 'border-[#334155] bg-[#0F172A]/95' 
                        : 'border-[#E2E8F0] bg-white/95'
                } backdrop-blur-sm`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                            <Share2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${textPrimary}`}>Share Securely</h3>
                            <p className={`text-xs ${textMuted}`}>Send encrypted access to recipients</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close share dialog"
                        className={`p-2 rounded-lg transition-colors ${
                            isDark 
                                ? 'text-dark-400 hover:text-dark-200 hover:bg-[#1E293B]' 
                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* File Info Card */}
                    <div className={`p-4 rounded-xl border-l-4 border-l-primary-500 ${
                        isDark 
                            ? 'bg-[#1E293B]/50 border border-[#334155]' 
                            : 'bg-[#F0F9FF] border border-[#E0F2FE]'
                    }`}>
                        <p className={`font-semibold ${textPrimary} mb-2`}>{file.name}</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                            <span className={`flex items-center gap-1.5 ${textMuted}`}>
                                <Hash className="h-3.5 w-3.5" />
                                <span className="font-mono">{file.hash.slice(0, 12)}...</span>
                            </span>
                            <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500' : 'text-emerald-500'}`}>
                                <Clock className="h-3.5 w-3.5" />
                                {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
                            </span>
                            {file.hasPin && (
                                <span className="flex items-center gap-1.5 text-primary-500">
                                    <Lock className="h-3.5 w-3.5" />
                                    Encrypted
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={`flex gap-2 p-1.5 rounded-lg border ${
                        isDark 
                            ? 'bg-[#1E293B]/30 border-[#334155]' 
                            : 'bg-gray-100 border-gray-200'
                    }`}>
                        <button
                            onClick={() => setActiveTab('platforms')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'platforms' 
                                    ? 'bg-primary-500 text-white shadow-lg' 
                                    : `${textMuted} hover:${isDark ? 'bg-[#334155]/30' : 'bg-white'}`
                            }`}
                        >
                            <Share2 className="h-4 w-4" />
                            Platforms
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'email' 
                                    ? 'bg-primary-500 text-white shadow-lg' 
                                    : `${textMuted} hover:${isDark ? 'bg-[#334155]/30' : 'bg-white'}`
                            }`}
                        >
                            <Mail className="h-4 w-4" />
                            Email
                        </button>
                    </div>

                    {/* Platforms Content */}
                    {activeTab === 'platforms' ? (
                    <div className="flex flex-col gap-4">
                        <p className={`text-sm ${textMuted} leading-relaxed`}>
                            Share this encrypted file through supported platforms.
                        </p>

                        {/* Settings Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Link Password Section */}
                            <div className={`p-4 rounded-lg border ${isDark ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}>
                                <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${textPrimary}`}>
                                    <Lock className="h-4 w-4 text-primary-500" />
                                    Link Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showLinkPassword ? 'text' : 'password'}
                                        value={linkPassword}
                                        onChange={(e) => setLinkPassword(e.target.value)}
                                        placeholder="Optional extra security layer..."
                                        className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors pr-10 ${
                                            isDark
                                                ? 'bg-[#1E293B] border-[#334155] text-white placeholder-[#64748B]'
                                                : 'bg-white border-[#E2E8F0] text-gray-900 placeholder-gray-400'
                                        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                    />
                                    <button
                                        onClick={() => setShowLinkPassword(!showLinkPassword)}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-dark-400 hover:text-dark-200' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                    {showLinkPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveLinkPassword}
                                disabled={savingLinkPassword}
                                className={`w-full mt-3 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                    isDark
                                        ? 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                                        : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                                }`}
                            >
                                {savingLinkPassword ? 'Saving...' : linkPassword ? '💾 Save' : '🗑️ Remove'}
                            </button>
                            </div>

                            {/* Download Limit Section */}
                            <div className={`p-4 rounded-lg border ${isDark ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}>
                                <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${textPrimary}`}>
                                    <Download className="h-4 w-4 text-primary-500" />
                                    Download Limit
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={maxDownloads}
                                        onChange={(e) => setMaxDownloads(Math.max(0, Number(e.target.value) || 0))}
                                        placeholder="0 = unlimited"
                                        className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                            isDark
                                                ? 'bg-[#1E293B] border-[#334155] text-white placeholder-[#64748B]'
                                                : 'bg-white border-[#E2E8F0] text-gray-900 placeholder-gray-400'
                                        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveMaxDownloads}
                                    disabled={savingMaxDownloads}
                                    className={`w-full mt-3 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                        isDark
                                            ? 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                                            : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                                    }`}
                                >
                                    {savingMaxDownloads ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Platform Buttons Row */}
                        <div className="grid grid-cols-4 gap-2 mt-1">
                            <button
                                onClick={handleNativeShare}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-semibold text-xs ${
                                    isDark
                                        ? 'border-[#334155] hover:border-primary-500 hover:bg-[#1E293B] text-white'
                                        : 'border-[#E2E8F0] hover:border-primary-500 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Smartphone className="h-5 w-5 text-primary-500" />
                                Device
                            </button>
                            <button
                                onClick={handleWhatsAppShare}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-semibold text-xs ${
                                    isDark
                                        ? 'border-[#334155] hover:border-green-500 hover:bg-[#1E293B] text-white'
                                        : 'border-[#E2E8F0] hover:border-green-500 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <MessageCircle className="h-5 w-5 text-green-500" />
                                WhatsApp
                            </button>
                            <button
                                onClick={handleTelegramShare}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-semibold text-xs ${
                                    isDark
                                        ? 'border-[#334155] hover:border-sky-500 hover:bg-[#1E293B] text-white'
                                        : 'border-[#E2E8F0] hover:border-sky-500 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Send className="h-5 w-5 text-sky-500" />
                                Telegram
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-semibold text-xs ${
                                    isDark
                                        ? 'border-[#334155] hover:border-primary-500 hover:bg-[#1E293B] text-white'
                                        : 'border-[#E2E8F0] hover:border-primary-500 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Mail className="h-5 w-5 text-primary-500" />
                                Email
                            </button>
                        </div>
                    </div>
                    ) : (
                    <div className="space-y-5">
                        <p className={`text-sm ${textMuted} leading-relaxed`}>
                            Send secure invitations to recipients via email.
                        </p>

                        {/* Email Input */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}>
                            <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${textPrimary}`}>
                                <Mail className="h-4 w-4 text-primary-500" />
                                Recipient Emails
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                                    placeholder="Enter email address..."
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                        isDark
                                            ? 'bg-[#1E293B] border-[#334155] text-white placeholder-[#64748B]'
                                            : 'bg-white border-[#E2E8F0] text-gray-900 placeholder-gray-400'
                                    } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                />
                                <button 
                                    onClick={addEmail} 
                                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                        isDark
                                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                                    }`}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Email Tags */}
                        {emailList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {emailList.map((email) => (
                                    <span
                                        key={email}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                                            isDark 
                                                ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' 
                                                : 'bg-primary-50 border-primary-200 text-primary-700'
                                        }`}
                                    >
                                        {email}
                                        <button onClick={() => removeEmail(email)} className="hover:opacity-70 transition-opacity">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Access Role */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'border-[#334155]' : 'border-[#E2E8F0]'}`}>
                            <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${textPrimary}`}>
                                <Users className="h-4 w-4 text-primary-500" />
                                Access Permissions
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEmailRole('viewer')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                                        emailRole === 'viewer'
                                            ? isDark
                                                ? 'bg-primary-600/30 border-primary-500 text-primary-400'
                                                : 'bg-primary-50 border-primary-500 text-primary-700'
                                            : isDark
                                              ? 'border-[#334155] hover:border-[#475569] text-white'
                                              : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-gray-700'
                                    }`}
                                >
                                    👁️ View
                                </button>
                                <button
                                    onClick={() => setEmailRole('editor')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                                        emailRole === 'editor'
                                            ? isDark
                                                ? 'bg-primary-600/30 border-primary-500 text-primary-400'
                                                : 'bg-primary-50 border-primary-500 text-primary-700'
                                            : isDark
                                              ? 'border-[#334155] hover:border-[#475569] text-white'
                                              : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-gray-700'
                                    }`}
                                >
                                    ✏️ Full
                                </button>
                            </div>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleEmailShare}
                            disabled={emailList.length === 0}
                            className={`w-full py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                emailList.length === 0
                                    ? isDark
                                        ? 'bg-[#334155] text-dark-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : isDark
                                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg'
                                      : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg'
                            }`}
                        >
                            {emailSent ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    Invitations Sent!
                                </>
                            ) : (
                                <>
                                    <Mail className="h-5 w-5" />
                                    Send Invitations ({emailList.length})
                                </>
                            )}
                        </button>
                    </div>
                    )}
            </div>   {/* ✅ ADD THIS LINE (closing main content div) */}
                {/* Footer Actions */}
                <div className={`sticky bottom-0 mt-6 pt-6 border-t ${isDark ? 'border-[#334155] bg-[#0F172A]/95' : 'border-[#E2E8F0] bg-white/95'} -mx-6 -mb-6 px-6 py-6 backdrop-blur-sm space-y-2`}>
                    {onRevoke && (
                        <button
                            onClick={handleRevoke}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                                isDark
                                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                                    : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400'
                            }`}
                        >
                            <Ban className="h-4 w-4" />
                            🗑️ Revoke Access
                        </button>
                    )}

                    <button 
                        onClick={onClose} 
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                            isDark
                                ? 'bg-[#1E293B] border border-[#334155] text-white hover:border-[#475569]'
                                : 'bg-gray-100 border border-[#E2E8F0] text-gray-700 hover:bg-gray-200'
                        }`}
                        type="button"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
