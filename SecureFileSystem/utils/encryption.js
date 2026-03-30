/**
 * Encryption Utilities
 * Handles AES-256 encryption/decryption with PBKDF2 key derivation
 * 
 * Security Features:
 * - AES-256-GCM for authenticated encryption
 * - PBKDF2 with 600,000 iterations for key derivation
 * - Random IV and salt generation
 * - SHA-256 for integrity verification
 * - No plaintext password storage
 */

const crypto = require('crypto');

// Configuration
const ENCRYPTION_CONFIG = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits for AES-256
    saltLength: 16, // 16 bytes for salt
    ivLength: 16, // 16 bytes for IV
    tagLength: 16, // 16 bytes for authentication tag
    pbkdf2: {
        iterations: 600000, // High iteration count for security
        digest: 'sha256'
    }
};

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User's password/PIN
 * @param {Buffer|undefined} salt - Optional salt (generated if not provided)
 * @returns {Promise<{key: Buffer, salt: Buffer}>}
 */
async function deriveKey(password, salt = null) {
    try {
        // Generate salt if not provided
        const keySalt = salt || crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);

        // Derive key using PBKDF2
        const key = crypto.pbkdf2Sync(
            password,
            keySalt,
            ENCRYPTION_CONFIG.pbkdf2.iterations,
            ENCRYPTION_CONFIG.keyLength,
            ENCRYPTION_CONFIG.pbkdf2.digest
        );

        return { key, salt: keySalt };
    } catch (error) {
        throw new Error(`Key derivation failed: ${error.message}`);
    }
}

/**
 * Encrypt file with AES-256-GCM
 * @param {Buffer} fileBuffer - Original file content
 * @param {string} password - User's password/PIN
 * @returns {Promise<{encryptedData: Buffer, salt: Buffer, iv: Buffer, authTag: Buffer, hash: string}>}
 */
async function encryptFile(fileBuffer, password) {
    try {
        // Input validation
        if (!Buffer.isBuffer(fileBuffer)) {
            throw new Error('File must be a Buffer');
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Step 1: Derive key from password
        const { key, salt } = await deriveKey(password);

        // Step 2: Generate random IV (initialization vector)
        const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

        // Step 3: Create cipher
        const cipher = crypto.createCipheriv(
            ENCRYPTION_CONFIG.algorithm,
            key,
            iv
        );

        // Step 4: Encrypt file data
        const encryptedData = Buffer.concat([
            cipher.update(fileBuffer),
            cipher.final()
        ]);

        // Step 5: Get authentication tag (for detecting tampering)
        const authTag = cipher.getAuthTag();

        // Step 6: Calculate SHA-256 hash of original file (for integrity verification)
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        console.log(`[ENCRYPT] File encrypted successfully`);
        console.log(`[ENCRYPT] Original size: ${fileBuffer.length} bytes`);
        console.log(`[ENCRYPT] Encrypted size: ${encryptedData.length} bytes`);
        console.log(`[ENCRYPT] Hash: ${hash.substring(0, 16)}...`);

        return {
            encryptedData,
            salt,
            iv,
            authTag,
            hash
        };
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

/**
 * Decrypt file with AES-256-GCM
 * @param {Buffer} encryptedData - Encrypted file content
 * @param {Buffer} salt - Salt used during encryption
 * @param {Buffer} iv - IV used during encryption
 * @param {Buffer} authTag - Authentication tag
 * @param {string} password - User's password/PIN
 * @returns {Promise<Buffer>} Decrypted file content
 */
async function decryptFile(encryptedData, salt, iv, authTag, password) {
    try {
        // Input validation
        if (!Buffer.isBuffer(encryptedData) || !Buffer.isBuffer(salt) || 
            !Buffer.isBuffer(iv) || !Buffer.isBuffer(authTag)) {
            throw new Error('Invalid encrypted data format');
        }
        if (!password || typeof password !== 'string') {
            throw new Error('Password is required');
        }

        // Step 1: Derive key from password using same salt
        const { key } = await deriveKey(password, salt);

        // Step 2: Create decipher
        const decipher = crypto.createDecipheriv(
            ENCRYPTION_CONFIG.algorithm,
            key,
            iv
        );

        // Step 3: Set authentication tag for verification
        decipher.setAuthTag(authTag);

        // Step 4: Decrypt data
        const decryptedData = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        console.log(`[DECRYPT] File decrypted successfully`);
        console.log(`[DECRYPT] Decrypted size: ${decryptedData.length} bytes`);

        return decryptedData;
    } catch (error) {
        // GCM tag verification failed indicates wrong password or corrupted data
        if (error.message.includes('Unsupported state or unable to authenticate data')) {
            throw new Error('Invalid password or file corrupted');
        }
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Verify file integrity using SHA-256 hash
 * @param {Buffer} fileBuffer - Decrypted file content
 * @param {string} storedHash - Hash stored during encryption
 * @returns {boolean} True if hash matches
 */
function verifyIntegrity(fileBuffer, storedHash) {
    try {
        const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const isValid = calculatedHash === storedHash;

        console.log(`[VERIFY] Stored hash: ${storedHash.substring(0, 16)}...`);
        console.log(`[VERIFY] Calculated hash: ${calculatedHash.substring(0, 16)}...`);
        console.log(`[VERIFY] Integrity check: ${isValid ? 'PASSED ✓' : 'FAILED ✗'}`);

        return isValid;
    } catch (error) {
        throw new Error(`Integrity verification failed: ${error.message}`);
    }
}

/**
 * Generate random filename for encrypted files
 * @returns {string} Random filename with .enc extension
 */
function generateEncryptedFileName() {
    const randomPart = crypto.randomBytes(8).toString('hex');
    return `${randomPart}.enc`;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {valid: boolean, errors: string[]}
 */
function validatePassword(password) {
    const errors = [];

    if (!password) {
        errors.push('Password is required');
    }
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    deriveKey,
    encryptFile,
    decryptFile,
    verifyIntegrity,
    generateEncryptedFileName,
    validatePassword,
    ENCRYPTION_CONFIG
};
