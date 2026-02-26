import { useState, useRef, useEffect } from 'react';
import {
    Upload,
    File as FileIcon,
    Lock,
    Download,
    Trash2,
    Clock,
    Search,
    Filter,
    Shield,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    Loader2,
    Link as LinkIcon,
    Share2,
    HardDrive
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

import { generateShareToken } from '../utils/crypto';
import { fileService } from '../services/fileService';
import { activityService } from '../services/activityService';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';

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

// Mock data for demonstration
const initialFiles: SecureFile[] = [
    {
        id: '1',
        name: 'Financial_Report_2024.pdf',
        size: '2.4 MB',
        uploadDate: '2024-01-15',
        status: 'encrypted',
        shared: true,
        expiresIn: '5 days',
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        maliciousScore: 2,
        securityStatus: 'safe',
        hash: 'a3f2c8d1e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        pinHash: 'hashed_pin_1',
        hasPin: true,
        shareToken: 'demo123',
        shareUrl: `${window.location.origin}/share/demo123`,
    },
    {
        id: '2',
        name: 'Project_Documentation.docx',
        size: '1.8 MB',
        uploadDate: '2024-01-14',
        status: 'encrypted',
        shared: false,
        expiresIn: null,
        expiryDate: null,
        maliciousScore: 0,
        securityStatus: 'safe',
        hash: 'b4e3d9c2f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
        pinHash: '',
        hasPin: false,
        shareToken: '',
        shareUrl: '',
    },
    {
        id: '3',
        name: 'suspicious_script.exe',
        size: '4.2 MB',
        uploadDate: '2024-01-13',
        status: 'encrypted',
        shared: true,
        expiresIn: '2 days',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        maliciousScore: 85,
        securityStatus: 'danger',
        hash: 'c5f4e0d3a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
        pinHash: 'hashed_pin_3',
        hasPin: true,
        shareToken: 'abc456',
        shareUrl: `${window.location.origin}/share/abc456`,
    },
    {
        id: '4',
        name: 'unknown_archive.zip',
        size: '15.6 MB',
        uploadDate: '2024-01-10',
        status: 'encrypted',
        shared: false,
        expiresIn: null,
        expiryDate: null,
        maliciousScore: 45,
        securityStatus: 'warning',
        hash: 'd6a5f1e4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
        pinHash: '',
        hasPin: false,
        shareToken: '',
        shareUrl: '',
    },
];

export default function Dashboard() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const [files, setFiles] = useState<SecureFile[]>(initialFiles);
    const [searchQuery, setSearchQuery] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Modals
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    // Selection state
    const [selectedFile, setSelectedFile] = useState<SecureFile | null>(null);
    const [fileToDownload, setFileToDownload] = useState<SecureFile | null>(null);

    // Upload state
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    // Animated counter state
    const [animatedStats, setAnimatedStats] = useState({ total: 0, encrypted: 0, shared: 0 });

    useEffect(() => {
        const target = { total: files.length, encrypted: files.length, shared: files.filter(f => f.shared).length };
        const duration = 800;
        const steps = 30;
        const interval = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setAnimatedStats({
                total: Math.round(target.total * eased),
                encrypted: Math.round(target.encrypted * eased),
                shared: Math.round(target.shared * eased),
            });
            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, [files]);

    // Compute storage
    const totalStorage = files.reduce((acc, f) => {
        const num = parseFloat(f.size);
        return acc + (isNaN(num) ? 0 : num);
    }, 0);



    // Text helpers
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            simulateFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            simulateFileUpload(e.target.files[0]);
        }
    };

    // Simulate scanning and upload process
    const simulateFileUpload = (file: File) => {
        setIsScanning(true);
        setScanProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        // Completion after 2 seconds - show upload modal for PIN/expiry
        setTimeout(async () => {
            clearInterval(interval);
            setIsScanning(false);
            setPendingFile(file);
            setShowUploadModal(true);
        }, 2500);
    };

    // Handle secure upload completion from modal
    const handleUploadComplete = async (uploadData: {
        file: File;
        hash: string;
        pin: string;
        pinHash: string;
        expiryDuration: string;
        expiryDate: Date;
    }) => {
        const { file, hash, pinHash, expiryDuration, expiryDate } = uploadData;

        // Generate random malicious score logic for demo
        let score = Math.floor(Math.random() * 10);

        if (file.name.toLowerCase().includes('malicious') || file.name.toLowerCase().includes('virus')) {
            score = 85 + Math.floor(Math.random() * 15);
        } else if (Math.random() > 0.8) {
            score = Math.floor(Math.random() * 100);
        }

        let status: SecureFile['securityStatus'] = 'safe';
        if (score > 75) status = 'danger';
        else if (score > 30) status = 'warning';

        // Format expiry display
        const expiryLabels: { [key: string]: string } = {
            '1h': '1 hour',
            '6h': '6 hours',
            '24h': '24 hours',
            '7d': '7 days',
            '30d': '30 days'
        };

        // Generate share token and URL
        const shareToken = generateShareToken();
        const shareUrl = `${window.location.origin}/share/${shareToken}`;
        const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        const newFile: SecureFile = {
            id: Date.now().toString(),
            name: file.name,
            size: fileSize,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'encrypted',
            shared: false,
            expiresIn: expiryLabels[expiryDuration] || expiryDuration,
            expiryDate: expiryDate,
            maliciousScore: score,
            securityStatus: status,
            hash: hash,
            pinHash: pinHash,
            hasPin: true,
            shareToken: shareToken,
            shareUrl: shareUrl,
        };

        // Save to Supabase database
        try {
            const { error } = await fileService.createFile({
                file_name: file.name,
                file_size: fileSize,
                file_hash: hash,
                pin_hash: pinHash,
                share_token: shareToken,
                share_url: shareUrl,
                expiry_date: expiryDate,
                expiry_duration: expiryDuration,
                malicious_score: score,
                security_status: status,
            });

            if (error) {
                console.error('Failed to save file to database:', error);
                // Continue anyway - file will work locally
            } else {
                console.log('File saved to database successfully');
            }
        } catch (err) {
            console.error('Database error:', err);
        }



        setFiles(prev => [newFile, ...prev]);
        setPendingFile(null);
        addToast({ type: 'success', title: 'File Uploaded', message: `${file.name} has been encrypted and stored securely` });
        activityService.log('file_upload', 'File Uploaded', `Uploaded ${file.name} (${fileSize})`, { fileName: file.name });
    };

    const handleShare = (file: SecureFile) => {
        setSelectedFile(file);
        setShowShareModal(true);
        addToast({ type: 'info', title: 'Share Link', message: `Sharing options for ${file.name}` });
        activityService.log('file_share', 'File Shared', `Opened sharing for ${file.name}`, { fileName: file.name });
    };

    const handleDownloadClick = (file: SecureFile) => {
        if (file.maliciousScore > 30) {
            setFileToDownload(file);
            setShowSecurityWarning(true);
        } else {
            addToast({ type: 'success', title: 'Download Started', message: `Downloading ${file.name}...` });
            activityService.log('file_download', 'File Downloaded', `Downloaded ${file.name}`, { fileName: file.name });
        }
    };

    const proceedWithUnsafeDownload = () => {
        if (fileToDownload) {
            addToast({ type: 'warning', title: 'Unsafe Download', message: `Downloading ${fileToDownload.name} despite warnings...` });
            activityService.log('file_download', 'Unsafe File Downloaded', `Downloaded potentially unsafe file: ${fileToDownload.name}`, { fileName: fileToDownload.name });
            setShowSecurityWarning(false);
            setFileToDownload(null);
        }
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSecurityColor = (score: number) => {
        if (score > 75) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score > 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const getSecurityIcon = (status: SecureFile['securityStatus']) => {
        switch (status) {
            case 'danger': return <ShieldAlert className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            default: return <ShieldCheck className="h-4 w-4" />;
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Dashboard</h1>
                        <p className={textMuted}>Manage your encrypted files securely</p>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                <FileIcon className="h-5 w-5 text-primary-500" />
                            </div>
                            <div>
                                <p className={`text-xs ${textMuted}`}>Total Files</p>
                                <p className={`text-xl font-bold ${textPrimary} animate-count-up`}>{animatedStats.total}</p>
                            </div>
                        </div>
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Lock className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className={`text-xs ${textMuted}`}>Encrypted</p>
                                <p className={`text-xl font-bold ${textPrimary} animate-count-up`}>{animatedStats.encrypted}</p>
                            </div>
                        </div>
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Share2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className={`text-xs ${textMuted}`}>Shared</p>
                                <p className={`text-xl font-bold ${textPrimary} animate-count-up`}>{animatedStats.shared}</p>
                            </div>
                        </div>
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <HardDrive className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className={`text-xs ${textMuted}`}>Storage</p>
                                <p className={`text-xl font-bold ${textPrimary} animate-count-up`}>{totalStorage.toFixed(1)} MB</p>
                            </div>
                        </div>
                    </div>
                </div>




                {/* Upload Section */}
                <div
                    className={`glass-card p-8 mb-8 border-2 border-dashed transition-all relative overflow-hidden ${dragActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : isDark
                            ? 'border-dark-600 hover:border-primary-500/50'
                            : 'border-gray-300 hover:border-primary-500/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isScanning ? (
                        <div className="text-center py-4">
                            <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                Scanning File for Threats...
                            </h3>
                            <p className={`${textMuted} mb-4`}>
                                Analyzing file integrity and checking for malicious signatures.
                            </p>
                            <div className="max-w-md mx-auto h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-4">
                                <Upload className="h-8 w-8 text-primary-500" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                Upload Files
                            </h3>
                            <p className={`${textMuted} mb-4`}>
                                Drag and drop files here, or click to select
                            </p>
                            <label className="btn-primary cursor-pointer inline-flex">
                                <Upload className="h-4 w-4 mr-2" />
                                Select Files
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                            </label>
                            <p className={`text-xs mt-4 ${textMuted}`}>
                                Automatic virus scanning enabled • AES-256 Encryption
                            </p>
                        </div>
                    )}
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-12"
                        />
                    </div>
                    <button className="btn-secondary">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </button>
                </div>

                {/* Files List */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        File Name
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Size
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Security Scan
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Sharing
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className={`transition-colors ${isDark ? 'hover:bg-dark-800/50' : 'hover:bg-gray-50'}`}>
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
                                        <td className={`px-6 py-4 whitespace-nowrap ${textMuted}`}>
                                            {file.size}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium w-fit ${getSecurityColor(file.maliciousScore)}`}>
                                                    {getSecurityIcon(file.securityStatus)}
                                                    {file.securityStatus === 'safe' ? 'Safe' : file.securityStatus === 'warning' ? 'Suspicious' : 'Malicious'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 ml-1">
                                                    Threat Level: {file.maliciousScore}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {file.shared ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-500 text-xs font-medium">
                                                        <LinkIcon className="h-3 w-3" />
                                                        Shared
                                                    </span>
                                                    {file.expiresIn && (
                                                        <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                                                            <Clock className="h-3 w-3" />
                                                            {file.expiresIn}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={`text-sm ${textMuted}`}>Not shared</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleShare(file)}
                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-primary-400 hover:bg-dark-700' : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'}`}
                                                    title="Share"
                                                >
                                                    <LinkIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadClick(file)}
                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                                    title="Download"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </button>
                                                <button
                                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-dark-700' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
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

                    {filteredFiles.length === 0 && (
                        <div className="text-center py-12">
                            <Shield className={`h-12 w-12 mx-auto mb-4 ${textMuted}`} />
                            <p className={textMuted}>No files found</p>
                        </div>
                    )}
                </div>





                {/* Security Warning Modal */}
                {showSecurityWarning && fileToDownload && (
                    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className={`p-6 max-w-md w-full animate-slide-up rounded-2xl shadow-2xl border-2 border-red-500/50 ${isDark ? 'bg-dark-900' : 'bg-white'
                            }`}>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                                    <ShieldAlert className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Malicious File Detected!
                                </h3>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    The file <span className="font-bold text-red-500">{fileToDownload.name}</span> has a high threat score of <span className="font-bold text-red-500">{fileToDownload.maliciousScore}%</span>.
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl mb-6 text-sm text-left ${isDark ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-800'
                                }`}>
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Security Warning
                                </p>
                                <p>
                                    Our scanning engine detected potential malware or suspicious code signatures in this file. Downloading it may harm your device or compromise your data.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setShowSecurityWarning(false)}
                                    className="btn-primary w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-none"
                                >
                                    Cancel (Recommended)
                                </button>
                                <button
                                    onClick={proceedWithUnsafeDownload}
                                    className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${isDark
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    I understand the risks, download anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal - PIN & Expiry Settings */}
                <UploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setPendingFile(null);
                    }}
                    file={pendingFile}
                    onUploadComplete={handleUploadComplete}
                />

                {/* Enhanced Share Modal with QR Code */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    file={selectedFile ? {
                        id: selectedFile.id,
                        name: selectedFile.name,
                        hash: selectedFile.hash,
                        expiryDate: selectedFile.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
                        hasPin: selectedFile.hasPin
                    } : null}
                />
            </div>
        </div>
    );
}
