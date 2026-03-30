// Secure Notes Service — Encrypted text/note sharing with auto-expiry

export interface SecureNote {
    id: string;
    title: string;
    encryptedContent: string;
    iv: string;
    salt: string;
    createdAt: string;
    expiresAt: string | null;
    burnAfterRead: boolean;
    readCount: number;
    maxReads: number;
    isDestroyed: boolean;
    shareToken: string;
}

const STORAGE_KEY = 'cybervault_secure_notes';
const MAX_NOTES = 50;

function getNotes(): SecureNote[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveNotes(notes: SecureNote[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, MAX_NOTES)));
}

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint32Array(24);
    crypto.getRandomValues(values);
    return Array.from(values).map(v => chars[v % chars.length]).join('');
}

export const secureNotesService = {
    create(note: {
        title: string;
        encryptedContent: string;
        iv: string;
        salt: string;
        expiresIn?: string;
        burnAfterRead?: boolean;
        maxReads?: number;
    }): SecureNote {
        let expiresAt: string | null = null;
        if (note.expiresIn) {
            const now = Date.now();
            const durations: Record<string, number> = {
                '1h': 3600000, '6h': 21600000, '24h': 86400000,
                '7d': 604800000, '30d': 2592000000
            };
            expiresAt = new Date(now + (durations[note.expiresIn] || 86400000)).toISOString();
        }

        const newNote: SecureNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: note.title,
            encryptedContent: note.encryptedContent,
            iv: note.iv,
            salt: note.salt,
            createdAt: new Date().toISOString(),
            expiresAt,
            burnAfterRead: note.burnAfterRead || false,
            readCount: 0,
            maxReads: note.maxReads || 1,
            isDestroyed: false,
            shareToken: generateToken(),
        };

        const notes = getNotes();
        notes.unshift(newNote);
        saveNotes(notes);
        return newNote;
    },

    getAll(): SecureNote[] {
        return getNotes().filter(n => !n.isDestroyed);
    },

    getById(id: string): SecureNote | undefined {
        return getNotes().find(n => n.id === id);
    },

    getByToken(token: string): SecureNote | undefined {
        return getNotes().find(n => n.shareToken === token && !n.isDestroyed);
    },

    markRead(id: string): void {
        const notes = getNotes();
        const note = notes.find(n => n.id === id);
        if (note) {
            note.readCount++;
            if (note.burnAfterRead && note.readCount >= note.maxReads) {
                note.isDestroyed = true;
                note.encryptedContent = '';
            }
            saveNotes(notes);
        }
    },

    delete(id: string): void {
        saveNotes(getNotes().filter(n => n.id !== id));
    },

    isExpired(note: SecureNote): boolean {
        if (!note.expiresAt) return false;
        return new Date(note.expiresAt) < new Date();
    },
};

export default secureNotesService;
