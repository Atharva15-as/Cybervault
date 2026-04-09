import { useEffect, useMemo, useState } from 'react';
import {
    Search,
    RefreshCw,
    File as FileIcon,
    Download,
    Share2,
    CheckCircle,
    Link as LinkIcon,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import FileEncryptDecrypt from './FileEncryptDecrypt';
import storageEncryptionService, { StorageFile } from '../services/storageEncryptionService';
import ShareModal from '../components/ShareModal';

export default function VaultWorkspace() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllFiles, setShowAllFiles] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFile, setShareFile] = useState<{
        id: string;
        name: string;
        hash: string;
        expiryDate: Date;
        hasPin: boolean;
        downloadCount: number;
        maxDownloads: number;
        shareToken: string;
        shareUrl: string;
    } | null>(null);
    const [latestEncrypted, setLatestEncrypted] = useState<{
        fileId: string;
        encryptedBlob: Blob;
        encryptedFileName: string;
        passphrase: string;
        shareToken: string;
        shareUrl: string;
        fileRecord: {
            id: string;
            fileName: string;
            hash: string;
            expiryDate: Date;
            downloadCount: number;
            maxDownloads: number;
            shareToken: string;
            shareUrl: string;
        };
    } | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const panelBg = isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F9FEFC] border-[#CBD5E1]';

    const loadFiles = async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);

        setError(null);
        const result = await storageEncryptionService.getUserFiles();

        if (result.success && result.files) {
            setFiles(result.files);
        } else {
            setError(result.error?.message || 'Failed to load uploaded files');
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const filteredFiles = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return files;
        return files.filter((f) => f.fileName.toLowerCase().includes(query));
    }, [files, searchQuery]);

    const filteredAndSortedFiles = useMemo(() => {
        return [...filteredFiles].sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }, [filteredFiles]);

    const visibleFiles = useMemo(() => {
        if (showAllFiles) return filteredAndSortedFiles;
        return filteredAndSortedFiles.slice(0, 5);
    }, [filteredAndSortedFiles, showAllFiles]);

    const handleManagedEncryptSuccess = async (payload: {
        fileId: string;
        encryptedBlob: Blob;
        encryptedFileName: string;
        passphrase: string;
        shareToken: string;
        shareUrl: string;
        fileRecord: {
            id: string;
            fileName: string;
            hash: string;
            expiryDate: Date;
            downloadCount: number;
            maxDownloads: number;
            shareToken: string;
            shareUrl: string;
        };
    }) => {
        setLatestEncrypted(payload);
        await loadFiles(true);
    };

    const downloadEncryptedNow = () => {
        if (!latestEncrypted) return;
        const url = URL.createObjectURL(latestEncrypted.encryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = latestEncrypted.encryptedFileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toShareModalFile = (file: StorageFile) => {
        const shareToken = file.shareToken || '';
        const shareUrl = file.shareUrl || (shareToken ? storageEncryptionService.getAppShareUrl(shareToken) : '');
        return {
            id: file.id,
            name: file.fileName,
            hash: file.id.replace(/-/g, '').slice(0, 64).padEnd(64, '0'),
            expiryDate: file.expiryDate,
            hasPin: true,
            downloadCount: file.downloadCount,
            maxDownloads: file.maxDownloads,
            shareToken,
            shareUrl,
        };
    };

    const openShareModalForFile = (file: StorageFile) => {
        setShareFile(toShareModalFile(file));
        setShowShareModal(true);
    };

    const handleSecureDownload = (file: StorageFile) => {
        if (!file.shareToken) {
            addToast({
                type: 'error',
                title: 'Missing share link',
                message: 'This file does not have a valid share token.',
            });
            return;
        }

        const url = file.shareUrl || storageEncryptionService.getAppShareUrl(file.shareToken);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteFile = async (file: StorageFile) => {
        const result = await storageEncryptionService.deleteFile(file.id);
        if (!result.success) {
            addToast({
                type: 'error',
                title: 'Delete failed',
                message: result.error?.message || 'Could not delete this file.',
            });
            return;
        }

        addToast({
            type: 'success',
            title: 'File deleted',
            message: `${file.fileName} removed from vault.`,
        });
        await loadFiles(true);
    };

    const getSecurityColor = (score: number) => {
        if (score > 75) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score > 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const getSecurityIcon = (status: StorageFile['securityStatus']) => {
        if (status === 'danger') return <ShieldAlert className="h-4 w-4" />;
        if (status === 'warning') return <AlertTriangle className="h-4 w-4" />;
        return <ShieldCheck className="h-4 w-4" />;
    };

    return (
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-12">
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-12 items-start">
                    <aside className="xl:col-span-4 xl:sticky xl:top-28">
                        <div className={`glass-card p-7 md:p-8 border space-y-7 ${panelBg}`}>
                            <div>
                                <p className="text-sm font-semibold text-primary-500 mb-2">How To Use</p>
                                <h2 className={`text-2xl md:text-3xl font-bold font-heading mb-3 leading-tight ${textPrimary}`}>
                                    Encryption Studio Guide
                                </h2>
                                <p className={`${textMuted} leading-relaxed`}>
                                    Follow this guided flow to secure outgoing files and recover trusted encrypted packages safely.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        title: 'Choose Mode',
                                        desc: 'Select Encrypt for new files or Decrypt for .enc vault packages.',
                                    },
                                    {
                                        title: 'Set Vault Access Key',
                                        desc: 'Generate a strong key or enter your passphrase (8+ characters).',
                                    },
                                    {
                                        title: 'Select File & Run',
                                        desc: 'Choose your file and execute secure export or recovery.',
                                    },
                                ].map((step, index) => (
                                    <div key={step.title} className="relative">
                                        <div
                                            className={`rounded-xl border p-4 md:p-5 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}
                                        >
                                            <p className={`text-xs font-medium mb-1 ${textMuted}`}>Step {index + 1}</p>
                                            <p className={`text-base md:text-lg font-semibold ${textPrimary}`}>{step.title}</p>
                                            <p className={`text-sm mt-1.5 leading-relaxed ${textMuted}`}>{step.desc}</p>
                                        </div>
                                        {index < 2 && (
                                            <div className="flex justify-center py-2.5" aria-hidden="true">
                                                <div className={`h-5 w-px ${isDark ? 'bg-[#334155]' : 'bg-[#CBD5E1]'}`} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={`rounded-xl border p-4 md:p-5 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}>
                                <p className={`text-sm font-semibold mb-2 ${textPrimary}`}>Best Practices</p>
                                <p className={`text-sm leading-relaxed ${textMuted}`}>Store keys securely, share keys over a separate channel, and verify the file source before decryption.</p>
                            </div>
                        </div>
                    </aside>

                    <div className="xl:col-span-8">
                        <div className={`glass-card p-5 md:p-6 border ${panelBg}`}>
                            <div className="mb-5">
                                <p className="text-xs tracking-wide uppercase font-semibold text-primary-500 mb-2">Main Feature</p>
                                <h2 className={`text-2xl md:text-3xl font-bold font-heading mb-2 ${textPrimary}`}>Encryption Studio</h2>
                                <p className={`${textMuted} leading-relaxed`}>Perform encryption and decryption in one focused studio designed for fast and secure execution.</p>
                            </div>
                            <FileEncryptDecrypt
                                embedded
                                showEmbeddedIntro={false}
                                showStepCards={false}
                                enableManagedEncrypt
                                onManagedEncryptSuccess={handleManagedEncryptSuccess}
                            />

                            {latestEncrypted && (
                                <div className={`mt-6 rounded-xl border p-4 md:p-5 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className={`font-semibold ${textPrimary}`}>Encrypted Successfully</p>
                                            <p className={`text-sm ${textMuted}`}>
                                                {latestEncrypted.encryptedFileName} is ready. Download it now or share using email, WhatsApp, Telegram, or device share.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={downloadEncryptedNow} className="btn-primary">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download .enc
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!latestEncrypted) return;
                                                setShareFile({
                                                    id: latestEncrypted.fileRecord.id,
                                                    name: latestEncrypted.fileRecord.fileName,
                                                    hash: latestEncrypted.fileRecord.hash,
                                                    expiryDate: latestEncrypted.fileRecord.expiryDate,
                                                    hasPin: true,
                                                    downloadCount: latestEncrypted.fileRecord.downloadCount,
                                                    maxDownloads: latestEncrypted.fileRecord.maxDownloads,
                                                    shareToken: latestEncrypted.fileRecord.shareToken,
                                                    shareUrl: latestEncrypted.fileRecord.shareUrl,
                                                });
                                                setShowShareModal(true);
                                            }}
                                            className="btn-secondary"
                                        >
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Share via Apps
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-5">
                        <h2 className={`text-xl font-semibold ${textPrimary}`}>Uploaded Files</h2>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-72">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search uploaded files..."
                                    className="input-field pl-10 py-2.5 text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => loadFiles(true)}
                                disabled={refreshing}
                                title="Refresh list"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        {loading ? (
                            <div className={`p-10 text-center ${textMuted}`}>Loading files...</div>
                        ) : error ? (
                            <div className="p-6 text-sm text-red-500">{error}</div>
                        ) : filteredAndSortedFiles.length === 0 ? (
                            <div className="p-10 text-center">
                                <FileIcon className={`h-10 w-10 mx-auto mb-3 ${textMuted}`} />
                                <p className={textMuted}>No uploaded files found.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={`border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                                <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>File Name</th>
                                                <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Size</th>
                                                <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Security</th>
                                                <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Sharing</th>
                                                <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-[#334155]' : 'divide-[#CBD5E1]'}`}>
                                            {visibleFiles.map((file) => (
                                                <tr key={file.id} className={isDark ? 'hover:bg-[#1E293B]/50' : 'hover:bg-[#E4F3EC]'}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                                <FileIcon className="h-5 w-5 text-primary-500" />
                                                            </div>
                                                            <div>
                                                                <p className={`font-medium ${textPrimary}`}>{file.fileName}</p>
                                                                <p className={`text-xs ${textMuted}`}>Uploaded {file.uploadedAt.toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 ${textMuted}`}>
                                                        {storageEncryptionService.formatFileSize(file.fileSize)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium w-fit ${getSecurityColor(file.maliciousScore)}`}>
                                                                {getSecurityIcon(file.securityStatus)}
                                                                {file.securityStatus === 'safe' ? 'Safe' : file.securityStatus === 'warning' ? 'Suspicious' : 'Malicious'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 ml-1">Threat: {file.maliciousScore}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {file.shareToken ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-500 text-xs font-medium">
                                                                <LinkIcon className="h-3.5 w-3.5" />
                                                                Shared
                                                            </span>
                                                        ) : (
                                                            <span className={`text-sm ${textMuted}`}>Not shared</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openShareModalForFile(file)}
                                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-primary-400 hover:bg-[#334155]' : 'text-[#64748B] hover:text-primary-600 hover:bg-[#E4F3EC]'}`}
                                                                title="Share"
                                                            >
                                                                <LinkIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSecureDownload(file)}
                                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E4F3EC]'}`}
                                                                title="Download"
                                                            >
                                                                <Download className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteFile(file)}
                                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-red-400 hover:bg-[#334155]' : 'text-[#64748B] hover:text-red-500 hover:bg-[#E4F3EC]'}`}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredAndSortedFiles.length > 5 && (
                                    <div className={`px-6 py-4 border-t text-sm ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllFiles((prev) => !prev)}
                                            className="text-primary-500 hover:text-primary-400 transition-colors font-medium"
                                        >
                                            {showAllFiles
                                                ? 'Show only latest 5 files'
                                                : `Show more (${filteredAndSortedFiles.length - 5} more files)`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => {
                    setShowShareModal(false);
                    setShareFile(null);
                }}
                file={shareFile}
            />
        </div>
    );
}


