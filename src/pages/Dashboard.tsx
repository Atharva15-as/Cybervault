import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Lock,
    Upload,
    Share2,
    Shield,
    Activity,
    Clock,
    ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import storageEncryptionService, { StorageFile } from '../services/storageEncryptionService';

export default function Dashboard() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            const result = await storageEncryptionService.getUserFiles();
            if (mounted && result.success && result.files) {
                setFiles(result.files);
            }
            if (mounted) {
                setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    const stats = useMemo(() => {
        const total = files.length;
        const shared = files.filter((f) => !!f.shareToken).length;
        const active = files.filter((f) => f.expiryDate > new Date()).length;
        const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);
        return { total, shared, active, totalSize };
    }, [files]);

    const recentFiles = useMemo(() => {
        return [...files]
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            .slice(0, 5);
    }, [files]);

    const quickActions = [
        {
            title: 'Open Vault Workspace',
            desc: 'Encrypt, decrypt, and share files from one focused workspace.',
            path: '/workspace',
            icon: Lock,
        },
        {
            title: 'Start File Encryption',
            desc: 'Go directly to the file encrypt/decrypt tool.',
            path: '/file-encrypt-decrypt',
            icon: Upload,
        },
        {
            title: 'View Activity Log',
            desc: 'See uploads, downloads, and share events.',
            path: '/activity',
            icon: Activity,
        },
        {
            title: 'Scanner History',
            desc: 'Review previous scanner runs and threat results.',
            path: '/scanner/history',
            icon: Shield,
        },
    ];

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <section className="glass-card p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <LayoutDashboard className="h-6 w-6 text-primary-500" />
                        </div>
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-bold ${textPrimary}`}>Dashboard</h1>
                            <p className={`mt-1 ${textMuted}`}>
                                Your CyberVault control center for encryption workflow, file sharing, and security insights.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                        <p className={`text-xs ${textMuted}`}>Total Files</p>
                        <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className={`text-xs ${textMuted}`}>Shared Files</p>
                        <p className={`text-2xl font-bold ${textPrimary}`}>{stats.shared}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className={`text-xs ${textMuted}`}>Active Links</p>
                        <p className={`text-2xl font-bold ${textPrimary}`}>{stats.active}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className={`text-xs ${textMuted}`}>Storage Used</p>
                        <p className={`text-2xl font-bold ${textPrimary}`}>{storageEncryptionService.formatFileSize(stats.totalSize)}</p>
                    </div>
                </section>

                <section>
                    <h2 className={`text-xl font-semibold mb-4 ${textPrimary}`}>Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.path}
                                to={action.path}
                                className={`glass-card p-5 border transition-all ${
                                    isDark ? 'border-[#334155] hover:bg-[#1E293B]/60' : 'border-[#CBD5E1] hover:bg-[#E4F3EC]'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-500/20 mb-3">
                                            <action.icon className="h-5 w-5 text-primary-500" />
                                        </div>
                                        <p className={`font-semibold ${textPrimary}`}>{action.title}</p>
                                        <p className={`text-sm mt-1 ${textMuted}`}>{action.desc}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-primary-500 mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="glass-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#CBD5E1]/40">
                        <h2 className={`text-lg font-semibold ${textPrimary}`}>Recent Uploaded Files</h2>
                    </div>

                    {loading ? (
                        <div className={`p-6 ${textMuted}`}>Loading files...</div>
                    ) : recentFiles.length === 0 ? (
                        <div className="p-6">
                            <p className={textMuted}>No files uploaded yet.</p>
                            <Link to="/workspace" className="inline-flex items-center mt-3 text-primary-500 text-sm font-medium">
                                Go to Vault Workspace
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#CBD5E1]/40">
                            {recentFiles.map((file) => (
                                <div key={file.id} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className={`font-medium truncate ${textPrimary}`}>{file.fileName}</p>
                                        <p className={`text-xs mt-1 ${textMuted}`}>
                                            {storageEncryptionService.formatFileSize(file.fileSize)}
                                        </p>
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${textMuted}`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        {file.uploadedAt.toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {file.shareToken && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-500">
                                                <Share2 className="h-3 w-3" />
                                                Shared
                                            </span>
                                        )}
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                                                file.expiryDate > new Date()
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-red-500/10 text-red-600'
                                            }`}
                                        >
                                            {file.expiryDate > new Date() ? 'Active' : 'Expired'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
