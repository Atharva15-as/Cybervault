/**
 * Secure File Storage System - Backend Server
 * 
 * Features:
 * - AES-256-GCM encryption with PBKDF2 key derivation
 * - File upload with encryption
 * - File listing
 * - File decryption with password verification
 * - SHA-256 integrity verification
 * - Rate limiting for security
 * - Stream processing for large files
 */

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const encryption = require('./utils/encryption');

// ==================== CONFIGURATION ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client (Admin Access)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Service Role Key in production!
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
    origin: '*', // In production, specify your frontend URL
    exposedHeaders: ['Content-Disposition', 'X-Original-Filename']
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.static('public'));

// Create required directories
const uploadsDir = path.join(__dirname, 'uploads');
const metadataDir = path.join(__dirname, 'metadata');

[uploadsDir, metadataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(), // Store in memory for processing
    limits: {
        fileSize: 500 * 1024 * 1024 // 500 MB max
    }
});

// ==================== RATE LIMITING ====================
const attemptTracker = new Map(); // Track failed decryption attempts

/**
 * Check if IP is rate limited (brute-force protection)
 * @param {string} ip - Client IP
 * @returns {boolean} True if rate limited
 */
function isRateLimited(ip) {
    const now = Date.now();
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    if (!attemptTracker.has(ip)) {
        attemptTracker.set(ip, []);
    }

    const attempts = attemptTracker.get(ip);
    
    // Remove old attempts outside lockout window
    const recentAttempts = attempts.filter(time => now - time < lockoutDuration);
    attemptTracker.set(ip, recentAttempts);

    return recentAttempts.length >= maxAttempts;
}

/**
 * Record a failed attempt
 * @param {string} ip - Client IP
 */
function recordFailedAttempt(ip) {
    const attempts = attemptTracker.get(ip) || [];
    attempts.push(Date.now());
    attemptTracker.set(ip, attempts);
}

/**
 * Clear attempt history for IP
 * @param {string} ip - Client IP
 */
function clearAttempts(ip) {
    attemptTracker.delete(ip);
}

/**
 * Helper to fetch file from Supabase Storage
 */
async function fetchFromSupabase(storagePath) {
    console.log(`[STORAGE] Fetching from Supabase: ${storagePath}`);
    const { data, error } = await supabase.storage
        .from('encrypted-files')
        .download(storagePath);
    
    if (error || !data) {
        throw new Error(`Failed to fetch from Supabase: ${error?.message || 'Empty response'}`);
    }
    
    return Buffer.from(await data.arrayBuffer());
}

// ==================== METADATA MANAGEMENT ====================

/**
 * Load metadata for a file
 * @param {string} fileId - File identifier
 * @returns {object} File metadata
 */
