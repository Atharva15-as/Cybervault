import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import repoInspiredFileCryptoService from '../services/repoInspiredFileCryptoService';
import { CircleHelp, Copy, Download, Eye, EyeOff, Lock, RefreshCw, ShieldCheck, Unlock, Upload } from 'lucide-react';
import storageEncryptionService, { UploadedFileRecord } from '../services/storageEncryptionService';

type Mode = 'encrypt' | 'decrypt';

interface FileEncryptDecryptProps {
    embedded?: boolean;
    showEmbeddedIntro?: boolean;
    showStepCards?: boolean;
    enableManagedEncrypt?: boolean;
    onManagedEncryptSuccess?: (payload: {
        fileId: string;
        encryptedBlob: Blob;
        encryptedFileName: string;
        passphrase: string;
        shareToken: string;
        shareUrl: string;
        fileRecord: UploadedFileRecord;
    }) => void;
}

export default function FileEncryptDecrypt({
    embedded = false,
    showEmbeddedIntro = true,
    showStepCards = true,
    enableManagedEncrypt = false,
    onManagedEncryptSuccess,
}: FileEncryptDecryptProps) {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mode, setMode] = useState<Mode>('encrypt');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [key, setKey] = useState('');
    const [working, setWorking] = useState(false);
    const [showKeyHelp, setShowKeyHelp] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const keyLabel = embedded ? 'Vault Access Key' : 'Secret Key';
    const keyPlaceholder = embedded
        ? 'Enter vault key or passphrase (min 8 chars)'
        : 'Generate key or enter passphrase (min 8 chars)';
    const isFramelessEmbedded = embedded && !showEmbeddedIntro && !showStepCards;
    const toolContainerClass = isFramelessEmbedded
        ? 'space-y-7'
        : 'glass-card p-6 md:p-8 space-y-6';

    useEffect(() => {
        // Force re-entry when switching between encrypt/decrypt for safer UX.
        setKey('');
        setShowKey(false);
    }, [mode]);

    const generateKey = () => {
        setKey(repoInspiredFileCryptoService.generateKey());
        addToast({ type: 'success', title: 'Key Generated', message: 'A new 256-bit key is ready.' });
    };

    const copyKey = async () => {
        if (!key.trim()) return;
        await navigator.clipboard.writeText(key.trim());
        addToast({ type: 'info', title: 'Copied', message: 'Encryption key copied to clipboard.' });
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const run = async () => {
        if (!selectedFile) {
            addToast({ type: 'error', title: 'Missing File', message: 'Please choose a file first.' });
            return;
        }
        if (!key.trim()) {
            addToast({ type: 'error', title: 'Missing Key', message: 'Please provide an encryption key.' });
            return;
        }

        setWorking(true);
        try {
            if (mode === 'encrypt') {
                if (enableManagedEncrypt) {
                    const uploadResult = await storageEncryptionService.uploadEncryptedFile(selectedFile, {
                        passphrase: key,
                    });

                    if (
                        !uploadResult.success ||
                        !uploadResult.fileId ||
                        !uploadResult.encryptedBlob ||
                        !uploadResult.encryptedFileName ||
                        !uploadResult.passphrase ||
                        !uploadResult.shareToken ||
                        !uploadResult.shareUrl ||
                        !uploadResult.fileRecord
                    ) {
                        throw uploadResult.error || new Error('Failed to encrypt and upload file');
                    }

                    onManagedEncryptSuccess?.({
                        fileId: uploadResult.fileId,
                        encryptedBlob: uploadResult.encryptedBlob,
                        encryptedFileName: uploadResult.encryptedFileName,
                        passphrase: uploadResult.passphrase,
                        shareToken: uploadResult.shareToken,
                        shareUrl: uploadResult.shareUrl,
                        fileRecord: uploadResult.fileRecord,
                    });

                    addToast({
                        type: 'success',
                        title: 'Encrypted & Uploaded',
                        message: 'File is secured, share-ready, and added to your uploaded files list.',
                    });
                } else {
                    const { blob, suggestedName } = await repoInspiredFileCryptoService.encryptFile(selectedFile, key);
                    downloadBlob(blob, suggestedName);
                    addToast({ type: 'success', title: 'Encrypted', message: 'Encrypted file downloaded successfully.' });
                }
            } else {
                const { blob, fileName } = await repoInspiredFileCryptoService.decryptFile(selectedFile, key);
                downloadBlob(blob, fileName);
                addToast({ type: 'success', title: 'Decrypted', message: 'Original file recovered successfully.' });
            }
        } catch (error) {
            addToast({
                type: 'error',
                title: mode === 'encrypt' ? 'Encryption Failed' : 'Decryption Failed',
                message: error instanceof Error ? error.message : 'Something went wrong.',
            });
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className={embedded ? '' : 'pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen'}>
            <div className={embedded ? 'w-full' : 'max-w-3xl mx-auto'}>
                {embedded && showEmbeddedIntro && (
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            <span className="text-sm text-primary-500 font-medium">Core Security Workflow</span>
                        </div>
                        <h2 className={`text-2xl md:text-3xl font-bold font-heading mb-2 ${textPrimary}`}>
                            Vault Operations Center
                        </h2>
                        <p className={textMuted}>
                            Protect files before sharing, or recover original files from trusted .enc packages.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            {[
                                { label: 'Encryption', value: 'Client-Side AES' },
                                { label: 'Standard', value: '.enc Vault Package' },
                                { label: 'Trust Model', value: 'Zero-Knowledge Flow' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-[#1E293B]/50 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}
                                >
                                    <p className={`text-[11px] uppercase tracking-wide ${textMuted}`}>{item.label}</p>
                                    <p className={`text-sm font-semibold ${textPrimary}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!embedded && (
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-5">
                            <ShieldCheck className="h-4 w-4 text-primary-500" />
                            <span className="text-sm text-primary-500 font-medium">Core Security Workflow</span>
                        </div>
                        <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-3 ${textPrimary}`}>
                            Vault Operations Center
                        </h1>
                        <p className={`${textMuted}`}>
                            Secure outgoing files into trusted .enc packages, or recover originals from vault packages with your access key.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-left">
                            {[
                                { label: 'Encryption', value: 'Client-Side AES' },
                                { label: 'Standard', value: '.enc Vault Package' },
                                { label: 'Trust Model', value: 'Zero-Knowledge Flow' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-[#1E293B]/50 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}
                                >
                                    <p className={`text-[11px] uppercase tracking-wide ${textMuted}`}>{item.label}</p>
                                    <p className={`text-sm font-semibold ${textPrimary}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={toolContainerClass}>
                    {embedded && showStepCards && (
                        <div className={`rounded-lg border px-4 py-3 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}>
                            <p className={`text-xs font-medium ${textMuted}`}>Step 1</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>Choose Operation Mode</p>
                        </div>
                    )}
                    <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                        <button
                            onClick={() => setMode('encrypt')}
                            className={`flex-1 py-2.5 rounded-lg font-medium ${mode === 'encrypt' ? 'bg-primary-500 text-white' : textMuted}`}
                        >
                            <Lock className="h-4 w-4 inline mr-2" />
                            Encrypt
                        </button>
                        <button
                            onClick={() => setMode('decrypt')}
                            className={`flex-1 py-2.5 rounded-lg font-medium ${mode === 'decrypt' ? 'bg-primary-500 text-white' : textMuted}`}
                        >
                            <Unlock className="h-4 w-4 inline mr-2" />
                            Decrypt
                        </button>
                    </div>

                    {embedded && showStepCards && (
                        <div className={`rounded-lg border px-4 py-3 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}>
                            <p className={`text-xs font-medium ${textMuted}`}>Step 2</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>Set Vault Access Key</p>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <p className={`text-sm font-medium ${textPrimary}`}>{keyLabel}</p>
                            <button
                                type="button"
                                onClick={() => setShowKeyHelp((v) => !v)}
                                className={`p-1 rounded ${textMuted}`}
                                title="Key format help"
                            >
                                <CircleHelp className="h-4 w-4" />
                            </button>
                        </div>
                        {showKeyHelp && (
                            <div className={`mb-2 p-2 rounded-lg text-xs ${isDark ? 'bg-[#1E293B] text-slate-300' : 'bg-[#E4F3EC] text-[#334155]'}`}>
                                Recommended: generated key.
                                Example passphrase: <code className="font-mono">MyStrongKey@2026</code> (8+ chars).
                            </div>
                        )}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder={keyPlaceholder}
                                    className="input-field font-mono text-xs pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey((v) => !v)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${textMuted}`}
                                    title={showKey ? 'Hide key' : 'Show key'}
                                >
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <button className="btn-secondary px-3" onClick={generateKey} title="Generate Key">
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button className="btn-secondary px-3" onClick={copyKey} title="Copy Key">
                                <Copy className="h-4 w-4" />
                            </button>
                        </div>
                        <p className={`mt-2 text-xs ${textMuted}`}>
                            Recommended: click generate and share that key securely. You can also use a passphrase (8+ chars) and use the same passphrase for decryption.
                        </p>
                    </div>

                    {embedded && showStepCards && (
                        <div className={`rounded-lg border px-4 py-3 ${isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FCFA] border-[#CBD5E1]'}`}>
                            <p className={`text-xs font-medium ${textMuted}`}>Step 3</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>Attach File and Run Secure Action</p>
                        </div>
                    )}
                    <div
                        className={`glass-card p-8 border-2 border-dashed text-center cursor-pointer ${isDark ? 'border-dark-700 hover:border-primary-500/60' : 'border-gray-300 hover:border-primary-500/60'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-10 w-10 text-primary-500 mx-auto mb-3" />
                        <p className={`${textPrimary} font-medium mb-1`}>
                            {selectedFile
                                ? selectedFile.name
                                : mode === 'encrypt'
                                    ? 'Select file for vault protection'
                                    : 'Select encrypted vault package'}
                        </p>
                        <p className={`text-xs ${textMuted}`}>
                            {mode === 'encrypt' ? 'Output extension: .enc' : 'Use a .enc file encrypted by this tool'}
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />

                    <div className="flex flex-wrap gap-2">
                        {[
                            'AES-256 Protected',
                            'Local Browser Processing',
                            '.enc Vault Standard',
                        ].map((badge) => (
                            <span
                                key={badge}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                    isDark
                                        ? 'bg-[#1E293B]/60 border-[#334155] text-slate-300'
                                        : 'bg-[#F8FCFA] border-[#CBD5E1] text-[#334155]'
                                }`}
                            >
                                {badge}
                            </span>
                        ))}
                    </div>

                    <button className="btn-primary w-full" onClick={run} disabled={working}>
                        <Download className="h-4 w-4 mr-2 inline" />
                        {working
                            ? 'Processing...'
                            : mode === 'encrypt'
                                ? 'Secure & Export .enc'
                                : 'Decrypt & Recover File'}
                    </button>
                </div>
            </div>
        </div>
    );
}
