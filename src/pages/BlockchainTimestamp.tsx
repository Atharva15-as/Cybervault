import { useState, useEffect, useRef } from 'react';
import {
    Blocks, Upload, Shield, CheckCircle, Clock, Copy, Download,
    FileCheck, Hash, Loader2, ExternalLink, AlertTriangle, Trash2,
    RefreshCw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import blockchainService, { BlockchainTimestamp } from '../services/blockchainService';

export default function BlockchainTimestampPage() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const verifyInputRef = useRef<HTMLInputElement>(null);

    const [timestamps, setTimestamps] = useState<BlockchainTimestamp[]>([]);
    const [isTimestamping, setIsTimestamping] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [verifyResult, setVerifyResult] = useState<{
        valid: boolean; message: string; originalHash?: string; currentHash?: string;
    } | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyTimestampId, setVerifyTimestampId] = useState<string | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        setTimestamps(blockchainService.getAll());
        const interval = setInterval(() => setTimestamps(blockchainService.getAll()), 3000);
        return () => clearInterval(interval);
    }, []);

    const handleTimestamp = async (file: File) => {
        setIsTimestamping(true);
        setProgress(0);

        setProgressStage('Computing SHA-256 hash...');
        setProgress(15);
        await new Promise(r => setTimeout(r, 800));

        setProgressStage('Building Merkle tree...');
        setProgress(35);
        await new Promise(r => setTimeout(r, 600));

        setProgressStage('Anchoring to blockchain...');
        setProgress(55);
        await new Promise(r => setTimeout(r, 1000));

        setProgressStage('Waiting for confirmation...');
        setProgress(75);

        try {
            const ts = await blockchainService.timestampFile(file);
            setProgress(100);
            setProgressStage('Timestamp created!');
            await new Promise(r => setTimeout(r, 500));
            setTimestamps(blockchainService.getAll());
            addToast({ type: 'success', title: 'Blockchain Timestamp Created', message: `${file.name} anchored to ${ts.network}` });
        } catch (err) {
            addToast({ type: 'error', title: 'Timestamping Failed', message: (err as Error).message });
        } finally {
            setIsTimestamping(false);
            setProgress(0);
        }
    };

    const handleVerify = async (file: File) => {
        if (!verifyTimestampId) return;
        const result = await blockchainService.verifyFile(file, verifyTimestampId);
        setVerifyResult(result);
        addToast({
            type: result.valid ? 'success' : 'error',
            title: result.valid ? 'File Verified!' : 'Verification Failed',
            message: result.message
        });
    };

    const downloadCertificate = (ts: BlockchainTimestamp) => {
        const text = blockchainService.generateProofText(ts);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CyberVault_Timestamp_${ts.fileName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addToast({ type: 'success', title: 'Certificate Downloaded', message: 'Proof of existence certificate saved' });
    };

    const downloadJSON = (ts: BlockchainTimestamp) => {
        const json = blockchainService.generateCertificateJSON(ts);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CyberVault_Proof_${ts.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyHash = async (hash: string) => {
        await navigator.clipboard.writeText(hash);
        addToast({ type: 'info', title: 'Copied', message: 'Hash copied to clipboard' });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'anchored': return { color: 'text-green-500 bg-green-500/10 border-green-500/20', label: 'Anchored', icon: <CheckCircle className="h-4 w-4" /> };
            case 'confirmed': return { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'Confirmed', icon: <RefreshCw className="h-4 w-4 animate-spin" /> };
            default: return { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', label: 'Pending', icon: <Clock className="h-4 w-4 animate-pulse" /> };
        }
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                        <Blocks className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-purple-500 font-medium">Proof of Existence</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Blockchain
                        <br />
                        <span className="gradient-text">Timestamps</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Anchor your file's SHA-256 hash to the blockchain. Create immutable, verifiable proof that your file existed at a specific point in time.
                    </p>
                </div>

                {/* How It Works */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { step: '01', title: 'Upload File', desc: 'Select any file to timestamp', icon: Upload },
                        { step: '02', title: 'SHA-256 Hash', desc: 'File is hashed client-side', icon: Hash },
                        { step: '03', title: 'Merkle Tree', desc: 'Hash is included in Merkle tree', icon: Blocks },
                        { step: '04', title: 'Blockchain Anchor', desc: 'Root anchored to blockchain', icon: Shield },
                    ].map((item) => (
                        <div key={item.step} className="glass-card p-5 text-center group card-hover">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/20 transition-all">
                                <item.icon className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="text-xs text-purple-500 font-bold mb-1">STEP {item.step}</div>
                            <h3 className={`font-semibold text-sm mb-1 ${textPrimary}`}>{item.title}</h3>
                            <p className={`text-xs ${textMuted}`}>{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Upload Section */}
                <div className={`glass-card p-8 mb-8 border-2 border-dashed transition-all ${isDark ? 'border-dark-600 hover:border-purple-500/50' : 'border-gray-300 hover:border-purple-500/50'}`}>
                    {isTimestamping ? (
                        <div className="text-center py-6">
                            <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{progressStage}</h3>
                            <div className="max-w-md mx-auto">
                                <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-primary-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <p className={`text-xs mt-2 ${textMuted}`}>{progress}% complete</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-4">
                                <Blocks className="h-8 w-8 text-purple-500" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Timestamp a File</h3>
                            <p className={`${textMuted} mb-4`}>
                                Your file never leaves your device — only its SHA-256 hash is recorded
                            </p>
                            <label className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
                                <Upload className="h-4 w-4" />
                                Select File to Timestamp
                                <input type="file" className="hidden" ref={fileInputRef} onChange={e => { if (e.target.files?.[0]) handleTimestamp(e.target.files[0]); }} />
                            </label>
                            <p className={`text-xs mt-4 ${textMuted}`}>
                                ⛓️ Supports Bitcoin & Ethereum • Merkle Tree Proof • Downloadable Certificate
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {timestamps.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Timestamps', value: timestamps.length, color: 'text-purple-500' },
                            { label: 'Anchored', value: timestamps.filter(t => t.status === 'anchored').length, color: 'text-green-500' },
                            { label: 'Pending', value: timestamps.filter(t => t.status === 'pending').length, color: 'text-yellow-500' },
                            { label: 'Networks Used', value: new Set(timestamps.map(t => t.network)).size, color: 'text-blue-500' },
                        ].map(stat => (
                            <div key={stat.label} className="glass-card p-4 text-center">
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className={`text-xs ${textMuted}`}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamps List */}
                <div className="space-y-4">
                    {timestamps.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Blocks className={`h-16 w-16 mx-auto mb-4 ${textMuted} opacity-50`} />
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>No Timestamps Yet</h3>
                            <p className={textMuted}>Upload a file to create your first blockchain timestamp</p>
                        </div>
                    ) : (
                        timestamps.map(ts => {
                            const statusInfo = getStatusInfo(ts.status);
                            const isExpanded = expandedId === ts.id;
                            return (
                                <div key={ts.id} className="glass-card overflow-hidden">
                                    {/* Main Row */}
                                    <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ts.id)}>
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                            <Blocks className="h-6 w-6 text-purple-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate ${textPrimary}`}>{ts.fileName}</h3>
                                            <div className="flex items-center gap-3 flex-wrap mt-1">
                                                <span className={`text-xs ${textMuted}`}>{ts.fileSize}</span>
                                                <span className={`text-xs ${textMuted}`}>{ts.network}</span>
                                                <span className={`text-xs ${textMuted}`}>Block #{ts.blockHeight}</span>
                                                <span className={`text-xs ${textMuted}`}>{new Date(ts.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            {statusInfo.label}
                                        </span>
                                        <span className={`text-xs ${textMuted}`}>{ts.confirmations} conf</span>
                                        {isExpanded ? <ChevronUp className={`h-5 w-5 ${textMuted}`} /> : <ChevronDown className={`h-5 w-5 ${textMuted}`} />}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className={`border-t px-5 pb-5 pt-4 ${isDark ? 'border-[#334155] bg-[#0F172A]/50' : 'border-[#CBD5E1] bg-[#F2FAF6]'}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                {/* Hash Details */}
                                                <div>
                                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Cryptographic Proof</h4>
                                                    {[
                                                        { label: 'SHA-256 Hash', value: ts.fileHash },
                                                        { label: 'Merkle Root', value: ts.merkleRoot },
                                                        { label: 'Block Hash', value: ts.blockHash },
                                                        { label: 'Transaction', value: ts.txHash },
                                                    ].map(item => (
                                                        <div key={item.label} className="mb-3">
                                                            <p className={`text-xs font-medium mb-1 ${textMuted}`}>{item.label}</p>
                                                            <div className="flex items-center gap-2">
                                                                <code className={`text-xs font-mono break-all flex-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                                                    {item.value.substring(0, 32)}...
                                                                </code>
                                                                <button onClick={(e) => { e.stopPropagation(); copyHash(item.value); }}
                                                                    className="p-1 rounded hover:bg-purple-500/10 transition-colors flex-shrink-0">
                                                                    <Copy className="h-3.5 w-3.5 text-purple-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Certificate Visual */}
                                                <div>
                                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Certificate</h4>
                                                    <div className={`p-4 rounded-xl text-xs font-mono ${isDark ? 'bg-[#1E293B]' : 'bg-white border border-[#CBD5E1]'}`}>
                                                        <p className="text-purple-500 mb-1">╔══ PROOF OF EXISTENCE ══╗</p>
                                                        <p className={textMuted}>File: {ts.fileName}</p>
                                                        <p className={textMuted}>Size: {ts.fileSize}</p>
                                                        <p className={textMuted}>Network: {ts.network}</p>
                                                        <p className={textMuted}>Block: #{ts.blockHeight}</p>
                                                        <p className={textMuted}>Confirmations: {ts.confirmations}</p>
                                                        <p className={textMuted}>Time: {new Date(ts.timestamp).toLocaleString()}</p>
                                                        <p className="text-green-500 mt-1">Status: {ts.status.toUpperCase()}</p>
                                                        <p className="text-purple-500 mt-1">╚═══════════════════════╝</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-3 pt-3">
                                                <button onClick={() => downloadCertificate(ts)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 text-sm font-medium transition-all">
                                                    <Download className="h-4 w-4" /> Download Certificate
                                                </button>
                                                <button onClick={() => downloadJSON(ts)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-sm font-medium transition-all">
                                                    <FileCheck className="h-4 w-4" /> Download Proof (JSON)
                                                </button>
                                                <button onClick={() => { setVerifyTimestampId(ts.id); setShowVerifyModal(true); setVerifyResult(null); }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 text-sm font-medium transition-all">
                                                    <Shield className="h-4 w-4" /> Verify File
                                                </button>
                                                <button onClick={() => window.open(ts.proofUrl, '_blank')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-white/5 text-dark-300 hover:bg-white/10' : 'bg-black/5 text-gray-600 hover:bg-black/10'}`}>
                                                    <ExternalLink className="h-4 w-4" /> View on Explorer
                                                </button>
                                                <button onClick={() => { blockchainService.delete(ts.id); setTimestamps(blockchainService.getAll()); addToast({ type: 'info', title: 'Deleted', message: 'Timestamp record removed' }); }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-all ml-auto">
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Verify Modal */}
                {showVerifyModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className={`glass-card p-6 max-w-md w-full animate-slide-up ${isDark ? '' : 'bg-[#F9FEFC]'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-lg font-semibold ${textPrimary}`}>Verify File Integrity</h3>
                                <button onClick={() => setShowVerifyModal(false)} className={`p-2 rounded-lg ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-gray-500 hover:text-gray-900 hover:bg-[#E4F3EC]'}`}>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {!verifyResult ? (
                                <div className="text-center">
                                    <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                                    <p className={`mb-4 ${textMuted}`}>
                                        Upload the same file to verify it hasn't been modified since timestamping.
                                    </p>
                                    <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        Select File to Verify
                                        <input type="file" className="hidden" ref={verifyInputRef} onChange={e => { if (e.target.files?.[0]) handleVerify(e.target.files[0]); }} />
                                    </label>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${verifyResult.valid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        {verifyResult.valid
                                            ? <CheckCircle className="h-8 w-8 text-green-500" />
                                            : <AlertTriangle className="h-8 w-8 text-red-500" />}
                                    </div>
                                    <h4 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                        {verifyResult.valid ? 'Integrity Verified!' : 'Verification Failed!'}
                                    </h4>
                                    <p className={`text-sm mb-4 ${textMuted}`}>{verifyResult.message}</p>
                                    {verifyResult.originalHash && (
                                        <div className={`p-3 rounded-xl text-left text-xs ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                            <p className={textMuted}>Original: <code className="font-mono">{verifyResult.originalHash.substring(0, 24)}...</code></p>
                                            <p className={textMuted}>Current: <code className="font-mono">{verifyResult.currentHash?.substring(0, 24)}...</code></p>
                                            <p className={`mt-1 font-medium ${verifyResult.valid ? 'text-green-500' : 'text-red-500'}`}>
                                                {verifyResult.valid ? '✅ Hashes match' : '❌ Hashes differ'}
                                            </p>
                                        </div>
                                    )}
                                    <button onClick={() => { setShowVerifyModal(false); setVerifyResult(null); }} className="btn-primary mt-4">Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
