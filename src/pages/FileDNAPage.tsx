import { useState, useRef } from 'react';
import { Fingerprint, Upload, Loader2, Copy, Trash2, ChevronDown, ChevronUp, FileCheck, AlertTriangle, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import fileDNAService, { FileDNA } from '../services/fileDNAService';

export default function FileDNAPage() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const compareInputRef = useRef<HTMLInputElement>(null);
    const [records, setRecords] = useState<FileDNA[]>(fileDNAService.getAll());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedForCompare, setSelectedForCompare] = useState<FileDNA | null>(null);
    const [compareResult, setCompareResult] = useState<{ identical: boolean; matchPercentage: number; differences: string[] } | null>(null);
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleAnalyze = async (file: File) => {
        setIsAnalyzing(true);
        try {
            await fileDNAService.generateDNA(file);
            setRecords(fileDNAService.getAll());
            addToast({ type: 'success', title: 'DNA Generated', message: `Fingerprint created for ${file.name}` });
        } catch (err) {
            addToast({ type: 'error', title: 'Analysis Failed', message: (err as Error).message });
        } finally { setIsAnalyzing(false); }
    };

    const handleCompare = async (file: File) => {
        if (!selectedForCompare) return;
        const dna2 = await fileDNAService.generateDNA(file);
        const result = fileDNAService.compareDNA(selectedForCompare, dna2);
        setCompareResult(result);
    };

    const copyHash = async (hash: string) => {
        await navigator.clipboard.writeText(hash);
        addToast({ type: 'info', title: 'Copied', message: 'Hash copied to clipboard' });
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                        <Fingerprint className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm text-cyan-500 font-medium">File Fingerprinting</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>File <span className="gradient-text">DNA Fingerprint</span></h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>Generate unique multi-hash fingerprints with SSH-key-style visual art.</p>
                </div>

                <div className={`glass-card p-8 mb-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600 hover:border-cyan-500/50' : 'border-gray-300 hover:border-cyan-500/50'} transition-all`}>
                    {isAnalyzing ? (
                        <div className="py-4"><Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" /><p className={textPrimary}>Computing fingerprint...</p></div>
                    ) : (
                        <>
                            <Fingerprint className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Analyze File DNA</h3>
                            <p className={`${textMuted} mb-4`}>MD5 • SHA-1 • SHA-256 • SHA-512 • Entropy</p>
                            <label className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25">
                                <Upload className="h-4 w-4" /> Select File
                                <input type="file" className="hidden" ref={fileInputRef} onChange={e => { if (e.target.files?.[0]) handleAnalyze(e.target.files[0]); }} />
                            </label>
                        </>
                    )}
                </div>

                <div className="space-y-4">
                    {records.length === 0 ? (
                        <div className="glass-card p-12 text-center"><Fingerprint className={`h-16 w-16 mx-auto mb-4 ${textMuted} opacity-50`} /><p className={textMuted}>No file fingerprints yet</p></div>
                    ) : records.map(dna => {
                        const isExpanded = expandedId === dna.id;
                        return (
                            <div key={dna.id} className="glass-card overflow-hidden">
                                <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : dna.id)}>
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center"><Fingerprint className="h-5 w-5 text-cyan-500" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold truncate ${textPrimary}`}>{dna.fileName}</h3>
                                        <span className={`text-xs ${textMuted}`}>{(dna.fileSize / 1024).toFixed(1)} KB • Entropy: {dna.entropy.toFixed(3)} • {new Date(dna.timestamp).toLocaleString()}</span>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full ${dna.entropy > 7 ? 'bg-green-500/10 text-green-500' : dna.entropy > 4 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {dna.entropy > 7 ? 'High' : dna.entropy > 4 ? 'Medium' : 'Low'} Entropy
                                    </span>
                                    {isExpanded ? <ChevronUp className={`h-5 w-5 ${textMuted}`} /> : <ChevronDown className={`h-5 w-5 ${textMuted}`} />}
                                </div>
                                {isExpanded && (
                                    <div className={`border-t px-5 pb-5 pt-4 ${isDark ? 'border-[#334155] bg-[#0F172A]/50' : 'border-[#CBD5E1] bg-[#F2FAF6]'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className={`text-xs font-semibold uppercase mb-3 ${textMuted}`}>Hash Fingerprints</h4>
                                                {Object.entries(dna.hashes).map(([algo, hash]) => (
                                                    <div key={algo} className="mb-3">
                                                        <p className={`text-xs font-medium mb-1 ${textMuted}`}>{algo.toUpperCase()}</p>
                                                        <div className="flex items-center gap-2">
                                                            <code className={`text-[11px] font-mono break-all flex-1 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{hash.substring(0, 40)}{hash.length > 40 ? '...' : ''}</code>
                                                            <button onClick={() => copyHash(hash)} className="p-1 rounded hover:bg-cyan-500/10"><Copy className="h-3.5 w-3.5 text-cyan-500" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <h4 className={`text-xs font-semibold uppercase mb-3 ${textMuted}`}>Visual Fingerprint</h4>
                                                <pre className={`text-[11px] font-mono p-4 rounded-xl leading-tight ${isDark ? 'bg-[#1E293B] text-cyan-300' : 'bg-white border border-[#CBD5E1] text-cyan-700'}`}>{dna.fingerprint}</pre>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 pt-4">
                                            <button onClick={() => { setSelectedForCompare(dna); setCompareResult(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 text-sm font-medium"><FileCheck className="h-4 w-4" /> Compare</button>
                                            <button onClick={() => { fileDNAService.delete(dna.id); setRecords(fileDNAService.getAll()); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium ml-auto"><Trash2 className="h-4 w-4" /> Delete</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {selectedForCompare && !compareResult && (
                    <div className="glass-card p-6 mt-6">
                        <h3 className={`font-semibold mb-2 ${textPrimary}`}>Compare: {selectedForCompare.fileName}</h3>
                        <label className="btn-primary cursor-pointer inline-flex items-center gap-2"><Upload className="h-4 w-4" /> Select File to Compare
                            <input type="file" className="hidden" ref={compareInputRef} onChange={e => { if (e.target.files?.[0]) handleCompare(e.target.files[0]); }} />
                        </label>
                    </div>
                )}
                {compareResult && (
                    <div className="glass-card p-6 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${compareResult.identical ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {compareResult.identical ? <Shield className="h-6 w-6 text-green-500" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
                            </div>
                            <div><h3 className={`font-semibold ${textPrimary}`}>{compareResult.identical ? 'Identical!' : 'Files Differ!'}</h3><p className={`text-sm ${textMuted}`}>{compareResult.matchPercentage}% match</p></div>
                        </div>
                        {compareResult.differences.length > 0 && <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>{compareResult.differences.map(d => <p key={d} className="text-xs text-red-500">• {d}</p>)}</div>}
                        <button onClick={() => { setSelectedForCompare(null); setCompareResult(null); }} className="btn-secondary mt-4">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