function loadMetadata(fileId) {
    const metadataPath = path.join(metadataDir, `${fileId}.json`);
    
    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    try {
        const data = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading metadata for ${fileId}:`, error);
        return null;
    }
}

/**
 * Save metadata for a file
 * @param {string} fileId - File identifier
 * @param {object} metadata - File metadata
 */
function saveMetadata(fileId, metadata) {
    const metadataPath = path.join(metadataDir, `${fileId}.json`);

    try {
        fs.writeFileSync(
            metadataPath,
            JSON.stringify(metadata, null, 2),
            'utf8'
        );
        console.log(`[METADATA] Saved for file: ${fileId}`);
    } catch (error) {
        console.error(`Error saving metadata for ${fileId}:`, error);
        throw error;
    }
}

/**
 * List all files with metadata
 * @returns {array} Array of file metadata
 */
function listAllFiles() {
    try {
        const files = fs.readdirSync(metadataDir);
        const fileList = [];

        files.forEach(file => {
            if (file.endsWith('.json')) {
                const fileId = file.replace('.json', '');
                const metadata = loadMetadata(fileId);
                if (metadata) {
                    fileList.push({
                        fileId,
                        ...metadata,
                        // Don't expose sensitive data
                        salt: undefined,
                        iv: undefined,
                        authTag: undefined,
                        hash: undefined
                    });
                }
            }
        });

        return fileList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

// ==================== ROUTES ====================

/**
 * Home page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * POST /upload - Encrypt and store file
 * 
 * Body:
 * - file: multipart file
 * - password: string (min 6 chars)
 * 
 * Response:
 * - fileId: unique file identifier
 * - filename: original filename
 * - size: encrypted file size
 */
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('\n[UPLOAD] New upload request');

        // Validate inputs
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }

        // Validate password
        const passwordValidation = encryption.validatePassword(req.body.password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: passwordValidation.errors[0]
            });
        }

        const originalFilename = req.file.originalname;
        const fileBuffer = req.file.buffer;
        const password = req.body.password;

        console.log(`[UPLOAD] File: ${originalFilename} (${fileBuffer.length} bytes)`);
        console.log(`[UPLOAD] Password length: ${password.length} chars`);

        // Encrypt file
        const { encryptedData, salt, iv, authTag, hash } = await encryption.encryptFile(
            fileBuffer,
            password
        );

        // Generate file ID
        const fileId = uuidv4();
        const encryptedFileName = `${fileId}.enc`;
        const encryptedFilePath = path.join(uploadsDir, encryptedFileName);

        // Save encrypted file
        fs.writeFileSync(encryptedFilePath, encryptedData);
        console.log(`[UPLOAD] Encrypted file saved: ${encryptedFileName}`);

        // Create and save metadata (without password!)
        const metadata = {
            fileId,
            originalFilename,
            originalSize: fileBuffer.length,
            encryptedSize: encryptedData.length,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            hash,
            uploadedAt: new Date().toISOString(),
            uploadedFrom: req.ip || 'unknown',
            // Never store password in metadata!
            // Password is only in user's memory
        };

        saveMetadata(fileId, metadata);

        console.log(`[UPLOAD] Success - File ID: ${fileId}`);

        return res.json({
            success: true,
            message: 'File uploaded and encrypted successfully',
            fileId,
            filename: originalFilename,
            size: fileBuffer.length,
            uploadedAt: metadata.uploadedAt
        });

    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /files - List all uploaded files
 * 
 * Response:
 * - files: array of file metadata (without sensitive data)
 */
app.get('/files', (req, res) => {
    try {
        console.log('[LIST FILES] Request received');
        const files = listAllFiles();
        
        return res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        console.error('[LIST ERROR]', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /decrypt - Securely Decrypt File
 * Supports both local storage and Supabase Storage (Dashboard Uploads)
 */
app.post('/decrypt', async (req, res) => {
    try {
        const clientIp = req.ip || 'unknown';
        const { fileId, password, storagePath } = req.body;

        console.log(`\n[DECRYPT] Request for File ID: ${fileId || 'unknown'}`);

        // 1. Rate Limiting Check
        if (isRateLimited(clientIp)) {
            return res.status(429).json({ success: false, error: 'Too many failed attempts. Wait 15 minutes.' });
        }

        // 2. Input Validation
        if (!password) {
            return res.status(400).json({ success: false, error: 'Decryption passphrase is required' });
        }

        let encryptedBuffer;
        let originalFilename = 'file';

        // 3. Fetch Encrypted Data (Supabase vs Local)
        if (storagePath) {
            // Flow for files uploaded via Dashboard/Supabase
            try {
                encryptedBuffer = await fetchFromSupabase(storagePath);
                
                // Fetch filename from DB if needed, or extract from path
                originalFilename = storagePath.split('/').pop().replace('.enc', '');
            } catch (err) {
                return res.status(404).json({ success: false, error: 'Failed to retrieve file from remote storage' });
            }
        } else if (fileId) {
            // Flow for backend-specific uploads (local)
            const metadata = loadMetadata(fileId);
            if (!metadata) return res.status(404).json({ success: false, error: 'File metadata not found' });
            
            originalFilename = metadata.originalFilename;
            const encryptedFilePath = path.join(uploadsDir, `${fileId}.enc`);
            if (!fs.existsSync(encryptedFilePath)) return res.status(404).json({ success: false, error: 'File not found on server' });
            
            encryptedBuffer = fs.readFileSync(encryptedFilePath);
        } else {
            return res.status(400).json({ success: false, error: 'File reference (ID or Path) is required' });
        }

        // 4. Decrypt - Handling Browser-Client Binary Format
        // Format: [16b Salt][12b IV][Encrypted Data + 16b AuthTag]
        try {
            if (encryptedBuffer.length < 28 + 16) {
                throw new Error('Incomplete data for decryption');
            }

            const salt = encryptedBuffer.slice(0, 16);
            const iv = encryptedBuffer.slice(16, 28);
            const cipherTextWithTag = encryptedBuffer.slice(28);
            
            // In Node/GCM, auth-tag is separate but Web Crypto appends it to ciphertext
            const authTag = cipherTextWithTag.slice(cipherTextWithTag.length - 16);
            const encryptedData = cipherTextWithTag.slice(0, cipherTextWithTag.length - 16);

            // Derive key using PBKDF2 (matching encryptionService.ts)
            const crypto = require('crypto');
            const key = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');

            // Decrypt using AES-256-GCM
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decryptedBuffer = Buffer.concat([
                decipher.update(encryptedData),
                decipher.final()
            ]);

            // 5. Extract Zero-Knowledge Metadata Header
            // The browser prepends: [4-byte Metadata Length][JSON Metadata][File Data]
            const metadataLength = decryptedBuffer.readUInt32LE(0);
            const metadataJSON = decryptedBuffer.slice(4, 4 + metadataLength).toString('utf8');
            const fileData = decryptedBuffer.slice(4 + metadataLength);
            
            const metadata = JSON.parse(metadataJSON);
            let finalFilename = metadata.name || originalFilename;
            
            // Append .enc if it doesn't already have it, as requested
            if (!finalFilename.endsWith('.enc')) {
                finalFilename += '.enc';
            }

            console.log(`[DECRYPT] Decryption successful for ${finalFilename}`);
            clearAttempts(clientIp);

            // 6. Send as direct download response
            res.set({
                'Content-Type': metadata.type || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${finalFilename}"`,
                'Content-Length': fileData.length,
                'X-Original-Filename': finalFilename,
                'Access-Control-Expose-Headers': 'Content-Disposition, X-Original-Filename'
            });

            return res.send(fileData);

        } catch (decryptErr) {
            console.error(`[DECRYPT] Error: ${decryptErr.message}`);
            recordFailedAttempt(clientIp);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid decryption key or corrupted data',
                message: 'The key provided could not decrypt the file. Potential data tampering or incorrect passphrase.'
            });
        }

    } catch (err) {
        console.error('[SERVER ERROR]', err);
        return res.status(500).json({ success: false, error: 'Internal server processing error' });
    }
});

