import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Lock,
    Upload,
    ArrowRight,
    CheckCircle,
    File as FileIcon,
    Download,
    Trash2,
    Clock,
    Search,
    ShieldAlert,
    AlertTriangle,
    ShieldCheck,
    Link as LinkIcon,
    ChevronDown,
} from 'lucide-react';
import ParticleNetwork from '../components/ParticleNetwork';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canDeleteFile } from '../services/authorizationService';
import ShareModal from '../components/ShareModal';
import storageEncryptionService from '../services/storageEncryptionService';

// --- Types ---
interface SecureFile {
    id: string;
    name: string;
    size: string;
    uploadDate: string;
    status: string;
    shared: boolean;
    expiresIn: string | null;
    expiryDate: Date | null;
    maliciousScore: number;
    securityStatus: 'safe' | 'warning' | 'danger';
    hash: string;
    pinHash: string;
    hasPin: boolean;
    shareToken: string;
    shareUrl: string;
}

export default function Home() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    // Text color classes — exact palette match
    const textPrimary = isDark ? 'text-dark-200' : 'text-[#0F172A]';     // Heading
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';      // Muted
    const textSubtle = isDark ? 'text-dark-500' : 'text-[#94A3B8]';     // Subtle

    // --- Vault state ---
    const [files, setFiles] = useState<SecureFile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SecureFile | null>(null);
    const [fileToDownload, setFileToDownload] = useState<SecureFile | null>(null);
    
    const handleUploadEntry = () => {
        if (!user) {
            navigate('/login', {
                state: {
                    action: 'upload',
                    from: { pathname: '/file-encrypt-decrypt' },
                },
            });
            return;
        }
        addToast({
            type: 'info',
            title: 'Upload Your File',
            message: 'Continue in the encryptor to upload and encrypt your file.',
        });
        navigate('/file-encrypt-decrypt');
    };

    // --- Auth-gated actions ---
    const handleShare = (file: SecureFile) => {
        if (!user) {
            navigate('/login', { state: { action: 'share', fileName: file.name } });
            return;
        }
        setSelectedFile(file);
        setShowShareModal(true);
    };

    const openSecureDownload = (file: SecureFile) => {
        if (!file.shareToken) {
            addToast({
                type: 'error',
                title: 'Missing share link',
                message: 'This file does not have a valid share token.',
            });
            return;
        }
        navigate(`/share/${file.shareToken}`);
    };

    const handleDownloadClick = (file: SecureFile) => {
        if (!user) {
            localStorage.setItem('cybervault_pending_download', JSON.stringify({ fileName: file.name }));
            navigate('/login', { state: { action: 'download', fileName: file.name } });
            return;
        }
        if (file.maliciousScore > 30) {
            setFileToDownload(file);
            setShowSecurityWarning(true);
        } else {
            openSecureDownload(file);
        }
    };

    const handleDeleteFile = (id: string) => {
        const authCheck = canDeleteFile(user);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Authorization Required', message: authCheck.message });
            navigate('/login', { state: { action: 'delete' } });
            return;
        }
        setFiles(prev => prev.filter(f => f.id !== id));
        addToast({ type: 'success', title: 'File Deleted', message: 'File data permanently deleted' });
    };

    const proceedWithUnsafeDownload = () => {
        if (fileToDownload) {
            addToast({ type: 'warning', title: 'Unsafe Download', message: `Downloading ${fileToDownload.name} despite warnings...` });
            openSecureDownload(fileToDownload);
            setShowSecurityWarning(false);
            setFileToDownload(null);
        }
    };

    useEffect(() => {
        const loadFiles = async () => {
            if (!user) {
                setFiles([]);
                return;
            }

            const result = await storageEncryptionService.getUserFiles();
            if (!result.success || !result.files) return;

            const mapped: SecureFile[] = result.files.map((file) => ({
                id: file.id,
                name: file.fileName,
                size: storageEncryptionService.formatFileSize(file.fileSize),
                uploadDate: file.uploadedAt.toLocaleDateString(),
                status: 'encrypted',
                shared: Boolean(file.shareToken),
                expiresIn: null,
                expiryDate: file.expiryDate,
                maliciousScore: file.maliciousScore ?? 0,
                securityStatus: file.securityStatus ?? 'safe',
                hash: file.id.replace(/-/g, '').slice(0, 64).padEnd(64, '0'),
                pinHash: '',
                hasPin: true,
                shareToken: file.shareToken || '',
                shareUrl: file.shareUrl || '',
            }));

            setFiles(mapped);
        };

        loadFiles();
    }, [user]);

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getSecurityColor = (score: number) => {
        if (score > 75) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score > 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const getSecurityIcon = (status: SecureFile['securityStatus']) => {
        if (status === 'danger') return <ShieldAlert className="h-4 w-4" />;
        if (status === 'warning') return <AlertTriangle className="h-4 w-4" />;
        return <ShieldCheck className="h-4 w-4" />;
    };

    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
                <div className="absolute inset-0 z-0"><ParticleNetwork /></div>
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left Content */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6 animate-fade-in">
                                <Shield className="h-4 w-4 text-primary-500" />
                                <span className="text-sm text-primary-500 font-medium">End-to-End Encrypted</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading mb-6 animate-slide-up">
                                <span className={textPrimary}>CyberVault –</span><br />
                                <span className="gradient-text">Secure Your Files</span><br />
                                <span className={textPrimary}>with End-to-End Encryption</span>
                            </h1>

                            <p className={`text-lg lg:text-xl mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animation-delay-150 ${textMuted}`}>
                                Store, encrypt, and share files with military-grade security.
                                Powered by AES-256 encryption — because your privacy matters.
                            </p>

                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8 animate-slide-up animation-delay-300">
                                <Link to="/converter" className="btn-primary">
                                    Converter
                                </Link>
                                <Link to="/features" className="btn-secondary">
                                    See All Features
                                </Link>
                            </div>

                            <div className="flex flex-wrap gap-6 justify-center lg:justify-start animate-slide-up animation-delay-500">
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">AES-256 Encryption</span>
                                </div>
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">RSA Key Exchange</span>
                                </div>
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">SHA-256 Integrity</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side — Upload Area (replaces hero visual) */}
                        <div className="relative animate-fade-in animation-delay-300 lg:mt-24">
                            <div className={`glass-card p-8 border-2 border-dashed relative overflow-hidden ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="btn-primary inline-flex"
                                        onClick={handleUploadEntry}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload File
                                    </button>
                                    <p className={`text-base font-medium mt-3 ${textMuted}`}>
                                        Upload your confidential files for secure encryption.
                                    </p>
                                </div>
                            </div>
                            {/* Decorative */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>

                {/* Scroll down indicator when files exist */}
                {files.length > 0 && (
                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 animate-fade-in">
                        <button 
                            onClick={() => document.getElementById('uploaded-files-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex flex-col items-center group cursor-pointer"
                        >
                            <span className={`text-xs sm:text-sm mb-2 font-medium opacity-70 group-hover:opacity-100 transition-opacity ${textPrimary}`}>Scroll down to view secure files</span>
                            <div className="p-2 rounded-full bg-primary-500/20 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors animate-bounce">
                                <ChevronDown className="h-5 w-5" />
                            </div>
                        </button>
                    </div>
                )}
            </section>

            {/* Uploaded Files Section — only shows when there are files */}
            {files.length > 0 && (
                <section id="uploaded-files-section" className={`py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-[#0F172A]/50' : 'bg-[#E4F3EC]/50'}`}>
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className={`text-2xl font-bold ${textPrimary}`}>Your Secure Files</h2>
                                <p className={`text-sm ${textMuted}`}>
                                    {user
                                        ? `${files.length} file(s) encrypted and ready`
                                        : 'Sign in to download or share your files. Closing the login popup will permanently delete your file data.'
                                    }
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-10 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="glass-card overflow-hidden">
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
                                        {filteredFiles.map(file => (
                                            <tr key={file.id} className={`transition-colors ${isDark ? 'hover:bg-[#1E293B]/50' : 'hover:bg-[#E4F3EC]'}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                            <FileIcon className="h-5 w-5 text-primary-500" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${textPrimary}`}>{file.name}</p>
                                                            <p className={`text-xs ${textMuted}`}>Uploaded {file.uploadDate}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap ${textMuted}`}>{file.size}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium w-fit ${getSecurityColor(file.maliciousScore)}`}>
                                                            {getSecurityIcon(file.securityStatus)}
                                                            {file.securityStatus === 'safe' ? 'Safe' : file.securityStatus === 'warning' ? 'Suspicious' : 'Malicious'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 ml-1">Threat: {file.maliciousScore}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {file.shared ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-500 text-xs font-medium">
                                                                <LinkIcon className="h-3 w-3" /> Shared
                                                            </span>
                                                            {file.expiresIn && (
                                                                <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                                                                    <Clock className="h-3 w-3" /> {file.expiresIn}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className={`text-sm ${textMuted}`}>Not shared</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleShare(file)}
                                                            className={`p-2 rounded-lg transition-colors relative ${isDark ? 'text-dark-400 hover:text-primary-400 hover:bg-[#334155]' : 'text-[#64748B] hover:text-primary-600 hover:bg-[#E4F3EC]'}`}
                                                            title={user ? 'Share' : 'Sign in to Share'}>
                                                            <LinkIcon className="h-5 w-5" />
                                                            {!user && <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-primary-500" />}
                                                        </button>
                                                        <button onClick={() => handleDownloadClick(file)}
                                                            className={`p-2 rounded-lg transition-colors relative ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E4F3EC]'}`}
                                                            title={user ? 'Download' : 'Sign in to Download'}>
                                                            <Download className="h-5 w-5" />
                                                            {!user && <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-primary-500" />}
                                                        </button>
                                                        <button onClick={() => handleDeleteFile(file.id)}
                                                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-red-400 hover:bg-[#334155]' : 'text-[#64748B] hover:text-red-500 hover:bg-[#E4F3EC]'}`}
                                                            title="Delete">
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredFiles.length === 0 && (
                                <div className="text-center py-12">
                                    <Shield className={`h-12 w-12 mx-auto mb-4 ${textMuted}`} />
                                    <p className={textMuted}>No files match your search</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Security Standards */}
            <div className={`py-0 relative z-10 ${files.length > 0 ? 'mt-8' : '-mt-8'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card p-8 md:p-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            {[
                                { value: 'AES-256', label: 'Encryption Standard' },
                                { value: 'RSA-2048', label: 'Key Exchange' },
                                { value: 'SHA-256', label: 'Integrity Check' },
                                { value: 'TLS 1.3', label: 'Transport Security' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center justify-center p-4">
                                    <p className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 font-heading">{stat.value}</p>
                                    <p className={`text-sm ${textMuted}`}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Preview */}
            <section className={`py-24 px-4 sm:px-6 lg:px-8 ${isDark ? '' : 'bg-[#E4F3EC]'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                                Built for Security,<br />
                                <span className="gradient-text">Designed for Simplicity</span>
                            </h2>
                            <p className={`text-lg mb-8 ${textMuted}`}>
                                CyberVault combines enterprise-grade security with an intuitive
                                interface, making secure file sharing accessible to everyone.
                            </p>
                            <div className={`p-6 rounded-2xl border mb-8 ${isDark ? 'bg-[#1E293B]/50 border-dark-600' : 'bg-white border-gray-200'} shadow-sm`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-primary-500" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${textPrimary}`}>File Protection</h3>
                                </div>
                                <p className={textMuted}>
                                    Every file you upload is immediately secured with AES-256 encryption, whether it is a PDF, image, dataset, or archive. Your files remain completely protected at rest and during transit.
                                </p>
                            </div>
                            <Link to="/features" className="btn-primary">
                                Explore More Features
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="glass-card p-8">
                                <div className="space-y-4">
                                    {['archive.zip', 'data.csv', 'photo.png'].map((file, i) => (
                                        <div key={file} className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-[#1E293B]/50 border-[#334155]/50' : 'bg-[#F9FEFC] border-[#CBD5E1]'}`} style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                <Lock className="h-5 w-5 text-primary-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${textPrimary}`}>{file}</p>
                                                <p className={`text-sm ${textSubtle}`}>Encrypted • Secure</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">Protected</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>



            {/* Security Warning Modal */}
            {showSecurityWarning && fileToDownload && (
                <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className={`p-6 max-w-md w-full animate-slide-up rounded-2xl shadow-2xl border-2 border-red-500/50 ${isDark ? 'bg-[#0F172A]' : 'bg-[#F9FEFC]'}`}>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                                <ShieldAlert className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Malicious File Detected!</h3>
                            <p className={`text-sm ${textMuted}`}>
                                The file <span className="font-bold text-red-500">{fileToDownload.name}</span> has a threat score of <span className="font-bold text-red-500">{fileToDownload.maliciousScore}%</span>.
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl mb-6 text-sm text-left ${isDark ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-800'}`}>
                            <p className="font-semibold mb-1 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Security Warning</p>
                            <p>Our scanning engine detected potential malware in this file. Downloading may harm your device.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => setShowSecurityWarning(false)} className="btn-primary w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-none">
                                Cancel (Recommended)
                            </button>
                            <button onClick={proceedWithUnsafeDownload} className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}>
                                I understand the risks, download anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                file={selectedFile ? {
                    id: selectedFile.id, name: selectedFile.name, hash: selectedFile.hash,
                    expiryDate: selectedFile.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
                    hasPin: selectedFile.hasPin,
                    shareToken: selectedFile.shareToken,
                    shareUrl: selectedFile.shareUrl,
                } : null}
            />

        </div>
    );
}
