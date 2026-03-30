import React, { useState } from 'react';
import { CheckCircle, FileText, Clock, Shield, Download, Copy } from 'lucide-react';

interface DownloadReceiptProps {
    fileName: string;
    fileSize: number;
    downloadTime: Date;
    shareToken?: string;
    originalHash?: string;
    isEncrypted?: boolean;
}

export const DownloadReceipt: React.FC<DownloadReceiptProps> = ({
    fileName,
    fileSize,
    downloadTime,
    shareToken,
    originalHash,
    isEncrypted = true,
}) => {
    const [copied, setCopied] = useState(false);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDateTime = (date: Date): string => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center">
                    <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Download Successful</h2>
                    <p className="text-emerald-100">
                        {isEncrypted ? 'Your file has been securely decrypted' : 'Your file has been downloaded securely'}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-8 space-y-6">
                    {/* File Information */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    File Name
                                </p>
                                <p className="text-sm font-semibold text-slate-900 break-all mt-1">
                                    {fileName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Download className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    File Size
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {formatFileSize(fileSize)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    Downloaded At
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {formatDateTime(downloadTime)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security Information */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-emerald-900 mb-1">
                                    Security Verified
                                </p>
                                <ul className="text-xs text-emerald-800 space-y-1">
                                    <li>✓ File integrity verified with SHA-256</li>
                                    <li>✓ Decrypted with AES-256-GCM</li>
                                    <li>✓ No tampering detected</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Hash Information (if available) */}
                    {originalHash && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                                File Hash (SHA-256)
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-slate-700 break-all flex-1 bg-white p-2 rounded border border-slate-200">
                                    {originalHash}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(originalHash)}
                                    className="p-2 hover:bg-slate-200 rounded transition flex-shrink-0"
                                    title="Copy hash"
                                >
                                    <Copy className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>
                            {copied && (
                                <p className="text-xs text-emerald-600 mt-2">✓ Copied to clipboard</p>
                            )}
                        </div>
                    )}

                    {/* Share Token (if available) */}
                    {shareToken && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                                Share Token
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-blue-700 break-all flex-1 bg-white p-2 rounded border border-blue-200">
                                    {shareToken}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(shareToken)}
                                    className="p-2 hover:bg-blue-200 rounded transition flex-shrink-0"
                                    title="Copy token"
                                >
                                    <Copy className="w-4 h-4 text-blue-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Important Notes */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-amber-900 mb-2">⚠️ Important</p>
                        <ul className="text-xs text-amber-800 space-y-1">
                            <li>• Keep this file in a secure location</li>
                            <li>• Do not share with unauthorized users</li>
                            <li>• Verify file integrity before use</li>
                            <li>• Delete after use if sensitive</li>
                        </ul>
                    </div>

                    {/* Downloaded from CyberVault */}
                    <div className="text-center pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-600">
                            Downloaded from <span className="font-semibold text-slate-900">CyberVault</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Secure File Exchange System
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium rounded transition"
                    >
                        Print Receipt
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadReceipt;
