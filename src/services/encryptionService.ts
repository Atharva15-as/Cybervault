// Client-Side End-to-End Encryption Service
// Uses Web Crypto API for AES-256-GCM encryption
// Zero-knowledge: all keys stay client-side, server only stores ciphertext

export interface EncryptedFile {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
    originalName: string;
    originalSize: number;
    originalType: string;
}

export interface EncryptionResult {
    blob: Blob;
    iv: string;
    salt: string;
    key: string; // base64 encoded key for URL fragment
    originalName: string;
    originalSize: number;
}

export interface DecryptionResult {
    blob: Blob;
    fileName: string;
    fileSize: number;
    fileType: string;
}

export interface IntegrityInfo {
    hash: string;       // SHA-256 of the encrypted blob
    originalHash: string; // SHA-256 of the original file
    size: number;
}

// Convert ArrayBuffer to base64
function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert Uint8Array to hex
function uint8ToHex(arr: Uint8Array): string {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex to Uint8Array
function hexToUint8(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

export const encryptionService = {
    /**
     * Generate a random AES-256 encryption key
     */
    async generateKey(): Promise<CryptoKey> {
        return await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Derive an AES key from a passphrase using PBKDF2
     * Uses 600,000 iterations for strong brute-force resistance
     */
    async deriveKeyFromPassphrase(passphrase: string, salt?: Uint8Array): Promise<{
        key: CryptoKey;
        salt: Uint8Array;
    }> {
        const useSalt = salt || crypto.getRandomValues(new Uint8Array(16));
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(passphrase) as any,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: useSalt as any,
                iterations: 600000, // High iteration count for security
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        return { key: derivedKey, salt: useSalt };
    },

    /**
     * Export CryptoKey to base64 string (for sharing via URL fragment)
     */
    async exportKey(key: CryptoKey): Promise<string> {
        const rawKey = await crypto.subtle.exportKey('raw', key);
        return bufferToBase64(rawKey);
    },

    /**
     * Import base64 string back to CryptoKey
     */
    async importKey(keyBase64: string): Promise<CryptoKey> {
        const keyBuffer = base64ToBuffer(keyBase64);
        return await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
    },

    /**
     * Compute SHA-256 hash of data (ArrayBuffer or Blob)
     */
    async computeHash(data: ArrayBuffer | Blob): Promise<string> {
        const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Encrypt a file using AES-256-GCM. 
     * The resulting blob contains [16_byte_salt][12_byte_iv][encrypted_payload]
     * Metadata (name, size, type) is encrypted inside the payload — zero-knowledge.
     */
    async encryptFile(
        file: File,
        providedPassphrase?: string,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<{
        blob: Blob;
        passphraseUsed: string;
        originalName: string;
        originalSize: number;
        originalHash: string;
        encryptedHash: string;
    }> {
        onProgress?.('Generating encryption key...', 10);

        const passphraseUsed = providedPassphrase || this.generatePassphrase(4);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const { key } = await this.deriveKeyFromPassphrase(passphraseUsed, salt);
        
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

        onProgress?.('Reading file...', 20);
        const fileBuffer = await file.arrayBuffer();

        // Compute original file hash for integrity verification
        onProgress?.('Computing integrity hash...', 30);
        const originalHash = await this.computeHash(fileBuffer);

        // Create metadata header — this gets encrypted too (zero-knowledge)
        onProgress?.('Encrypting metadata...', 40);
        const metadata = JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            originalHash: originalHash,
            encryptedAt: new Date().toISOString(),
        });
        const metadataBytes = new TextEncoder().encode(metadata);
        const metadataLength = new Uint32Array([metadataBytes.length]);

        // Combine: [4 bytes metadata length][metadata][file data]
        const combined = new Uint8Array(
            4 + metadataBytes.length + fileBuffer.byteLength
        );
        combined.set(new Uint8Array(metadataLength.buffer), 0);
        combined.set(metadataBytes, 4);
        combined.set(new Uint8Array(fileBuffer), 4 + metadataBytes.length);

        // Encrypt the combined payload with AES-256-GCM
        onProgress?.('Encrypting file with AES-256-GCM...', 60);
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv as any },
            key,
            combined.buffer
        );

        // Prepend salt(16) and iv(12) to the encrypted data
        onProgress?.('Finalizing encrypted blob...', 80);
        const finalBlobArray = new Uint8Array(16 + 12 + encryptedData.byteLength);
        finalBlobArray.set(salt, 0);
        finalBlobArray.set(iv, 16);
        finalBlobArray.set(new Uint8Array(encryptedData), 28);

        const encryptedBlob = new Blob([finalBlobArray.buffer], { type: 'application/octet-stream' });

        // Compute hash of encrypted data for tamper detection
        onProgress?.('Computing encrypted data hash...', 90);
        const encryptedHash = await this.computeHash(finalBlobArray.buffer);

        onProgress?.('Encryption complete!', 100);

        return {
            blob: encryptedBlob,
            passphraseUsed,
            originalName: file.name,
            originalSize: file.size,
            originalHash,
            encryptedHash,
        };
    },

    /**
     * Decrypt a file using AES-256-GCM wrapped with [16_byte_salt][12_byte_iv]
     * Returns the original file with all metadata restored.
     */
    async decryptFile(
        encryptedBlob: Blob,
        passphraseUsed: string,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<DecryptionResult & { originalHash: string }> {
        onProgress?.('Reading encrypted data...', 10);
        const encryptedBuffer = await encryptedBlob.arrayBuffer();
        
        if (encryptedBuffer.byteLength < 28) {
            throw new Error('Invalid or corrupted encrypted file. File is too small.');
        }

        // Extract salt and iv
        onProgress?.('Extracting cryptographic parameters...', 20);
        const bytes = new Uint8Array(encryptedBuffer);
        const salt = bytes.slice(0, 16);
        const iv = bytes.slice(16, 28);
        const cipherText = bytes.slice(28);

        // Derive the key using the extracted salt
        onProgress?.('Deriving decryption key (PBKDF2)...', 30);
        const { key } = await this.deriveKeyFromPassphrase(passphraseUsed, salt);

        // Decrypt
        onProgress?.('Decrypting with AES-256-GCM...', 50);
        let decryptedBuffer: ArrayBuffer;
        try {
            decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv as any },
                key,
                cipherText.buffer
            );
        } catch {
            throw new Error('Decryption failed. Wrong passphrase or corrupted file.');
        }

        // Parse metadata
        onProgress?.('Extracting file metadata...', 70);
        const decrypted = new Uint8Array(decryptedBuffer);
        const metadataLength = new Uint32Array(decrypted.slice(0, 4).buffer)[0];
        const metadataBytes = decrypted.slice(4, 4 + metadataLength);
        const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
        const fileData = decrypted.slice(4 + metadataLength);

        // Verify integrity
        onProgress?.('Verifying file integrity (SHA-256)...', 85);
        const computedHash = await this.computeHash(fileData.buffer);
        const originalHash = metadata.originalHash || '';

        if (originalHash && computedHash !== originalHash) {
            throw new Error('File integrity verification failed! The file may have been tampered with.');
        }

        onProgress?.('Decryption complete!', 100);

        return {
            blob: new Blob([fileData], { type: metadata.type || 'application/octet-stream' }),
            fileName: metadata.name,
            fileSize: metadata.size,
            fileType: metadata.type || 'application/octet-stream',
            originalHash: originalHash,
        };
    },

    /**
     * Verify the integrity of an encrypted blob against a stored hash
     */
    async verifyEncryptedIntegrity(encryptedBlob: Blob, storedHash: string): Promise<boolean> {
        const computedHash = await this.computeHash(encryptedBlob);
        return computedHash === storedHash;
    },

    /**
     * Encrypt text/notes
     */
    async encryptText(text: string, passphrase: string): Promise<{
        encrypted: string;
        iv: string;
        salt: string;
    }> {
        const { key, salt } = await this.deriveKeyFromPassphrase(passphrase);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv as any },
            key,
            encoder.encode(text) as any
        );

        return {
            encrypted: bufferToBase64(encrypted),
            iv: uint8ToHex(iv),
            salt: uint8ToHex(salt),
        };
    },

    /**
     * Decrypt text/notes
     */
    async decryptText(
        encryptedBase64: string,
        passphrase: string,
        ivHex: string,
        saltHex: string
    ): Promise<string> {
        const salt = hexToUint8(saltHex);
        const { key } = await this.deriveKeyFromPassphrase(passphrase, salt);
        const iv = hexToUint8(ivHex);
        const encryptedBuffer = base64ToBuffer(encryptedBase64);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv as any },
            key,
            encryptedBuffer
        );

        return new TextDecoder().decode(decrypted);
    },

    /**
     * Generate a random passphrase
     */
    generatePassphrase(wordCount: number = 4): string {
        const words = [
            'alpha', 'bravo', 'cyber', 'delta', 'echo', 'foxtrot', 'gamma', 'hotel',
            'india', 'juliet', 'kilo', 'lima', 'metro', 'noble', 'oscar', 'papa',
            'quantum', 'romeo', 'sierra', 'tango', 'ultra', 'victor', 'whiskey',
            'xray', 'yankee', 'zulu', 'shield', 'vault', 'cipher', 'crypt',
            'guard', 'sentinel', 'nexus', 'prism', 'forge', 'beacon', 'storm',
            'shadow', 'pulse', 'vector', 'matrix', 'axis', 'zenith', 'apex',
        ];
        const values = new Uint32Array(wordCount);
        crypto.getRandomValues(values);
        return Array.from(values).map(v => words[v % words.length]).join('-');
    },

    /**
     * Estimate password strength (0-100)
     */
    estimateStrength(password: string): {
        score: number;
        label: string;
        color: string;
        suggestions: string[];
    } {
        let score = 0;
        const suggestions: string[] = [];

        if (password.length >= 8) score += 20;
        else suggestions.push('Use at least 8 characters');

        if (password.length >= 12) score += 15;
        if (password.length >= 16) score += 10;

        if (/[a-z]/.test(password)) score += 10;
        else suggestions.push('Add lowercase letters');

        if (/[A-Z]/.test(password)) score += 10;
        else suggestions.push('Add uppercase letters');

        if (/[0-9]/.test(password)) score += 10;
        else suggestions.push('Add numbers');

        if (/[^a-zA-Z0-9]/.test(password)) score += 15;
        else suggestions.push('Add special characters');

        // Bonus for variety
        const uniqueChars = new Set(password).size;
        score += Math.min(10, Math.floor(uniqueChars / 2));

        score = Math.min(100, score);

        let label = 'Very Weak';
        let color = 'text-red-500';
        if (score >= 80) { label = 'Very Strong'; color = 'text-green-500'; }
        else if (score >= 60) { label = 'Strong'; color = 'text-emerald-500'; }
        else if (score >= 40) { label = 'Fair'; color = 'text-yellow-500'; }
        else if (score >= 20) { label = 'Weak'; color = 'text-orange-500'; }

        return { score, label, color, suggestions };
    },
};

export default encryptionService;
