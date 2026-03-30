// File DNA Service — Multi-hash fingerprinting with visual representation

export interface FileDNA {
    id: string;
    fileName: string;
    fileSize: number;
    hashes: {
        md5: string;
        sha1: string;
        sha256: string;
        sha512: string;
    };
    fingerprint: string; // Visual ASCII art fingerprint
    timestamp: string;
    entropy: number;
    fileType: string;
}

// Simple hash implementations using Web Crypto API
async function computeHash(buffer: ArrayBuffer, algorithm: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple MD5-like hash (not cryptographic, for display purposes)
function simpleMD5(data: Uint8Array): string {
    let hash = 0x67452301;
    let hash2 = 0xEFCDAB89;
    let hash3 = 0x98BADCFE;
    let hash4 = 0x10325476;

    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data[i]) | 0;
        hash2 = ((hash2 << 7) + hash2 ^ data[i]) | 0;
        hash3 = ((hash3 << 3) - hash3 + data[i]) | 0;
        hash4 = ((hash4 << 11) + hash4 ^ data[i]) | 0;
    }

    const result = [hash, hash2, hash3, hash4].map(h => {
        return (h >>> 0).toString(16).padStart(8, '0');
    }).join('');

    return result;
}

// Calculate Shannon entropy
function calculateEntropy(data: Uint8Array): number {
    const freq = new Map<number, number>();
    for (const byte of data) {
        freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    const len = data.length;
    for (const count of freq.values()) {
        const p = count / len;
        if (p > 0) entropy -= p * Math.log2(p);
    }

    return Math.round(entropy * 1000) / 1000;
}

// Generate SSH-key-style visual fingerprint
function generateVisualFingerprint(hash: string): string {
    const symbols = [' ', '.', 'o', '+', '=', '*', 'B', 'O', 'X', '@', '%', '&', '#', '/', '^'];
    const width = 17;
    const height = 9;
    const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

    let x = Math.floor(width / 2);
    let y = Math.floor(height / 2);

    // Walk based on hash bytes
    for (let i = 0; i < hash.length - 1; i += 2) {
        const byte = parseInt(hash.substr(i, 2), 16);
        for (let bit = 0; bit < 4; bit++) {
            const direction = (byte >> (bit * 2)) & 3;
            switch (direction) {
                case 0: if (y > 0) y--; break;
                case 1: if (y < height - 1) y++; break;
                case 2: if (x > 0) x--; break;
                case 3: if (x < width - 1) x++; break;
            }
            grid[y][x] = Math.min(grid[y][x] + 1, symbols.length - 1);
        }
    }

    // Build visual representation
    let result = '+---[CyberVault]---+\n';
    for (let row = 0; row < height; row++) {
        result += '|';
        for (let col = 0; col < width; col++) {
            result += symbols[grid[row][col]];
        }
        result += '|\n';
    }
    result += '+------[SHA256]----+';

    return result;
}

const STORAGE_KEY = 'cybervault_file_dna';

function getDNARecords(): FileDNA[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveDNARecords(records: FileDNA[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
}

export const fileDNAService = {
    /**
     * Generate complete DNA fingerprint for a file
     */
    async generateDNA(file: File): Promise<FileDNA> {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);

        // Compute all hashes
        const sha256 = await computeHash(buffer, 'SHA-256');
        const sha1 = await computeHash(buffer, 'SHA-1');
        const sha512 = await computeHash(buffer, 'SHA-512');
        const md5 = simpleMD5(data);

        const entropy = calculateEntropy(data);
        const fingerprint = generateVisualFingerprint(sha256);

        const dna: FileDNA = {
            id: `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileSize: file.size,
            hashes: { md5, sha1, sha256, sha512 },
            fingerprint,
            timestamp: new Date().toISOString(),
            entropy,
            fileType: file.type || 'unknown',
        };

        // Save to storage
        const records = getDNARecords();
        records.unshift(dna);
        saveDNARecords(records);

        return dna;
    },

    /**
     * Compare two file DNAs
     */
    compareDNA(dna1: FileDNA, dna2: FileDNA): {
        identical: boolean;
        matchPercentage: number;
        differences: string[];
    } {
        const differences: string[] = [];
        let matches = 0;
        const totalChecks = 4;

        if (dna1.hashes.md5 === dna2.hashes.md5) matches++;
        else differences.push('MD5 hash mismatch');

        if (dna1.hashes.sha1 === dna2.hashes.sha1) matches++;
        else differences.push('SHA-1 hash mismatch');

        if (dna1.hashes.sha256 === dna2.hashes.sha256) matches++;
        else differences.push('SHA-256 hash mismatch');

        if (dna1.hashes.sha512 === dna2.hashes.sha512) matches++;
        else differences.push('SHA-512 hash mismatch');

        return {
            identical: matches === totalChecks,
            matchPercentage: (matches / totalChecks) * 100,
            differences,
        };
    },

    getAll(): FileDNA[] {
        return getDNARecords();
    },

    getById(id: string): FileDNA | undefined {
        return getDNARecords().find(d => d.id === id);
    },

    delete(id: string): void {
        saveDNARecords(getDNARecords().filter(d => d.id !== id));
    },
};

export default fileDNAService;
