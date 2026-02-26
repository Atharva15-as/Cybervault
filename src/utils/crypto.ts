// Crypto utilities for file hashing and security

/**
 * Generate SHA-256 hash from a file
 */
export async function generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Generate a unique share token using cryptographically secure random values
 */
export function generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint32Array(32);
    crypto.getRandomValues(randomValues);
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(randomValues[i] % chars.length);
    }
    return token;
}

/**
 * Calculate expiry date from duration string
 */
export function calculateExpiryDate(duration: string): Date {
    const now = new Date();
    switch (duration) {
        case '1h':
            return new Date(now.getTime() + 60 * 60 * 1000);
        case '6h':
            return new Date(now.getTime() + 6 * 60 * 60 * 1000);
        case '24h':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 24h
    }
}

/**
 * Format remaining time until expiry
 */
export function formatTimeRemaining(expiryDate: Date): string {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} min${minutes > 1 ? 's' : ''}`;
}

/**
 * Validate PIN format (4-6 digits)
 */
export function validatePin(pin: string): boolean {
    return /^\d{4,6}$/.test(pin);
}

/**
 * Hash PIN for storage (simple hash for demo - use bcrypt in production)
 */
export async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify PIN against hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    const inputHash = await hashPin(pin);
    return inputHash === hash;
}
