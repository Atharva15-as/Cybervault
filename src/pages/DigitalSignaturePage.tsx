import { useState, useRef } from 'react';
import { PenTool, Upload, Shield, Loader2, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import digitalSignatureService, { DigitalSignature } from '../services/digitalSignatureService';

export default function DigitalSignaturePage() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const signInputRef = useRef<HTMLInputElement>(null);
    const verifyInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'sign' | 'verify'>('sign');
    const [signatures, setSignatures] = useState<DigitalSignature[]>(digitalSignatureService.getAll());
    const [isProcessing, setIsProcessing] = useState(false);
    const [signerName, setSignerName] = useState('');
    const [selectedSig, setSelectedSig] = useState<DigitalSignature | null>(null);
    const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleSign = async (file: File) => {
        if (!signerName.trim()) { addToast({ type: 'error', title: 'Name Required', message: 'Enter your name to sign' }); return; }
        setIsProcessing(true);
        try {
            await digitalSignatureService.signFile(file, signerName);
            setSignatures(digitalSignatureService.getAll());
            addToast({ type: 'success', title: 'File Signed!', message: `${file.name} signed with ECDSA-P256` });
        } catch (err) {
            addToast({ type: 'error', title: 'Signing Failed', message: (err as Error).message });
        } finally { setIsProcessing(false); }
    };

    const handleVerify = async (file: File) => {
        if (!selectedSig) return;
        setIsProcessing(true);
        try {
            const result = await digitalSignatureService.verifySignature(file, selectedSig);
            setVerifyResult(result);
        } catch (err) {
            setVerifyResult({ valid: false, message: (err as Error).message });
        } finally { setIsProcessing(false); }
    };

    const downloadCert = (sig: DigitalSignature) => {
        const text = digitalSignatureService.generateCertificate(sig);
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `signature_${sig.fileName}.txt`; a.click();
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <PenTool className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-indigo-500 font-medium">ECDSA Signatures</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>Digital <span className="gradient-text">Signatures</span></h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Cryptographically sign files to prove authenticity. Verify signatures to ensure files haven't been tampered with.
                    </p>
                </div>

                <div className={`flex gap-2 mb-8 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <button onClick={() => setActiveTab('sign')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'sign' ? 'bg-indigo-500 text-white' : textMuted}`}>
                        <PenTool className="h-4 w-4" /> Sign File
                    </button>
                    <button onClick={() => setActiveTab('verify')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'verify' ? 'bg-indigo-500 text-white' : textMuted}`}>
                        <Shield className="h-4 w-4" /> Verify Signature
                    </button>
                </div>

                {isProcessing ? (
                    <div className="glass-card p-12 text-center">
                        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
                        <p className={textPrimary}>{activeTab === 'sign' ? 'Signing file with ECDSA...' : 'Verifying signature...'}</p>
                    </div>
                ) : activeTab === 'sign' ? (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className={`font-semibold mb-3 ${textPrimary}`}>Your Name (Signer Identity)</h3>
                            <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
                                placeholder="Enter your name..." className="input-field" />
                        </div>
                        <div className={`glass-card p-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                            <PenTool className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                            <h3 className={`font-semibold mb-2 ${textPrimary}`}>Select File to Sign</h3>
                            <p className={`text-sm mb-4 ${textMuted}`}>ECDSA-P256-SHA256 digital signature</p>
                            <label className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25">
                                <Upload className="h-4 w-4" /> Choose File
                                <input type="file" className="hidden" ref={signInputRef} onChange={e => { if (e.target.files?.[0]) handleSign(e.target.files[0]); }} />
                            </label>
                        </div>

                        {/* Signatures List */}
                        <div className="space-y-3">
                            {signatures.map(sig => (
                                <div key={sig.id} className="glass-card p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><PenTool className="h-5 w-5 text-indigo-500" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium truncate ${textPrimary}`}>{sig.fileName}</h4>
                                        <p className={`text-xs ${textMuted}`}>Signed by {sig.signerName} • {new Date(sig.signedAt).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => downloadCert(sig)} className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-500/10"><Download className="h-4 w-4" /></button>
                                    <button onClick={() => { digitalSignatureService.delete(sig.id); setSignatures(digitalSignatureService.getAll()); }}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className={`font-semibold mb-3 ${textPrimary}`}>Select Signature to Verify Against</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {signatures.length === 0 ? (
                                    <p className={textMuted}>No signatures yet. Sign a file first.</p>
                                ) : signatures.map(sig => (
                                    <button key={sig.id} onClick={() => { setSelectedSig(sig); setVerifyResult(null); }}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selectedSig?.id === sig.id ? 'bg-indigo-500/20 border border-indigo-500/30' : isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-[#E4F3EC]'}`}>
                                        <PenTool className={`h-4 w-4 ${selectedSig?.id === sig.id ? 'text-indigo-500' : textMuted}`} />
                                        <div><p className={`text-sm font-medium ${textPrimary}`}>{sig.fileName}</p><p className={`text-xs ${textMuted}`}>by {sig.signerName}</p></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedSig && !verifyResult && (
                            <div className={`glass-card p-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                <Shield className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                                <h3 className={`font-semibold mb-2 ${textPrimary}`}>Upload File to Verify</h3>
                                <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                    <Upload className="h-4 w-4" /> Choose File
                                    <input type="file" className="hidden" ref={verifyInputRef} onChange={e => { if (e.target.files?.[0]) handleVerify(e.target.files[0]); }} />
                                </label>
                            </div>
                        )}

                        {verifyResult && (
                            <div className="glass-card p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${verifyResult.valid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {verifyResult.valid ? <CheckCircle className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-red-500" />}
                                </div>
                                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{verifyResult.valid ? 'Signature Valid!' : 'Invalid Signature!'}</h3>
                                <p className={`text-sm ${textMuted}`}>{verifyResult.message}</p>
                                <button onClick={() => { setVerifyResult(null); setSelectedSig(null); }} className="btn-secondary mt-4">Verify Another</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
