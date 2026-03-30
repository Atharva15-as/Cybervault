import React, { useState } from 'react';
import { Lock, Upload, Download, FileText } from 'lucide-react';
import SecureFileUpload from '../components/SecureFileUpload';
import SecureFileDownload from '../components/SecureFileDownload';
import SecureFileManager from '../components/SecureFileManager';

export const SecureFileExchange: React.FC = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [shareToken, setShareToken] = useState('');
    const [showDownloadForm, setShowDownloadForm] = useState(false);

    const handleUploadSuccess = (fileId: string, shareToken: string, passphrase: string) => {
        // Could show a success toast or notification here
        console.log('File uploaded successfully', { fileId, shareToken, passphrase });
    };

    const handleDownloadSuccess = (fileName: string) => {
        console.log('File downloaded successfully', fileName);
        setShareToken('');
        setShowDownloadForm(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Lock className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-4xl font-bold text-white">Secure File Exchange</h1>
                    </div>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        End-to-end encrypted file sharing with AES-256-GCM encryption. Your files are encrypted in your browser before upload, and only you and authorized recipients can decrypt them.
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="w-full">
                        <div className="flex border-b border-slate-700 bg-slate-800/50">
                            <button
                                value="upload"
                                onClick={() => setActiveTab('upload')}
                                className="flex-1 px-6 py-4 text-slate-300 hover:text-white data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition flex items-center justify-center gap-2"
                                data-state={activeTab === 'upload' ? 'active' : 'inactive'}
                            >
                                <Upload className="w-4 h-4" />
                                Upload & Encrypt
                            </button>
                            <button
                                value="download"
                                onClick={() => setActiveTab('download')}
                                className="flex-1 px-6 py-4 text-slate-300 hover:text-white data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 transition flex items-center justify-center gap-2"
                                data-state={activeTab === 'download' ? 'active' : 'inactive'}
                            >
                                <Download className="w-4 h-4" />
                                Decrypt & Download
                            </button>
                            <button
                                value="manage"
                                onClick={() => setActiveTab('manage')}
                                className="flex-1 px-6 py-4 text-slate-300 hover:text-white data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-400 transition flex items-center justify-center gap-2"
                                data-state={activeTab === 'manage' ? 'active' : 'inactive'}
                            >
                                <FileText className="w-4 h-4" />
                                My Files
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Upload Tab */}
                            {activeTab === 'upload' && (
                                <div className="mt-0">
                                <SecureFileUpload onUploadSuccess={handleUploadSuccess} />

                                {/* Security Info */}
                                <div className="mt-8 grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-700/30 rounded border border-slate-700">
                                        <h3 className="font-medium text-white mb-2">🔐 AES-256-GCM</h3>
                                        <p className="text-sm text-slate-300">
                                            Military-grade encryption with authenticated encryption
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-700/30 rounded border border-slate-700">
                                        <h3 className="font-medium text-white mb-2">🌐 Zero-Knowledge</h3>
                                        <p className="text-sm text-slate-300">
                                            Encryption happens in your browser. Server never sees plaintext
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-700/30 rounded border border-slate-700">
                                        <h3 className="font-medium text-white mb-2">✓ Integrity Check</h3>
                                        <p className="text-sm text-slate-300">
                                            SHA-256 verification prevents tampering
                                        </p>
                                    </div>
                                </div>
                                </div>
                            )}

                            {/* Download Tab */}
                            {activeTab === 'download' && (
                                <div className="mt-0">
                                {!showDownloadForm ? (
                                    <div className="max-w-md mx-auto">
                                        <div className="p-6 bg-slate-700/30 rounded border border-slate-700 text-center">
                                            <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-white mb-2">
                                                Have a share link?
                                            </h3>
                                            <p className="text-slate-300 text-sm mb-4">
                                                Enter the share token from the URL to decrypt and download the file
                                            </p>
                                            <input
                                                type="text"
                                                value={shareToken}
                                                onChange={(e) => setShareToken(e.target.value)}
                                                placeholder="Paste share token here"
                                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-400 mb-4"
                                            />
                                            <button
                                                onClick={() => setShowDownloadForm(true)}
                                                disabled={!shareToken.trim()}
                                                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => setShowDownloadForm(false)}
                                            className="mb-4 text-slate-400 hover:text-slate-300 text-sm"
                                        >
                                            ← Back
                                        </button>
                                        <SecureFileDownload
                                            shareToken={shareToken}
                                            onDownloadSuccess={handleDownloadSuccess}
                                        />
                                    </div>
                                )}

                                {/* Security Info */}
                                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded">
                                    <h3 className="font-medium text-blue-300 mb-2">🔒 How It Works</h3>
                                    <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
                                        <li>Enter the decryption passphrase provided by the sender</li>
                                        <li>The encrypted file is downloaded from secure storage</li>
                                        <li>Integrity is verified using SHA-256 hash</li>
                                        <li>File is decrypted in your browser using AES-256-GCM</li>
                                        <li>Original file is restored with correct extension</li>
                                    </ol>
                                </div>
                                </div>
                            )}

                            {/* Manage Tab */}
                            {activeTab === 'manage' && (
                                <div className="mt-0">
                                    <SecureFileManager />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-800/50 rounded border border-slate-700">
                        <h3 className="font-medium text-white mb-3">Security Features</h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>✓ End-to-end AES-256-GCM encryption</li>
                            <li>✓ PBKDF2 key derivation (600,000 iterations)</li>
                            <li>✓ SHA-256 integrity verification</li>
                            <li>✓ Row-Level Security (RLS) on database</li>
                            <li>✓ Time-limited share links</li>
                            <li>✓ Download count limits</li>
                        </ul>
                    </div>
                    <div className="p-6 bg-slate-800/50 rounded border border-slate-700">
                        <h3 className="font-medium text-white mb-3">Best Practices</h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>• Share passphrases through separate secure channels</li>
                            <li>• Use strong, unique passphrases for sensitive files</li>
                            <li>• Set appropriate expiry times for share links</li>
                            <li>• Limit downloads for highly sensitive content</li>
                            <li>• Delete files after recipients download them</li>
                            <li>• Never share complete URLs with passphrases</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecureFileExchange;
