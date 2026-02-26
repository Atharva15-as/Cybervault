import { useState, useEffect } from 'react';
import { X, Copy, Check, Link2, QrCode, Clock, Lock, Hash, ExternalLink, Share2, Mail, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../context/ThemeContext';
import { generateShareToken, formatTimeRemaining } from '../utils/crypto';

interface ShareFile {
    id: string;
    name: string;
    hash: string;
    expiryDate: Date;
    hasPin: boolean;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: ShareFile | null;
    onShareCreated?: (shareData: { token: string; url: string }) => void;
}

export default function ShareModal({ isOpen, onClose, file, onShareCreated }: ShareModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [shareToken, setShareToken] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'direct'>('link');

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    useEffect(() => {
        if (isOpen && file) {
            const token = generateShareToken();
            setShareToken(token);
            const url = `${window.location.origin}/share/${token}`;
            setShareUrl(url);

            if (onShareCreated) {
                onShareCreated({ token, url });
            }
        }
    }, [isOpen, file]);

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

    if (!isOpen || !file) return null;

    const timeRemaining = formatTimeRemaining(file.expiryDate);
    const isExpired = timeRemaining === 'Expired';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`glass-card p-6 max-w-lg w-full animate-slide-up ${isDark ? '' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Share Securely</h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* File Info */}
                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
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
                                PIN Protected
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'link'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                            }`}
                    >
                        <Link2 className="h-4 w-4" />
                        Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'qr'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                            }`}
                    >
                        <QrCode className="h-4 w-4" />
                        QR Code
                    </button>
                    <button
                        onClick={() => setActiveTab('direct')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'direct'
                            ? 'bg-primary-500 text-white'
                            : textMuted
                            }`}
                    >
                        <Share2 className="h-4 w-4" />
                        Share
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'link' ? (
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
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

                        <div className={`p-4 rounded-xl text-sm ${isDark ? 'bg-primary-500/10' : 'bg-primary-50'}`}>
                            <p className={`font-medium mb-2 ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>
                                📋 How to share:
                            </p>
                            <ol className={`list-decimal list-inside space-y-1 text-xs ${isDark ? 'text-primary-200' : 'text-primary-600'}`}>
                                <li>Copy the link above</li>
                                <li>Share with your recipient</li>
                                <li>Share the PIN separately (via another channel)</li>
                                <li>Link expires automatically after the set time</li>
                            </ol>
                        </div>
                    </div>
                ) : activeTab === 'qr' ? (
                    <div className="text-center">
                        <div className={`inline-block p-6 rounded-2xl ${isDark ? 'bg-white' : 'bg-gray-50'}`}>
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
                    <div className="space-y-4">
                        <p className={`text-sm ${textMuted} mb-4`}>
                            Share this secure file directly through your favorite apps or services.
                        </p>

                        <button
                            onClick={async () => {
                                if (navigator.share) {
                                    try {
                                        await navigator.share({
                                            title: 'Secure File Share',
                                            text: `I'm sharing a secure encrypted file with you: ${file.name}`,
                                            url: shareUrl
                                        });
                                    } catch (err) {
                                        console.error('Error sharing:', err);
                                    }
                                } else {
                                    alert('Web Share API is not supported on this device/browser.');
                                }
                            }}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 mb-2"
                        >
                            <Share2 className="h-5 w-5" />
                            Share via System
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    window.open(`mailto:?subject=Secure File Share: ${file.name}&body=${encodeURIComponent(`Here is a secure file for you: ${file.name}\nAccess it here: ${shareUrl}`)}`, '_blank');
                                }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isDark ? 'border-dark-600 hover:bg-dark-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Mail className="h-5 w-5 text-blue-500" />
                                <span className={textPrimary}>Email</span>
                            </button>
                            <button
                                onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(`Here is a secure file for you: ${file.name}\nAccess it here: ${shareUrl}`)}`, '_blank');
                                }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isDark ? 'border-dark-600 hover:bg-dark-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <MessageCircle className="h-5 w-5 text-green-500" />
                                <span className={textPrimary}>WhatsApp</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Security Notice */}
                <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-yellow-200 bg-yellow-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                        <strong>⚠️ Security Tip:</strong> Share the PIN through a different channel (e.g., text message, phone call) than the link for maximum security.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
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
