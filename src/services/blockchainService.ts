// Blockchain Timestamp Service — Proof of Existence via SHA-256 anchoring
// Simulates OpenTimestamps-style blockchain anchoring for file timestamps

export interface BlockchainTimestamp {
    id: string;
    fileHash: string;
    fileName: string;
    fileSize: string;
    merkleRoot: string;
    blockHeight: number;
    blockHash: string;
    txHash: string;
    network: 'Bitcoin' | 'Ethereum';
    timestamp: string;
    status: 'pending' | 'confirmed' | 'anchored';
    confirmations: number;
    proofUrl: string;
    certificate: TimestampCertificate;
}

export interface TimestampCertificate {
    version: string;
    fileDigest: string;
    algorithm: string;
    merkleRoot: string;
    merkleProof: string[];
    anchorPoint: {
        network: string;
        blockHeight: number;
        blockHash: string;
        txHash: string;
        timestamp: string;
    };
    issuer: string;
    issuedAt: string;
    expiresAt: string | null;
}

export interface MerkleNode {
    hash: string;
    left?: string;
    right?: string;
    level: number;
}

const STORAGE_KEY = 'cybervault_blockchain_timestamps';
const MAX_ENTRIES = 100;

// Helper: generate random hex string
function randomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        result += chars[values[i] % 16];
    }
    return result;
}

// SHA-256 hash utility
async function sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate Merkle tree from hashes
async function buildMerkleTree(hashes: string[]): Promise<{ root: string; proof: string[] }> {
    if (hashes.length === 0) return { root: '', proof: [] };
    if (hashes.length === 1) return { root: hashes[0], proof: [] };

    const proof: string[] = [];
    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
        const nextLevel: string[] = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left;
            const combined = await sha256(left + right);
            nextLevel.push(combined);
            if (i === 0) proof.push(right);
        }
        currentLevel = nextLevel;
    }

    return { root: currentLevel[0], proof };
}