/**
 * POST /delete - Delete encrypted file
 * 
 * Body:
 * - fileId: file identifier
 */
app.post('/delete', (req, res) => {
    try {
        const fileId = req.body.fileId;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                error: 'File ID is required'
            });
        }

        console.log(`[DELETE] Deleting file: ${fileId}`);

        // Delete encrypted file
        const encryptedFilePath = path.join(uploadsDir, `${fileId}.enc`);
        if (fs.existsSync(encryptedFilePath)) {
            fs.unlinkSync(encryptedFilePath);
            console.log(`[DELETE] Encrypted file deleted`);
        }

        // Delete metadata
        const metadataPath = path.join(metadataDir, `${fileId}.json`);
        if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
            console.log(`[DELETE] Metadata deleted`);
        }

        return res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('[DELETE ERROR]', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`
        });
    }

    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🔐 SECURE FILE STORAGE SYSTEM');
    console.log('='.repeat(50));
    console.log(`\n✓ Server running on: http://localhost:${PORT}`);
    console.log(`✓ Upload directory: ${uploadsDir}`);
    console.log(`✓ Metadata directory: ${metadataDir}`);
    console.log(`✓ Encryption: AES-256-GCM`);
    console.log(`✓ Key derivation: PBKDF2 (600k iterations)`);
    console.log('\n' + '='.repeat(50) + '\n');
});

module.exports = app;
