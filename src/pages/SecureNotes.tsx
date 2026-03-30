import { useState } from 'react';
import { Lock, Send, Clock, Eye, Trash2, Copy, Check, AlertCircle, Flame, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import encryptionService from '../services/encryptionService';
import secureNotesService, { SecureNote } from '../services/secureNotesService';

export default function SecureNotes() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';

    const [notes, setNotes] = useState<SecureNote[]>(secureNotesService.getAll());
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [expiresIn, setExpiresIn] = useState('24h');
    const [burnAfterRead, setBurnAfterRead] = useState(false);
    const [isEncrypting, setIsEncrypting] = useState(false);

    // View modal
    const [viewNote, setViewNote] = useState<SecureNote | null>(null);
    const [viewPassphrase, setViewPassphrase] = useState('');
    const [decryptedContent, setDecryptedContent] = useState('');
    const [viewError, setViewError] = useState('');
    const [copied, setCopied] = useState('');

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleCreate = async () => {
        if (!title.trim() || !content.trim() || !passphrase.trim()) {
            addToast({ type: 'error', title: 'Missing Fields', message: 'Fill in all fields including passphrase' });
            return;
        }
        setIsEncrypting(true);
        try {
            const { encrypted, iv, salt } = await encryptionService.encryptText(content, passphrase);
            secureNotesService.create({
                title, encryptedContent: encrypted, iv, salt, expiresIn,
                burnAfterRead, maxReads: burnAfterRead ? 1 : 999,
            });
            setNotes(secureNotesService.getAll());
            setTitle(''); setContent(''); setPassphrase('');
            addToast({ type: 'success', title: 'Secure Note Created', message: burnAfterRead ? 'Note will self-destruct after reading' : 'Note encrypted and saved' });
        } catch (err) {
            addToast({ type: 'error', title: 'Encryption Failed', message: (err as Error).message });
        } finally {
            setIsEncrypting(false);
        }
    };

    const handleDecrypt = async () => {
        if (!viewNote || !viewPassphrase) return;
        setViewError('');
        try {
            const text = await encryptionService.decryptText(
                viewNote.encryptedContent, viewPassphrase, viewNote.iv, viewNote.salt
            );
            setDecryptedContent(text);
            secureNotesService.markRead(viewNote.id);
            setNotes(secureNotesService.getAll());
        } catch {
            setViewError('Wrong passphrase or corrupted data');
        }
    };

    const copyShareLink = async (note: SecureNote) => {
        const url = `${window.location.origin}/notes/${note.shareToken}`;
        await navigator.clipboard.writeText(url);
        setCopied(note.id);
        setTimeout(() => setCopied(''), 2000);
        addToast({ type: 'info', title: 'Link Copied', message: 'Share this link with the recipient' });
    };

    const handleDelete = (id: string) => {
        secureNotesService.delete(id);
        setNotes(secureNotesService.getAll());
        addToast({ type: 'info', title: 'Note Deleted', message: 'Secure note permanently destroyed' });
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                        <Lock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-amber-500 font-medium">Encrypted Notes</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Secure <span className="gradient-text">Notes</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Share encrypted text, passwords, API keys, or secrets. With optional burn-after-read self-destruction.
                    </p>
                </div>

                {/* Create Note */}
                <div className="glass-card p-6 mb-8">
                    <h3 className={`font-semibold mb-4 ${textPrimary}`}>Create Secure Note</h3>
                    <div className="space-y-4">
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Note title..." className="input-field" />
                        <textarea value={content} onChange={e => setContent(e.target.value)}
                            placeholder="Enter your secret text, password, API key, etc..."
                            className="input-field min-h-[120px] resize-y" rows={4} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`text-xs font-medium mb-1 block ${textMuted}`}>Encryption Passphrase</label>
                                <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                                    placeholder="Passphrase for encryption..." className="input-field" />
                            </div>
                            <div>
                                <label className={`text-xs font-medium mb-1 block ${textMuted}`}>
                                    <Clock className="h-3 w-3 inline mr-1" />Expires After
                                </label>
                                <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className="input-field">
                                    <option value="1h">1 Hour</option>
                                    <option value="6h">6 Hours</option>
                                    <option value="24h">24 Hours</option>
                                    <option value="7d">7 Days</option>
                                    <option value="30d">30 Days</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={burnAfterRead} onChange={e => setBurnAfterRead(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500" />
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span className={`text-sm ${textPrimary}`}>Burn after read</span>
                                <span className={`text-xs ${textMuted}`}>(self-destruct after first view)</span>
                            </label>
                            <button onClick={handleCreate} disabled={isEncrypting || !title || !content || !passphrase}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                                <Send className="h-4 w-4" />
                                {isEncrypting ? 'Encrypting...' : 'Create Note'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                    {notes.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Lock className={`h-12 w-12 mx-auto mb-4 ${textMuted} opacity-50`} />
                            <p className={textMuted}>No secure notes yet. Create one above.</p>
                        </div>
                    ) : notes.map(note => {
                        const isExpired = secureNotesService.isExpired(note);
                        return (
                            <div key={note.id} className={`glass-card p-5 flex items-center gap-4 ${isExpired ? 'opacity-50' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${note.burnAfterRead ? 'bg-orange-500/10' : 'bg-amber-500/10'}`}>
                                    {note.burnAfterRead ? <Flame className="h-5 w-5 text-orange-500" /> : <Lock className="h-5 w-5 text-amber-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium truncate ${textPrimary}`}>{note.title}</h4>
                                    <div className="flex items-center gap-3 flex-wrap mt-1">
                                        <span className={`text-xs ${textMuted}`}>{new Date(note.createdAt).toLocaleString()}</span>
                                        {note.burnAfterRead && <span className="text-xs text-orange-500 font-medium">🔥 Burn after read</span>}
                                        {isExpired && <span className="text-xs text-red-500 font-medium">Expired</span>}
                                        <span className={`text-xs ${textMuted}`}>Read {note.readCount}x</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setViewNote(note); setDecryptedContent(''); setViewPassphrase(''); setViewError(''); }}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-amber-400 hover:bg-[#334155]' : 'text-gray-400 hover:text-amber-600 hover:bg-[#E4F3EC]'}`}
                                        title="View & Decrypt" disabled={isExpired || note.isDestroyed}>
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => copyShareLink(note)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-primary-400 hover:bg-[#334155]' : 'text-gray-400 hover:text-primary-600 hover:bg-[#E4F3EC]'}`}>
                                        {copied === note.id ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                    </button>
                                    <button onClick={() => handleDelete(note.id)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-red-400 hover:bg-[#334155]' : 'text-gray-400 hover:text-red-500 hover:bg-[#E4F3EC]'}`}>
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* View/Decrypt Modal */}
                {viewNote && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className={`glass-card p-6 max-w-lg w-full animate-slide-up ${isDark ? '' : 'bg-[#F9FEFC]'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${textPrimary}`}>{viewNote.title}</h3>
                                <button onClick={() => setViewNote(null)} className={`p-2 rounded-lg ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]' : 'text-gray-500 hover:text-gray-900 hover:bg-[#E4F3EC]'}`}>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {!decryptedContent ? (
                                <div>
                                    <p className={`text-sm mb-4 ${textMuted}`}>Enter the passphrase to decrypt this note.</p>
                                    {viewError && (
                                        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> {viewError}
                                        </div>
                                    )}
                                    <input type="password" value={viewPassphrase} onChange={e => setViewPassphrase(e.target.value)}
                                        placeholder="Enter passphrase..." className="input-field mb-4"
                                        onKeyDown={e => { if (e.key === 'Enter') handleDecrypt(); }} />
                                    <button onClick={handleDecrypt} className="btn-primary w-full" disabled={!viewPassphrase}>
                                        <Lock className="h-4 w-4 mr-2" /> Decrypt Note
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {viewNote.burnAfterRead && (
                                        <div className={`mb-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs flex items-center gap-2`}>
                                            <Flame className="h-4 w-4" /> This note will self-destruct. Copy the content now.
                                        </div>
                                    )}
                                    <div className={`p-4 rounded-xl font-mono text-sm whitespace-pre-wrap break-all ${isDark ? 'bg-[#1E293B] text-emerald-300' : 'bg-[#E4F3EC] text-emerald-700'}`}>
                                        {decryptedContent}
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={async () => { await navigator.clipboard.writeText(decryptedContent); addToast({ type: 'success', title: 'Copied', message: 'Content copied to clipboard' }); }}
                                            className="btn-primary flex-1">
                                            <Copy className="h-4 w-4 mr-2" /> Copy Content
                                        </button>
                                        <button onClick={() => setViewNote(null)} className="btn-secondary flex-1">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
