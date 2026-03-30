// Digital Signature Service — ECDSA file signing via Web Crypto API

export interface DigitalSignature {
    id: string;
    fileName: string;
    fileHash: string;
    signature: string;
    publicKey: string;
    algorithm: string;
    signedAt: string;
    signerName: string;
    isValid?: boolean;
}

const STORAGE_KEY = 'cybervault_signatures';
const KEYPAIR_KEY = 'cybervault_signing_keypair';

async function getOrCreateKeyPair(): Promise<{ publicKey: string; privateKeyObj: CryptoKey }> {
    const stored = localStorage.getItem(KEYPAIR_KEY);
    if (stored) {
        const { publicKey, privateKey } = JSON.parse(stored);
        const privKeyObj = await crypto.subtle.importKey(
            'jwk', privateKey,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false, ['sign']
        );
        return { publicKey, privateKeyObj: privKeyObj };
    }

    // Generate new key pair
    const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true, ['sign', 'verify']
    );

    const pubKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKeyStr = btoa(JSON.stringify(pubKey));

    localStorage.setItem(KEYPAIR_KEY, JSON.stringify({
        publicKey: publicKeyStr,
        privateKey: privKey,
    }));

    return { publicKey: publicKeyStr, privateKeyObj: keyPair.privateKey };
}

function getSignatures(): DigitalSignature[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveSignatures(sigs: DigitalSignature[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs.slice(0, 100)));
}

export const digitalSignatureService = {
    /**
     * Sign a file
     */
    async signFile(file: File, signerName: string): Promise<DigitalSignature> {
        const { publicKey, privateKeyObj } = await getOrCreateKeyPair();
        const buffer = await file.arrayBuffer();

        // Hash the file first
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const fileHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        // Sign the hash
        const signatureBuffer = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            privateKeyObj,
            hashBuffer
        );
        const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

        const sig: DigitalSignature = {
            id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileHash,
            signature,
            publicKey,
            algorithm: 'ECDSA-P256-SHA256',
            signedAt: new Date().toISOString(),
            signerName,
            isValid: true,
        };

        const sigs = getSignatures();
        sigs.unshift(sig);
        saveSignatures(sigs);

        return sig;
    },

    /**
     * Verify a file against a signature
     */
    async verifySignature(file: File, sig: DigitalSignature): Promise<{
        valid: boolean;
        message: string;
    }> {
        try {
            const pubKeyJwk = JSON.parse(atob(sig.publicKey));
            const publicKey = await crypto.subtle.importKey(
                'jwk', pubKeyJwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false, ['verify']
            );

            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const signatureBytes = Uint8Array.from(atob(sig.signature), c => c.charCodeAt(0));

            const isValid = await crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-256' },
                publicKey,
                signatureBytes,
                hashBuffer
            );

            return {
                valid: isValid,
                message: isValid
                    ? `Signature verified! File was signed by "${sig.signerName}" on ${new Date(sig.signedAt).toLocaleString()}.`
                    : 'INVALID SIGNATURE! File has been modified since signing.',
            };
        } catch (error) {
            return {
                valid: false,
                message: `Verification failed: ${(error as Error).message}`,
            };
        }
    },

    getAll(): DigitalSignature[] {
        return getSignatures();
    },

    getById(id: string): DigitalSignature | undefined {
        return getSignatures().find(s => s.id === id);
    },

    delete(id: string): void {
        saveSignatures(getSignatures().filter(s => s.id !== id));
    },

    /**
     * Generate signature certificate text
     */
    generateCertificate(sig: DigitalSignature): string {
        return `
═══════════════════════════════════════════════
    CYBERVAULT DIGITAL SIGNATURE CERTIFICATE
═══════════════════════════════════════════════

Signer:      ${sig.signerName}
File:        ${sig.fileName}
Algorithm:   ${sig.algorithm}
Signed At:   ${new Date(sig.signedAt).toLocaleString()}

File Hash (SHA-256):
${sig.fileHash}

Digital Signature:
${sig.signature}

Public Key:
${sig.publicKey.substring(0, 60)}...

Status: ${sig.isValid ? '✅ VALID' : '❌ INVALID'}
═══════════════════════════════════════════════
`.trim();
    },
};

export default digitalSignatureService;
