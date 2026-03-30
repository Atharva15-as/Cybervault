import { useState, useRef } from 'react';
import {
    Lock, KeyRound, Shield, Upload, Download, Copy, Check, Eye, EyeOff,
    RefreshCw, Loader2, X, FileCheck, AlertCircle, BookOpen, Zap, ShieldCheck, FileKey
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import encryptionService from '../services/encryptionService';

export default function SecureEncrypt() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const encryptInputRef = useRef<HTMLInputElement>(null);
    const decryptInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [passphrase, setPassphrase] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [showEncryptedKey, setShowEncryptedKey] = useState(false);
    const [showDecryptKey, setShowDecryptKey] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');

    // Encryption state
    const [encryptedResult, setEncryptedResult] = useState<{
        blob: Blob; passphraseUsed: string; originalName: string; originalSize: number;
    } | null>(null);
    const [keyCopied, setKeyCopied] = useState(false);

    // Decryption state
    const [decryptKey, setDecryptKey] = useState('');
    const [decryptedResult, setDecryptedResult] = useState<{ blob: Blob; fileName: string } | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const strength = passphrase ? encryptionService.estimateStrength(passphrase) : null;

    const toEncFileName = (name: string) => {
        const lastDotIndex = name.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0;
        const baseName = hasExtension ? name.slice(0, lastDotIndex) : name;
        return `${baseName}.enc`;
    };

    const handleEncrypt = async (file: File) => {
        setIsProcessing(true);
        try {
            setProgress('Generating encryption key...');
            setProgress('Encrypting file with AES-256-GCM...');
            const result = await encryptionService.encryptFile(file, passphrase);
            setEncryptedResult(result);
            addToast({ type: 'success', title: 'File Encrypted', message: `${file.name} encrypted successfully` });
        } catch (err) {
            addToast({ type: 'error', title: 'Encryption Failed', message: (err as Error).message });
        } finally {
            setIsProcessing(false);
            setProgress('');
        }
    };

    const handleDecrypt = async (file: File) => {
        if (!decryptKey) {
            addToast({ type: 'error', title: 'Missing Key', message: 'Enter the encryption key to decrypt' });
            return;
        }
        setIsProcessing(true);
        try {
            setProgress('Decrypting file...');
            const result = await encryptionService.decryptFile(
                new Blob([await file.arrayBuffer()]), decryptKey
            );
            setDecryptedResult(result);
            addToast({ type: 'success', title: 'File Decrypted', message: `${result.fileName} decrypted successfully` });
        } catch {
            addToast({ type: 'error', title: 'Decryption Failed', message: 'Invalid key, IV, or corrupted file' });
        } finally {
            setIsProcessing(false);
            setProgress('');
        }
    };

    const downloadEncrypted = () => {
        if (!encryptedResult) return;
        const url = URL.createObjectURL(encryptedResult.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = toEncFileName(encryptedResult.originalName);
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadDecrypted = () => {
        if (!decryptedResult) return;
        const url = URL.createObjectURL(decryptedResult.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = decryptedResult.fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateRandomPassphrase = () => {
        setPassphrase(encryptionService.generatePassphrase(4));
    };

    const copyKey = async () => {
        if (encryptedResult) {
            await navigator.clipboard.writeText(encryptedResult.passphraseUsed);
            setKeyCopied(true);
            setTimeout(() => setKeyCopied(false), 2000);
            addToast({ type: 'info', title: 'Key Copied', message: 'Encryption key copied to clipboard' });
        }
    };

    const encryptSteps = [
        { step: '1', title: 'Set a Passphrase (Optional)', desc: 'Choose a strong passphrase to derive your encryption key, or leave it empty to auto-generate a random key.' },
        { step: '2', title: 'Select Your File', desc: 'Click "Choose File" and pick any file from your device. It will be encrypted entirely in your browser.' },
        { step: '3', title: 'Download Encrypted File', desc: 'Once encrypted, download the .enc file. This file is unreadable without the correct key.' },
        { step: '4', title: 'Save Your Key', desc: 'Copy and securely store the Encryption Key. Without it, the file cannot be recovered.' },
    ];

    const decryptSteps = [
        { step: '1', title: 'Paste Your Key', desc: 'Enter the Encryption Key that was generated or used during encryption.' },
        { step: '2', title: 'Upload Encrypted File', desc: 'Select the .enc file from your device that you want to decrypt.' },
        { step: '3', title: 'Download Original File', desc: 'After successful decryption, download your original file — fully restored and intact.' },
    ];

    const features = [
        { icon: ShieldCheck, title: 'Client-Side Only', desc: 'All encryption happens in your browser. Unencrypted data never leaves your device.' },
        { icon: Zap, title: 'AES-256-GCM', desc: 'Military-grade authenticated encryption ensuring both confidentiality and integrity.' },
        { icon: FileKey, title: 'Zero Knowledge', desc: 'Without the key, nobody — including us — can read your files. True privacy by design.' },
    ];

    const currentSteps = activeTab === 'encrypt' ? encryptSteps : decryptSteps;

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <Lock className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-500 font-medium">End-to-End Encryption</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Client-Side <span className="gradient-text">E2E Encryption</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Encrypt files in your browser using AES-256-GCM. Your data never leaves your device unencrypted.
                    </p>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT SIDE — How to Use + Features */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* How to Use */}
                        <div className="glass-card p-6 sticky top-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>
                                    How to {activeTab === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                                </h2>
                            </div>

                            <div className="space-y-5">
                                {currentSteps.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/25">
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <h4 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{item.title}</h4>
                                            <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className={`my-6 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`} />

                            {/* Features & Working */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>Features & Working</h2>
                            </div>

                            <div className="space-y-4">
                                {features.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="h-4 w-4 text-emerald-500" />
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
                        {/* Tabs */}
                        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                            <button onClick={() => setActiveTab('encrypt')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'encrypt' ? 'bg-emerald-500 text-white' : textMuted}`}>
                                <Lock className="h-4 w-4" /> Encrypt
                            </button>
                            <button onClick={() => setActiveTab('decrypt')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'decrypt' ? 'bg-emerald-500 text-white' : textMuted}`}>
                                <KeyRound className="h-4 w-4" /> Decrypt
                            </button>
                        </div>

                        {isProcessing ? (
                            <div className="glass-card p-12 text-center">
                                <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
                                <p className={`font-medium ${textPrimary}`}>{progress}</p>
                            </div>
                        ) : activeTab === 'encrypt' ? (
                            <div className="space-y-6">
                                {/* Passphrase Input */}
                                <div className="glass-card p-6">
                                    <h3 className={`font-semibold mb-4 ${textPrimary}`}>
                                        <KeyRound className="h-5 w-5 inline mr-2 text-emerald-500" />
                                        Passphrase (Optional)
                                    </h3>
                                    <p className={`text-sm mb-4 ${textMuted}`}>
                                        Set a passphrase to derive the encryption key. Leave empty for a random key.
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type={showPassphrase ? 'text' : 'password'} value={passphrase}
                                                onChange={e => setPassphrase(e.target.value)}
                                                placeholder="Enter passphrase or generate one..."
                                                className="input-field pr-10" />
                                            <button onClick={() => setShowPassphrase(!showPassphrase)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {showPassphrase ? <EyeOff className={`h-4 w-4 ${textMuted}`} /> : <Eye className={`h-4 w-4 ${textMuted}`} />}
                                            </button>
                                        </div>
                                        <button onClick={generateRandomPassphrase}
                                            className="btn-secondary px-4" title="Generate random passphrase">
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {strength && (
                                        <div className="mt-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 h-2 bg-gray-700/30 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 80 ? 'bg-green-500' : strength.score >= 60 ? 'bg-emerald-500' : strength.score >= 40 ? 'bg-yellow-500' : strength.score >= 20 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                        style={{ width: `${strength.score}%` }} />
                                                </div>
                                                <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                                            </div>
                                            {strength.suggestions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {strength.suggestions.map(s => (
                                                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Upload to Encrypt */}
                                {!encryptedResult ? (
                                    <div className={`glass-card p-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600 hover:border-emerald-500/50' : 'border-gray-300 hover:border-emerald-500/50'}`}>
                                        <Lock className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                                        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Select File to Encrypt</h3>
                                        <p className={`${textMuted} mb-4`}>File will be encrypted locally using AES-256-GCM</p>
                                        <label className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25">
                                            <Upload className="h-4 w-4" />
                                            Choose File
                                            <input type="file" className="hidden" ref={encryptInputRef} onChange={e => { if (e.target.files?.[0]) handleEncrypt(e.target.files[0]); }} />
                                        </label>
                                    </div>
                                ) : (
                                    /* Encryption Result */
                                    <div className="glass-card p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                <FileCheck className="h-6 w-6 text-green-500" />
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold ${textPrimary}`}>File Encrypted!</h3>
                                                <p className={`text-sm ${textMuted}`}>{encryptedResult.originalName} • {(encryptedResult.originalSize / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" /> Save this key! Without it, your file cannot be decrypted.
                                            </p>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div>
                                                <p className={`text-xs font-medium mb-1 ${textMuted}`}>Encryption Key</p>
                                                <div className={`p-4 flex items-center justify-between rounded-lg font-mono text-sm break-all ${isDark ? 'bg-[#1E293B] text-emerald-400' : 'bg-[#E4F3EC] text-emerald-700'}`}>
                                                    {showEncryptedKey ? encryptedResult.passphraseUsed : '•'.repeat(Math.min(encryptedResult.passphraseUsed.length, 30))}
                                                    <button onClick={() => setShowEncryptedKey(!showEncryptedKey)}
                                                        className={`ml-3 flex-shrink-0 transition-colors ${isDark ? 'text-emerald-500 hover:text-emerald-400' : 'text-emerald-600 hover:text-emerald-700'}`}>
                                                        {showEncryptedKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button onClick={downloadEncrypted} className="btn-primary flex items-center gap-2">
                                                <Download className="h-4 w-4" /> Download Encrypted File
                                            </button>
                                            <button onClick={copyKey} className={`btn-secondary flex items-center gap-2 ${keyCopied ? 'text-green-500 border-green-500/30' : ''}`}>
                                                {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                {keyCopied ? 'Copied!' : 'Copy Key'}
                                            </button>
                                            <button onClick={() => setEncryptedResult(null)} className="btn-secondary">
                                                <X className="h-4 w-4 mr-1" /> Reset
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Decrypt Tab */
                            <div className="space-y-6">
                                <div className="glass-card p-6">
                                    <h3 className={`font-semibold mb-4 ${textPrimary}`}>
                                        <KeyRound className="h-5 w-5 inline mr-2 text-emerald-500" />
                                        Decryption Key
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`text-sm font-medium mb-2 block ${textMuted}`}>Encryption Key</label>
                                            <div className="relative">
                                                <input type={showDecryptKey ? 'text' : 'password'} value={decryptKey} onChange={e => setDecryptKey(e.target.value)}
                                                    placeholder="Paste your encryption key or passphrase here..." className="input-field font-mono text-sm py-3 pr-10" />
                                                <button onClick={() => setShowDecryptKey(!showDecryptKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {showDecryptKey ? <EyeOff className={`h-4 w-4 ${textMuted}`} /> : <Eye className={`h-4 w-4 ${textMuted}`} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!decryptedResult ? (
                                    <div className={`glass-card p-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                        <KeyRound className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                                        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Select Encrypted File</h3>
                                        <p className={`${textMuted} mb-4`}>Upload the .enc file and provide your key above</p>
                                        <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                            <Upload className="h-4 w-4" /> Choose Encrypted File
                                            <input type="file" className="hidden" ref={decryptInputRef} onChange={e => { if (e.target.files?.[0]) handleDecrypt(e.target.files[0]); }} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="glass-card p-6 text-center">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                            <Shield className="h-8 w-8 text-green-500" />
                                        </div>
                                        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>File Decrypted!</h3>
                                        <p className={`text-sm mb-4 ${textMuted}`}>{decryptedResult.fileName}</p>
                                        <button onClick={downloadDecrypted} className="btn-primary">
                                            <Download className="h-4 w-4 mr-2" /> Download Decrypted File
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
