/**
 * Repo-inspired file encryption/decryption service.
 * Inspired by: https://github.com/hasanfirnas/Secure-file-encrypt-decrypt
 *
 * Design:
 * - Random 256-bit key (Base64URL string)
 * - AES-256-GCM encryption in browser
 * - Encrypted payload format: [version:1][iv:12][ciphertext:n]
 * - Metadata (original file name/type) encrypted with content
 */

const VERSION = 1;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function toEncFileName(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0;
    const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
    return `${baseName}.enc`;
}

function base64UrlEncode(bytes: Uint8Array): string {
    const b64 = btoa(String.fromCharCode(...bytes));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Uint8Array {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const binary = atob(normalized + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function importAesKey(keyString: string, usage: KeyUsage[]): Promise<CryptoKey> {
    const normalizedInput = keyString.trim();
    let keyBytes: Uint8Array | null = null;

    try {
        const decoded = base64UrlDecode(normalizedInput);
        if (decoded.length === KEY_LENGTH) {
            keyBytes = decoded;
        }
    } catch {
        keyBytes = null;
    }

    // Fallback: treat input as passphrase and derive a 32-byte key via SHA-256
    if (!keyBytes) {
        if (normalizedInput.length < 8) {
            throw new Error('Use a generated key, or enter a passphrase with at least 8 characters.');
        }
        const passphraseBytes = new TextEncoder().encode(normalizedInput);
        const hash = await crypto.subtle.digest('SHA-256', passphraseBytes);
        keyBytes = new Uint8Array(hash);
    }

    const normalizedKeyBytes = new Uint8Array(keyBytes);
    return crypto.subtle.importKey(
        'raw',
        normalizedKeyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        usage
    );
}

export const repoInspiredFileCryptoService = {
    generateKey(): string {
        const key = crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
        return base64UrlEncode(key);
    },

    async encryptFile(file: File, keyString: string): Promise<{ blob: Blob; suggestedName: string }> {
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const key = await importAesKey(keyString, ['encrypt']);

        const metadata = new TextEncoder().encode(
            JSON.stringify({
                name: file.name,
                type: file.type || 'application/octet-stream',
            })
        );
        const metadataLength = new Uint32Array([metadata.length]);

        const payload = new Uint8Array(4 + metadata.length + fileBytes.length);
        payload.set(new Uint8Array(metadataLength.buffer), 0);
        payload.set(metadata, 4);
        payload.set(fileBytes, 4 + metadata.length);

        const payloadBytes = new Uint8Array(payload);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            payloadBytes
        );

        const encryptedBytes = new Uint8Array(encrypted);
        const output = new Uint8Array(1 + IV_LENGTH + encryptedBytes.length);
        output[0] = VERSION;
        output.set(iv, 1);
        output.set(encryptedBytes, 1 + IV_LENGTH);

        return {
            blob: new Blob([output], { type: 'application/octet-stream' }),
            suggestedName: toEncFileName(file.name),
        };
    },

    async decryptFile(file: File, keyString: string): Promise<{ blob: Blob; fileName: string }> {
        const encrypted = new Uint8Array(await file.arrayBuffer());
        if (encrypted.length <= 1 + IV_LENGTH) {
            throw new Error('Encrypted file is invalid or corrupted.');
        }
        if (encrypted[0] !== VERSION) {
            throw new Error('Unsupported encrypted file version.');
        }

        const iv = encrypted.slice(1, 1 + IV_LENGTH);
        const ciphertext = encrypted.slice(1 + IV_LENGTH);
        const key = await importAesKey(keyString, ['decrypt']);

        let decrypted: ArrayBuffer;
        try {
            decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                new Uint8Array(ciphertext)
            );
        } catch {
            throw new Error('Decryption failed. Please check key and encrypted file.');
        }

        const bytes = new Uint8Array(decrypted);
        const metadataLength = new Uint32Array(bytes.slice(0, 4).buffer)[0];
        const metadataStart = 4;
        const metadataEnd = metadataStart + metadataLength;

        const metadataRaw = bytes.slice(metadataStart, metadataEnd);
        const metadata = JSON.parse(new TextDecoder().decode(metadataRaw));
        const fileData = bytes.slice(metadataEnd);

        return {
            blob: new Blob([fileData], { type: metadata.type || 'application/octet-stream' }),
            fileName: metadata.name || 'decrypted_file',
        };
    },
};

export default repoInspiredFileCryptoService;