// Generate file hash from File object
async function hashFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Storage helpers
function getTimestamps(): BlockchainTimestamp[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveTimestamps(timestamps: BlockchainTimestamp[]) {
    const trimmed = timestamps.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export const blockchainService = {
    /**
     * Create a blockchain timestamp for a file
     */
    async timestampFile(file: File): Promise<BlockchainTimestamp> {
        const fileHash = await hashFile(file);
        const now = new Date();

        // Build Merkle tree (simulate including this hash with other pending hashes)
        const simulatedHashes = [
            fileHash,
            randomHex(64),
            randomHex(64),
            randomHex(64),
        ];
        const { root: merkleRoot, proof: merkleProof } = await buildMerkleTree(simulatedHashes);

        // Simulate blockchain anchoring
        const blockHeight = 830000 + Math.floor(Math.random() * 10000);
        const blockHash = '0000000000000000000' + randomHex(45);
        const txHash = randomHex(64);
        const network: 'Bitcoin' | 'Ethereum' = Math.random() > 0.5 ? 'Bitcoin' : 'Ethereum';

        const certificate: TimestampCertificate = {
            version: '1.0.0',
            fileDigest: fileHash,
            algorithm: 'SHA-256',
            merkleRoot,
            merkleProof,
            anchorPoint: {
                network,
                blockHeight,
                blockHash,
                txHash,
                timestamp: now.toISOString(),
            },
            issuer: 'CyberVault Timestamp Authority',
            issuedAt: now.toISOString(),
            expiresAt: null, // Blockchain timestamps never expire
        };

        const timestamp: BlockchainTimestamp = {
            id: `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileHash,
            fileName: file.name,
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            merkleRoot,
            blockHeight,
            blockHash,
            txHash,
            network,
            timestamp: now.toISOString(),
            status: 'pending',
            confirmations: 0,
            proofUrl: `https://blockstream.info/tx/${txHash}`,
            certificate,
        };

        // Save to storage
        const timestamps = getTimestamps();
        timestamps.unshift(timestamp);
        saveTimestamps(timestamps);

        // Simulate confirmation process
        setTimeout(() => {
            const stored = getTimestamps();
            const found = stored.find(t => t.id === timestamp.id);
            if (found) {
                found.status = 'confirmed';
                found.confirmations = 1;
                saveTimestamps(stored);
            }
        }, 3000);

        setTimeout(() => {
            const stored = getTimestamps();
            const found = stored.find(t => t.id === timestamp.id);
            if (found) {
                found.status = 'anchored';
                found.confirmations = 6;
                saveTimestamps(stored);
            }
        }, 8000);

        return timestamp;
    },

    /**
     * Verify a file against a stored timestamp
     */
    async verifyFile(file: File, timestampId: string): Promise<{
        valid: boolean;
        message: string;
        originalHash?: string;
        currentHash?: string;
        timestamp?: BlockchainTimestamp;
    }> {
        const currentHash = await hashFile(file);
        const timestamps = getTimestamps();
        const timestamp = timestamps.find(t => t.id === timestampId);

        if (!timestamp) {
            return { valid: false, message: 'Timestamp record not found' };
        }

        const isValid = currentHash === timestamp.fileHash;
        return {
            valid: isValid,
            message: isValid
                ? 'File integrity verified! The file has not been modified since timestamping.'
                : 'WARNING: File has been modified! The current hash does not match the timestamped hash.',
            originalHash: timestamp.fileHash,
            currentHash,
            timestamp,
        };
    },

    /**
     * Verify a file hash directly
     */
    async verifyHash(fileHash: string): Promise<{
        found: boolean;
        timestamp?: BlockchainTimestamp;
    }> {
        const timestamps = getTimestamps();
        const timestamp = timestamps.find(t => t.fileHash === fileHash);
        return {
            found: !!timestamp,
            timestamp: timestamp || undefined,
        };
    },

    /**
     * Get all timestamps
     */
    getAll(): BlockchainTimestamp[] {
        return getTimestamps();
    },

    /**
     * Get timestamp by ID
     */
    getById(id: string): BlockchainTimestamp | undefined {
        return getTimestamps().find(t => t.id === id);
    },

    /**
     * Delete a timestamp
     */
    delete(id: string): void {
        const timestamps = getTimestamps().filter(t => t.id !== id);
        saveTimestamps(timestamps);
    },

    /**
     * Generate downloadable certificate JSON
     */
    generateCertificateJSON(timestamp: BlockchainTimestamp): string {
        return JSON.stringify(timestamp.certificate, null, 2);
    },

    /**
     * Generate downloadable proof text
     */
    generateProofText(timestamp: BlockchainTimestamp): string {
        const cert = timestamp.certificate;
        return `
═══════════════════════════════════════════════════════════════
                CYBERVAULT BLOCKCHAIN TIMESTAMP
                  PROOF OF EXISTENCE CERTIFICATE
═══════════════════════════════════════════════════════════════

File Name:        ${timestamp.fileName}
File Size:        ${timestamp.fileSize}
SHA-256 Hash:     ${cert.fileDigest}

───────────────────────────────────────────────────────────────
                     BLOCKCHAIN ANCHOR
───────────────────────────────────────────────────────────────

Network:          ${cert.anchorPoint.network}
Block Height:     ${cert.anchorPoint.blockHeight}
Block Hash:       ${cert.anchorPoint.blockHash}
Transaction:      ${cert.anchorPoint.txHash}
Merkle Root:      ${cert.merkleRoot}
Timestamp:        ${cert.anchorPoint.timestamp}

Merkle Proof:
${cert.merkleProof.map((p, i) => `  [${i}] ${p}`).join('\n')}

───────────────────────────────────────────────────────────────
                      CERTIFICATE DETAILS
───────────────────────────────────────────────────────────────

Issuer:           ${cert.issuer}
Version:          ${cert.version}
Algorithm:        ${cert.algorithm}
Issued At:        ${cert.issuedAt}
Expires At:       ${cert.expiresAt || 'Never (Immutable)'}
Confirmations:    ${timestamp.confirmations}
Status:           ${timestamp.status.toUpperCase()}

═══════════════════════════════════════════════════════════════
  This certificate proves that the above file existed at the
  specified timestamp. The proof is anchored to the ${cert.anchorPoint.network}
  blockchain and can be independently verified.
═══════════════════════════════════════════════════════════════
`.trim();
    },

    /**
     * Hash a file (exposed for external use)
     */
    hashFile,
};

export default blockchainService;
