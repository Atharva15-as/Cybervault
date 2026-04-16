/**
 * Fernet-Style Encryption Service
 * Based on: https://github.com/Vikranth3140/Encryption-Decryption-Tool
 * 
 * Implements Fernet-style encryption with:
 * - AES-256-CBC encryption (upgraded from AES-128)
 * - PBKDF2 key derivation (100,000 iterations)
 * - HMAC-SHA256 for integrity verification
 * - Password strength validation
 * - Salt-based key derivation
 */

export interface FernetEncryptionResult {
    encryptedData: ArrayBuffer;
    salt: Uint8Array;
    hmac: Uint8Array;
    fileName: string;
    fileSize: number;
}

export interface FernetDecryptionResult {
    decryptedData: ArrayBuffer;
    fileName: string;
    fileSize: number;
    verified: boolean;
}

export interface PasswordStrength {
    isStrong: boolean;
    score: number;
    feedback: string[];
}

export const fernetEncryptionService = {
    /**
     * Check password strength
     * Requirements:
     * - At least 8 characters
     * - One uppercase letter
     * - One lowercase letter
     * - One digit
     * - One special character
     */
    checkPasswordStrength(password: string): PasswordStrength {
        const feedback: string[] = [];
        let score = 0;

        if (password.length < 8) {
            feedback.push('Password must be at least 8 characters long');
        } else {
            score += 20;
        }

        if (!/[A-Z]/.test(password)) {
            feedback.push('Password must contain at least one uppercase letter (A-Z)');
        } else {
            score += 20;
        }

        if (!/[a-z]/.test(password)) {
            feedback.push('Password must contain at least one lowercase letter (a-z)');
        } else {
            score += 20;
        }

        if (!/\d/.test(password)) {
            feedback.push('Password must contain at least one digit (0-9)');
        } else {
            score += 20;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            feedback.push('Password must contain at least one special character');
        } else {
            score += 20;
        }

        return {
            isStrong: feedback.length === 0,
            score,
            feedback,
        };
    },

    /**
     * Derive encryption key from password using PBKDF2
     * Uses 100,000 iterations (matching the Python implementation)
     */
    async deriveKeyFromPassword(
        password: string,
        salt: Uint8Array
    ): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Derive key using PBKDF2 with 100,000 iterations
        const saltBytes = new Uint8Array(salt);
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000, // Matching Python implementation
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-CBC', length: 256 }, // AES-256 (upgraded from AES-128)
            true,
            ['encrypt', 'decrypt']
        );

        return key;
    },

    /**
     * Generate HMAC-SHA256 for data integrity
     */
    async generateHMAC(key: CryptoKey, data: ArrayBuffer): Promise<Uint8Array> {
        // Export key to raw format
        const rawKey = await crypto.subtle.exportKey('raw', key);

        // Import as HMAC key
        const hmacKey = await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Generate HMAC
        const signature = await crypto.subtle.sign('HMAC', hmacKey, data);
        return new Uint8Array(signature);
    },

    /**
     * Verify HMAC-SHA256
     */
    async verifyHMAC(
        key: CryptoKey,
        data: ArrayBuffer,
        hmacToVerify: Uint8Array
    ): Promise<boolean> {
        try {
            // Export key to raw format
            const rawKey = await crypto.subtle.exportKey('raw', key);

            // Import as HMAC key
            const hmacKey = await crypto.subtle.importKey(
                'raw',
                rawKey,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            );

            // Verify HMAC
            const isValid = await crypto.subtle.verify(
                'HMAC',
                hmacKey,
                new Uint8Array(hmacToVerify),
                data
            );

            return isValid;
        } catch (error) {
            console.error('HMAC verification error:', error);
            return false;
        }
    },

    /**
     * Encrypt file using Fernet-style encryption
     * Structure: [16-byte salt][IV][encrypted data][32-byte HMAC]
     */
    async encryptFile(
        file: File,
        password: string,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<FernetEncryptionResult> {
        onProgress?.('Validating password...', 5);

        // Check password strength
        const strength = this.checkPasswordStrength(password);
        if (!strength.isStrong) {
            throw new Error(`Weak password: ${strength.feedback.join(', ')}`);
        }

        onProgress?.('Generating salt...', 10);

        // Generate random salt (16 bytes)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        onProgress?.('Deriving encryption key...', 20);

        // Derive key from password
        const key = await this.deriveKeyFromPassword(password, salt);

        onProgress?.('Reading file...', 30);

        // Read file data
        const fileData = await file.arrayBuffer();

        onProgress?.('Encrypting file...', 50);

        // Generate random IV (16 bytes for AES-CBC)
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Encrypt data using AES-256-CBC
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: iv },
            key,
            fileData
        );

        onProgress?.('Generating HMAC...', 70);

        // Generate HMAC for encrypted data
        const hmac = await this.generateHMAC(key, encryptedData);

        console.log('Generated HMAC (checksum):', this.bufferToHex(hmac));

        onProgress?.('Finalizing encryption...', 90);

        // Combine: [salt][iv][encrypted data][hmac]
        const totalLength = salt.length + iv.length + encryptedData.byteLength + hmac.length;
        const combined = new Uint8Array(totalLength);
        let offset = 0;

        combined.set(salt, offset);
        offset += salt.length;

        combined.set(iv, offset);
        offset += iv.length;

        combined.set(new Uint8Array(encryptedData), offset);
        offset += encryptedData.byteLength;

        combined.set(hmac, offset);

        onProgress?.('Encryption complete!', 100);

        return {
            encryptedData: combined.buffer,
            salt: salt,
            hmac: hmac,
            fileName: file.name,
            fileSize: file.size,
        };
    },

    /**
     * Decrypt file using Fernet-style encryption
     * Structure: [16-byte salt][16-byte IV][encrypted data][32-byte HMAC]
     */
    async decryptFile(
        encryptedBlob: Blob,
        password: string,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<FernetDecryptionResult> {
        onProgress?.('Reading encrypted file...', 10);

        // Read encrypted data
        const encryptedBuffer = await encryptedBlob.arrayBuffer();
        const encryptedBytes = new Uint8Array(encryptedBuffer);

        // Minimum size: 16 (salt) + 16 (IV) + 32 (HMAC) = 64 bytes
        if (encryptedBytes.length < 64) {
            throw new Error('Encrypted file is too short to contain required data');
        }

        onProgress?.('Extracting salt and IV...', 20);

        // Extract salt (first 16 bytes)
        const salt = encryptedBytes.slice(0, 16);

        // Extract IV (next 16 bytes)
        const iv = encryptedBytes.slice(16, 32);

        // Extract HMAC (last 32 bytes)
        const hmacSize = 32; // SHA-256 produces 32 bytes
        const hmacStored = encryptedBytes.slice(-hmacSize);

        // Extract encrypted content (between IV and HMAC)
        const encryptedContent = encryptedBytes.slice(32, -hmacSize);

        console.log('Stored HMAC (checksum):', this.bufferToHex(hmacStored));

        onProgress?.('Deriving decryption key...', 30);

        // Derive key from password
        const key = await this.deriveKeyFromPassword(password, salt);

        onProgress?.('Verifying HMAC...', 50);

        // Compute HMAC for verification
        const encryptedContentBuffer = new Uint8Array(encryptedContent).buffer;
        const hmacComputed = await this.generateHMAC(key, encryptedContentBuffer);

        console.log('Computed HMAC (checksum):', this.bufferToHex(hmacComputed));

        // Verify HMAC
        const isValid = await this.verifyHMAC(key, encryptedContentBuffer, hmacStored);

        if (!isValid) {
            throw new Error(
                'Data integrity check failed. The file may have been tampered with or the password is incorrect.'
            );
        }

        onProgress?.('Decrypting file...', 70);

        // Decrypt data
        let decryptedData: ArrayBuffer;
        try {
            decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv: new Uint8Array(iv) },
                key,
                encryptedContentBuffer
            );
        } catch (error) {
            throw new Error('Decryption failed. Invalid password or corrupted file.');
        }

        onProgress?.('Decryption complete!', 100);

        return {
            decryptedData: decryptedData,
            fileName: 'decrypted_file',
            fileSize: decryptedData.byteLength,
            verified: true,
        };
    },

    /**
     * Encrypt file with stored key (generates random key)
     * This mimics the "stored key method" from the Python implementation
     */
    async encryptFileWithStoredKey(
        file: File,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<{ encryptedData: ArrayBuffer; key: string; fileName: string }> {
        onProgress?.('Generating encryption key...', 10);

        // Generate random key (32 bytes for AES-256)
        const keyBytes = crypto.getRandomValues(new Uint8Array(32));

        // Import as AES key
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-CBC', length: 256 },
            true,
            ['encrypt']
        );

        onProgress?.('Reading file...', 30);

        const fileData = await file.arrayBuffer();

        onProgress?.('Encrypting file...', 50);

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Encrypt
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: iv },
            key,
            fileData
        );

        onProgress?.('Generating HMAC...', 70);

        // Generate HMAC
        const hmac = await this.generateHMAC(key, encryptedData);

        onProgress?.('Finalizing...', 90);

        // Combine: [iv][encrypted data][hmac]
        const totalLength = iv.length + encryptedData.byteLength + hmac.length;
        const combined = new Uint8Array(totalLength);
        let offset = 0;

        combined.set(iv, offset);
        offset += iv.length;

        combined.set(new Uint8Array(encryptedData), offset);
        offset += encryptedData.byteLength;

        combined.set(hmac, offset);

        onProgress?.('Encryption complete!', 100);

        // Export key as base64 for storage
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

        return {
            encryptedData: combined.buffer,
            key: keyBase64,
            fileName: file.name,
        };
    },

    /**
     * Decrypt file with stored key
     */
    async decryptFileWithStoredKey(
        encryptedBlob: Blob,
        keyBase64: string,
        onProgress?: (stage: string, percent: number) => void
    ): Promise<FernetDecryptionResult> {
        onProgress?.('Reading encrypted file...', 10);

        const encryptedBuffer = await encryptedBlob.arrayBuffer();
        const encryptedBytes = new Uint8Array(encryptedBuffer);

        if (encryptedBytes.length < 48) {
            throw new Error('Encrypted file is too short');
        }

        onProgress?.('Importing key...', 20);

        // Import key from base64
        const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-CBC', length: 256 },
            true,
            ['decrypt']
        );

        onProgress?.('Extracting IV and HMAC...', 30);

        // Extract IV (first 16 bytes)
        const iv = encryptedBytes.slice(0, 16);

        // Extract HMAC (last 32 bytes)
        const hmacStored = encryptedBytes.slice(-32);

        // Extract encrypted content
        const encryptedContent = encryptedBytes.slice(16, -32);

        onProgress?.('Verifying HMAC...', 50);

        // Verify HMAC
        const encryptedContentBuffer = new Uint8Array(encryptedContent).buffer;
        const isValid = await this.verifyHMAC(key, encryptedContentBuffer, hmacStored);

        if (!isValid) {
            throw new Error('Data integrity check failed');
        }

        onProgress?.('Decrypting file...', 70);

        // Decrypt
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: new Uint8Array(iv) },
            key,
            encryptedContentBuffer
        );

        onProgress?.('Decryption complete!', 100);

        return {
            decryptedData: decryptedData,
            fileName: 'decrypted_file',
            fileSize: decryptedData.byteLength,
            verified: true,
        };
    },

    /**
     * Helper: Convert buffer to hex string
     */
    bufferToHex(buffer: Uint8Array): string {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Helper: Convert hex string to buffer
     */
    hexToBuffer(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },
};

export default fernetEncryptionService;
