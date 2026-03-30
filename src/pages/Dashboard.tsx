import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, File as FileIcon, Download, Share2, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import FileEncryptDecrypt from './FileEncryptDecrypt';
import storageEncryptionService, { StorageFile } from '../services/storageEncryptionService';
import ShareModal from '../components/ShareModal';

export default function Dashboard() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
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

    return (
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-12">
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-12 items-start">
                    <aside className="xl:col-span-4 xl:sticky xl:top-28">
                        <div className={`glass-card p-7 md:p-8 border space-y-7 ${panelBg}`}>
                            <div>
                                <p className="text-sm font-semibold text-primary-500 mb-2">How To Use</p>
                                <h2 className={`text-2xl md:text-3xl font-bold font-heading mb-3 leading-tight ${textPrimary}`}>
                                    Vault Operations Manual
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
                                <h2 className={`text-2xl md:text-3xl font-bold font-heading mb-2 ${textPrimary}`}>Vault Operations</h2>
                                <p className={`${textMuted} leading-relaxed`}>Perform encryption and decryption in one focused workspace designed for fast and secure execution.</p>
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
                                                {latestEncrypted.encryptedFileName} is ready. Download it now or share using secure link and QR.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={downloadEncryptedNow} className="btn-primary">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download .enc
                                        </button>
                                        <button onClick={() => setShowShareModal(true)} className="btn-secondary">
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Share Link / QR
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
                        ) : filteredFiles.length === 0 ? (
                            <div className="p-10 text-center">
                                <FileIcon className={`h-10 w-10 mx-auto mb-3 ${textMuted}`} />
                                <p className={textMuted}>No uploaded files found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                            <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>File Name</th>
                                            <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Size</th>
                                            <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Uploaded</th>
                                            <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>Downloads</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-[#334155]' : 'divide-[#CBD5E1]'}`}>
                                        {filteredFiles.map((file) => (
                                            <tr key={file.id} className={isDark ? 'hover:bg-[#1E293B]/50' : 'hover:bg-[#E4F3EC]'}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                            <FileIcon className="h-4 w-4 text-primary-500" />
                                                        </div>
                                                        <span className={`font-medium ${textPrimary}`}>{file.fileName}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 ${textMuted}`}>
                                                    {storageEncryptionService.formatFileSize(file.fileSize)}
                                                </td>
                                                <td className={`px-6 py-4 ${textMuted}`}>
                                                    {file.uploadedAt.toLocaleDateString()}
                                                </td>
                                                <td className={`px-6 py-4 ${textMuted}`}>{file.downloadCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                file={latestEncrypted ? {
                    id: latestEncrypted.fileRecord.id,
                    name: latestEncrypted.fileRecord.fileName,
                    hash: latestEncrypted.fileRecord.hash,
                    expiryDate: latestEncrypted.fileRecord.expiryDate,
                    hasPin: true,
                    downloadCount: latestEncrypted.fileRecord.downloadCount,
                    shareToken: latestEncrypted.fileRecord.shareToken,
                    shareUrl: latestEncrypted.fileRecord.shareUrl,
                } : null}
            />
        </div>
    );
}
