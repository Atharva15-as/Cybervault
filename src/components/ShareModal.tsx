import { useState, useEffect } from 'react';
import { X, Copy, Check, Link2, QrCode, Clock, Lock, Hash, ExternalLink, Share2, Mail, MessageCircle, ShieldCheck, Eye, EyeOff, Users, Download, Ban } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

    const [shareToken, setShareToken] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'email'>('link');

    // Email sharing
    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailRole, setEmailRole] = useState<'viewer' | 'editor'>('viewer');
    const [emailSent, setEmailSent] = useState(false);

    // Link security
    const [linkPassword, setLinkPassword] = useState('');
    const [showLinkPassword, setShowLinkPassword] = useState(false);
    const [savingLinkPassword, setSavingLinkPassword] = useState(false);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        if (isOpen && file) {
            const token = file.shareToken || generateShareToken();
            setShareToken(token);
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById('share-qr-code');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `cybervault-share-${shareToken.slice(0, 8)}.png`;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const addEmail = () => {
        const email = emailInput.trim();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emailList.includes(email)) {
            setEmailList([...emailList, email]);
            setEmailInput('');
        }
    };

    const removeEmail = (email: string) => {
        setEmailList(emailList.filter(e => e !== email));
    };

    const handleEmailShare = () => {
        if (emailList.length === 0) return;

        // Open email client with all recipients
        const subject = encodeURIComponent(`Secure File Share: ${file?.name}`);
        const body = encodeURIComponent(
            `I'm sharing a secure encrypted file with you via CyberVault.\n\n` +
            `File: ${file?.name}\n` +
            `Access Link: ${shareUrl}\n` +
            `Access Role: ${emailRole === 'viewer' ? 'View & Download' : 'Full Access'}\n\n` +
            `⚠️ You will need the encryption passphrase to decrypt this file. ` +
            `The passphrase will be shared with you separately for security.\n\n` +
            `🔒 This file is protected with AES-256-GCM end-to-end encryption.`
        );
        const mailto = `mailto:${emailList.join(',')}?subject=${subject}&body=${body}`;
        window.open(mailto, '_blank');
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
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
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <Share2 className="h-4 w-4 text-primary-500" />
                        </div>
                        <h3 className={`text-lg font-semibold ${textPrimary}`}>Share Securely</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-gray-500 hover:text-gray-900 hover:bg-[#E4F3EC]'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* File Info + Stats */}
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

                {/* Tabs */}
                <div className={`flex gap-1 mb-5 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'link'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                        }`}
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Link
                    </button>
                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'qr'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                        }`}
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        QR Code
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'email'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                        }`}
                    >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'link' ? (
                    <div className="space-y-4">
                        {/* Share Link */}
                        <div>
                            <label className={`block text-xs font-medium mb-2 ${textMuted}`}>
                                Shareable Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="input-field flex-1 text-sm font-mono"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`btn-secondary px-4 ${copied ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}`}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Optional Link Password */}
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
                                Recipients will need both the encryption passphrase AND this link password
                            </p>
                            <button
                                type="button"
                                onClick={handleSaveLinkPassword}
                                disabled={savingLinkPassword}
                                className="btn-secondary mt-2 text-xs"
                            >
                                {savingLinkPassword ? 'Saving...' : (linkPassword ? 'Save Link Password' : 'Remove Link Password')}
                            </button>
                        </div>

                        {/* Quick Share Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={async () => {
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: 'Secure File Share',
                                                text: `I'm sharing a secure encrypted file: ${file.name}`,
                                                url: shareUrl
                                            });
                                        } catch (err) {
                                            console.error('Error sharing:', err);
                                        }
                                    }
                                }}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'}`}
                            >
                                <Share2 className="h-4 w-4 text-primary-500" />
                                <span className={textPrimary}>Share</span>
                            </button>
                            <button
                                onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(`Secure file share: ${file.name}\n${shareUrl}`)}`, '_blank');
                                }}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${isDark ? 'border-dark-600 hover:bg-[#334155]' : 'border-gray-200 hover:bg-[#E4F3EC]'}`}
                            >
                                <MessageCircle className="h-4 w-4 text-green-500" />
                                <span className={textPrimary}>WhatsApp</span>
                            </button>
                        </div>

                        {/* How to share guide */}
                        <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-primary-500/10' : 'bg-primary-50'}`}>
                            <p className={`font-medium mb-2 ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>
                                📋 How to share:
                            </p>
                            <ol className={`list-decimal list-inside space-y-1 ${isDark ? 'text-primary-200' : 'text-primary-600'}`}>
                                <li>Copy the secure link above</li>
                                <li>Send the link to your recipient</li>
                                <li>Share the passphrase separately (different channel)</li>
                                <li>Link expires automatically after the set time</li>
                            </ol>
                        </div>
                    </div>
                ) : activeTab === 'qr' ? (
                    <div className="text-center">
                        <div className={`inline-block p-6 rounded-2xl ${isDark ? 'bg-[#F9FEFC]' : 'bg-[#E4F3EC]'}`}>
                            <QRCodeSVG
                                id="share-qr-code"
                                value={shareUrl}
                                size={200}
                                level="H"
                                includeMargin={true}
                                bgColor="transparent"
                                fgColor={isDark ? '#1e1e1e' : '#000000'}
                            />
                        </div>
                        <p className={`mt-4 text-sm ${textMuted}`}>
                            Scan this QR code to access the file
                        </p>
                        <button
                            onClick={handleDownloadQR}
                            className="btn-secondary mt-4"
                        >
                            Download QR Code
                        </button>
                    </div>
                ) : (
                    /* Email Sharing Tab */
                    <div className="space-y-4">
                        <p className={`text-sm ${textMuted}`}>
                            Send secure invitations to recipients via email.
                        </p>

                        {/* Email Input */}
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

                        {/* Email List */}
                        {emailList.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {emailList.map((email) => (
                                    <span key={email} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${isDark ? 'bg-primary-500/20 text-primary-300' : 'bg-primary-50 text-primary-700'}`}>
                                        {email}
                                        <button onClick={() => removeEmail(email)} className="hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Role Selection */}
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
                                            : isDark ? 'border-dark-600 ' + textMuted : 'border-gray-200 ' + textMuted
                                    }`}
                                >
                                    👁️ View & Download
                                </button>
                                <button
                                    onClick={() => setEmailRole('editor')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                                        emailRole === 'editor'
                                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-500'
                                            : isDark ? 'border-dark-600 ' + textMuted : 'border-gray-200 ' + textMuted
                                    }`}
                                >
                                    ✏️ Full Access
                                </button>
                            </div>
                        </div>

                        {/* Send Button */}
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

                {/* Revoke Access */}
                {onRevoke && (
                    <div className={`mt-5 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                        <button
                            onClick={handleRevoke}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isDark ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20' : 'text-red-600 hover:bg-red-50 border border-red-200'
                            }`}
                        >
                            <Ban className="h-4 w-4" />
                            Revoke Access & Disable Link
                        </button>
                    </div>
                )}

                {/* Security Notice */}
                <div className={`mt-5 p-3 rounded-xl border ${isDark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'}`}>
                    <p className={`text-xs flex items-start gap-1.5 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Zero-Knowledge Sharing:</strong> Share the passphrase through a different channel (text message, phone call) than the link for maximum security. The server never has access to your decryption keys.
                        </span>
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                        type="button"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.open(shareUrl, '_blank')}
                        className="btn-primary flex-1"
                        type="button"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview Link
                    </button>
                </div>
            </div>
        </div>
    );
}
