import { useState, useRef } from 'react';
import { FileSearch, Upload, Shield, AlertTriangle, Loader2, Download, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import metadataService, { FileMetadata, MetadataEntry } from '../services/metadataService';

export default function MetadataStripper() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<FileMetadata | null>(null);
    const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleAnalyze = async (file: File) => {
        setIsAnalyzing(true);
        setOriginalFile(file);
        try {
            const metadata = await metadataService.analyzeFile(file);
            setResult(metadata);
            addToast({ type: 'success', title: 'Analysis Complete', message: `Found ${metadata.metadata.length} metadata entries` });
        } catch (err) {
            addToast({ type: 'error', title: 'Analysis Failed', message: (err as Error).message });
        } finally { setIsAnalyzing(false); }
    };

    const handleStrip = async () => {
        if (!originalFile) return;
        try {
            const blob = await metadataService.stripImageMetadata(originalFile);
            setStrippedBlob(blob);
            addToast({ type: 'success', title: 'Metadata Stripped', message: 'Clean file ready for download' });
        } catch (err) {
            addToast({ type: 'error', title: 'Stripping Failed', message: (err as Error).message });
        }
    };

    const downloadStripped = () => {
        if (!strippedBlob || !originalFile) return;
        const url = URL.createObjectURL(strippedBlob);
        const a = document.createElement('a'); a.href = url;
        a.download = `clean_${originalFile.name}`; a.click();
        URL.revokeObjectURL(url);
    };

    const getRiskColor = (risk: MetadataEntry['risk']) => {
        if (risk === 'danger') return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (risk === 'warning') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const getRiskIcon = (risk: MetadataEntry['risk']) => {
        if (risk === 'danger') return <AlertTriangle className="h-3.5 w-3.5" />;
        if (risk === 'warning') return <AlertTriangle className="h-3.5 w-3.5" />;
        return <Shield className="h-3.5 w-3.5" />;
    };

    const steps = [
        { step: '1', title: 'Upload File', desc: 'Select any image or file to scan for hidden metadata.' },
        { step: '2', title: 'Analyze Data', desc: 'We extract EXIF, GPS, author info, and software versions.' },
        { step: '3', title: 'Strip & Download', desc: 'Remove sensitive data and create a privacy-safe copy.' },
    ];

    const features = [
        { icon: FileSearch, title: 'Deep Scan', desc: 'Detects over 50+ types of hidden metadata tags.' },
        { icon: Shield, title: 'Privacy Score', desc: 'Rates your file\'s privacy risk before you share it.' },
        { icon: Trash2, title: 'Safe Stripping', desc: 'Removes metadata without affecting image quality.' },
    ];

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                        <FileSearch className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-500 font-medium">Privacy Protection</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Metadata <span className="gradient-text">Stripper</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Analyze and remove hidden metadata from files — GPS coordinates, author info, device details, and more.
                    </p>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT SIDE — How to Use + Features */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-6 sticky top-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>How to Use</h2>
                            </div>

                            <div className="space-y-5">
                                {steps.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-orange-500/25">
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <h4 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{item.title}</h4>
                                            <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`my-6 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`} />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-orange-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>Features & Working</h2>
                            </div>

                            <div className="space-y-4">
                                {features.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="h-4 w-4 text-orange-500" />
                                            <h4 className={`text-sm font-semibold ${textPrimary}`}>{item.title}</h4>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE — Tool */}
                    <div className="lg:col-span-8">
                        <div className={`glass-card p-8 mb-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600 hover:border-orange-500/50' : 'border-gray-300 hover:border-orange-500/50'} transition-all`}>
                            {isAnalyzing ? (
                                <div className="py-4"><Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" /><p className={textPrimary}>Analyzing metadata...</p></div>
                            ) : (
                                <>
                                    <FileSearch className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                                    <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Analyze File Metadata</h3>
                                    <p className={`text-sm mb-4 ${textMuted}`}>Detect hidden information before sharing</p>
                                    <label className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25">
                                        <Upload className="h-4 w-4" /> Select File
                                        <input type="file" className="hidden" ref={fileInputRef} onChange={e => { if (e.target.files?.[0]) handleAnalyze(e.target.files[0]); }} />
                                    </label>
                                </>
                            )}
                        </div>

                        {result && (
                            <>
                                {/* Privacy Score */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="glass-card p-5 text-center">
                                        <p className={`text-3xl font-bold ${result.privacyScore >= 70 ? 'text-green-500' : result.privacyScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {result.privacyScore}%
                                        </p>
                                        <p className={`text-xs ${textMuted}`}>Privacy Score</p>
                                    </div>
                                    <div className="glass-card p-5 text-center">
                                        <p className={`text-3xl font-bold ${result.riskLevel === 'high' ? 'text-red-500' : result.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {result.riskLevel.toUpperCase()}
                                        </p>
                                        <p className={`text-xs ${textMuted}`}>Risk Level</p>
                                    </div>
                                    <div className="glass-card p-5 text-center">
                                        <p className={`text-3xl font-bold text-orange-500`}>{result.metadata.length}</p>
                                        <p className={`text-xs ${textMuted}`}>Entries Found</p>
                                    </div>
                                </div>

                                {/* Metadata Entries */}
                                <div className="glass-card overflow-hidden mb-6">
                                    <div className={`px-5 py-3 border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                        <h3 className={`font-semibold ${textPrimary}`}>Detected Metadata</h3>
                                    </div>
                                    <div className="divide-y divide-gray-700/20">
                                        {result.metadata.map((entry, i) => (
                                            <div key={i} className="px-5 py-3 flex items-center gap-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${getRiskColor(entry.risk)}`}>
                                                    {getRiskIcon(entry.risk)} {entry.risk}
                                                </span>
                                                <span className={`text-xs font-medium min-w-[80px] ${textMuted}`}>{entry.category}</span>
                                                <span className={`text-sm font-medium flex-1 ${textPrimary}`}>{entry.key}</span>
                                                <span className={`text-xs truncate max-w-[200px] ${textMuted}`} title={entry.value}>{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3">
                                    {originalFile?.type.startsWith('image/') && !strippedBlob && (
                                        <button onClick={handleStrip} className="btn-primary flex items-center gap-2">
                                            <Trash2 className="h-4 w-4" /> Strip Metadata & Create Clean Copy
                                        </button>
                                    )}
                                    {strippedBlob && (
                                        <button onClick={downloadStripped} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 font-medium">
                                            <Download className="h-4 w-4" /> Download Clean File ({(strippedBlob.size / 1024).toFixed(1)} KB)
                                        </button>
                                    )}
                                    <button onClick={() => { setResult(null); setStrippedBlob(null); setOriginalFile(null); }} className="btn-secondary">Analyze Another File</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
