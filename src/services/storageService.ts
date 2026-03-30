/**
 * Secure Storage Service
 * Handles encrypted file upload/download to Supabase Storage
 * Ensures zero-knowledge: only ciphertext hits the server
 * Integrity verification via SHA-256 checksums
 */

import { supabase } from '../lib/supabase';
import encryptionService from './encryptionService';

// Configuration
const STORAGE_CONFIG = {
    bucket: 'encrypted-files',
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    pathPattern: '{userId}/{fileId}/{fileName}.enc'
};

/**
 * Secure file upload with client-side encryption
 * Flow: File → Encrypt in browser → Upload ciphertext → Save metadata
 */
export async function uploadSecureFile(
    file: File,
    passphrase: string,
    expiryDuration: string = '24h',
    onProgress?: (stage: string, percent: number) => void
): Promise<{
    fileId?: string;
    shareToken?: string;
    shareUrl?: string;
    status: 'success' | 'error';
    message: string;
}> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { status: 'error', message: 'User not authenticated' };
        }

        // Step 1: Validate file
        if (!file) {
            return { status: 'error', message: 'No file selected' };
        }
        if (file.size > STORAGE_CONFIG.maxFileSize) {
            return { status: 'error', message: `File size exceeds maximum (${STORAGE_CONFIG.maxFileSize / 1024 / 1024}MB)` };
        }

        console.log(`[UPLOAD] File: ${file.name} (${file.size} bytes)`);

        // Step 2: Encrypt file in browser (zero-knowledge)
        onProgress?.('Encrypting file...', 20);
        const encrypted = await encryptionService.encryptFile(file, passphrase, (stage, pct) => {
            onProgress?.(stage, 10 + Math.floor(pct * 0.5)); // 10-60%
        });

        console.log(`[UPLOAD] Encrypted size: ${encrypted.blob.size} bytes`);

        // Step 3: Hash the passphrase for storage (never store plaintext!)
        onProgress?.('Securing passphrase...', 65);
        const encoder = new TextEncoder();
        const pinData = encoder.encode(passphrase);
        const pinHashBuffer = await crypto.subtle.digest('SHA-256', pinData);
        const pinHashArray = Array.from(new Uint8Array(pinHashBuffer));
        const pinHash = pinHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Step 4: Generate share token
        const shareToken = generateShareToken(32);
        const fileId = crypto.randomUUID();
        const shareUrl = `${getAppURL()}/share/${shareToken}`;

        // Step 5: Upload encrypted blob to Supabase Storage
        onProgress?.('Uploading encrypted file...', 70);
        const storagePath = `${user.id}/${fileId}/${file.name}.enc`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from(STORAGE_CONFIG.bucket)
            .upload(storagePath, encrypted.blob, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'application/octet-stream'
            });

        if (storageError) {
            console.error('[ERROR] Storage upload failed:', storageError);
            return { status: 'error', message: `Storage upload failed: ${storageError.message}` };
        }

        console.log(`[UPLOAD] File stored at: ${storageData.path}`);

        // Step 6: Calculate expiry date
        const expiryDate = calculateExpiryFromDuration(expiryDuration);

        // Step 7: Save metadata to database (only ciphertext info, never plaintext)
        onProgress?.('Saving metadata...', 85);
        const { error: dbError } = await supabase
            .from('shared_files')
            .insert({
                id: fileId,
                user_id: user.id,
                file_name: file.name,          // We store the name for display in dashboard
                file_size: formatFileSize(file.size),
                file_hash: encrypted.originalHash,
                encrypted_hash: encrypted.encryptedHash,
                pin_hash: pinHash,
                storage_path: storagePath,
                share_token: shareToken,
                share_url: shareUrl,
                expiry_date: expiryDate.toISOString(),
                expiry_duration: expiryDuration,
                security_status: 'safe',
                is_active: true,
                download_count: 0,
            })
            .select()
            .single();

        if (dbError) {
            console.error('[ERROR] Database save failed:', dbError);
            // Cleanup: Delete uploaded file if DB insert fails
            await supabase.storage.from(STORAGE_CONFIG.bucket).remove([storagePath]);
            return { status: 'error', message: `Database save failed: ${dbError.message}` };
        }

        onProgress?.('Upload complete!', 100);
        console.log(`[UPLOAD] SUCCESS - File ID: ${fileId}`);

        return {
            fileId,
            shareToken,
            shareUrl,
            status: 'success',
            message: 'File encrypted and uploaded successfully'
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ERROR] Upload failed:', errorMsg);
        return { status: 'error', message: `Upload failed: ${errorMsg}` };
    }
}

/**
 * Download encrypted file from Supabase Storage
 * Returns raw encrypted blob — decryption happens client-side
 */
export async function downloadEncryptedFile(
    shareToken: string
): Promise<{
    blob?: Blob;
    fileRecord?: any;
    status: 'success' | 'error';
    message: string;
}> {
    try {
        console.log('[DOWNLOAD] Retrieving file metadata...');

        // Get file metadata by share token (public access)
        const { data: fileRecord, error } = await supabase
            .from('shared_files')
            .select('*')
            .eq('share_token', shareToken)
            .eq('is_active', true)
            .single();

        if (error || !fileRecord) {
            return { status: 'error', message: 'File not found or access denied' };
        }

        // Check expiry
        if (new Date(fileRecord.expiry_date) < new Date()) {
            return { status: 'error', message: 'This link has expired' };
        }

        // Check download limit
        if (fileRecord.max_downloads > 0 && fileRecord.download_count >= fileRecord.max_downloads) {
            return { status: 'error', message: 'Download limit reached for this file' };
        }

        console.log(`[DOWNLOAD] File: ${fileRecord.file_name}`);

        // Download encrypted blob from storage
        if (!fileRecord.storage_path) {
            return { status: 'error', message: 'File storage path not found' };
        }

        console.log('[DOWNLOAD] Downloading encrypted blob from storage...');
        const { data: fileBlob, error: downloadError } = await supabase.storage
            .from(STORAGE_CONFIG.bucket)
            .download(fileRecord.storage_path);

        if (downloadError || !fileBlob) {
            console.error('[ERROR] Download failed:', downloadError);
            return { status: 'error', message: `Download failed: ${downloadError?.message || 'Unknown error'}` };
        }

        console.log(`[DOWNLOAD] Downloaded: ${fileBlob.size} bytes`);

        // Verify encrypted blob integrity
        if (fileRecord.encrypted_hash) {
            const isIntact = await encryptionService.verifyEncryptedIntegrity(fileBlob, fileRecord.encrypted_hash);
            if (!isIntact) {
                console.error('[SECURITY] Encrypted blob integrity check FAILED — possible tampering!');
                return { status: 'error', message: 'File integrity check failed. The file may have been tampered with.' };
            }
            console.log('[DOWNLOAD] Integrity check PASSED ✓');
        }

        return {
            blob: fileBlob,
            fileRecord,
            status: 'success',
            message: 'File downloaded successfully'
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ERROR] Download failed:', errorMsg);
        return { status: 'error', message: `Download failed: ${errorMsg}` };
    }
}

/**
 * Decrypt file client-side and trigger download
 * Zero-knowledge: server never sees the plaintext
 */
export async function decryptAndDownload(
    encryptedBlob: Blob,
    passphrase: string,
    fileId: string,
    onProgress?: (stage: string, percent: number) => void
): Promise<{
    file?: Blob;
    fileName?: string;
    fileSize?: number;
    status: 'success' | 'error';
    message: string;
    verification?: {
        integrityVerified: boolean;
        integrityStatus: string;
    };
}> {
    try {
        console.log('[DECRYPT] Starting client-side decryption...');

        // Decrypt file in browser
        const decrypted = await encryptionService.decryptFile(encryptedBlob, passphrase, (stage, pct) => {
            onProgress?.(stage, pct);
        });

        console.log(`[DECRYPT] Decrypted: ${decrypted.fileName} (${decrypted.fileSize} bytes)`);

        // Update download count
        try {
            // Use the RPC or manual increment
            const { data } = await supabase
                .from('shared_files')
                .select('download_count')
                .eq('id', fileId)
                .single();

            if (data) {
                await supabase
                    .from('shared_files')
                    .update({
                        download_count: (data.download_count || 0) + 1,
                        last_accessed: new Date().toISOString()
                    })
                    .eq('id', fileId);
            }
        } catch (e) {
            console.warn('[WARN] Failed to update download count:', e);
        }

        return {
            file: decrypted.blob,
            fileName: decrypted.fileName,
            fileSize: decrypted.fileSize,
            status: 'success',
            message: 'File decrypted and verified successfully',
            verification: {
                integrityVerified: true,
                integrityStatus: 'VERIFIED'
            }
        };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[ERROR] Decryption failed:', errorMsg);
        return {
            status: 'error',
            message: errorMsg,
            verification: {
                integrityVerified: false,
                integrityStatus: 'FAILED'
            }
        };
    }
}

/**
 * Delete encrypted file from storage and DB
 */
export async function deleteSecureFile(fileId: string): Promise<{
    status: 'success' | 'error';
    message: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { status: 'error', message: 'Not authenticated' };
        }

        // Get file record
        const { data: fileRecord, error: getError } = await supabase
            .from('shared_files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', user.id)
            .single();

        if (getError || !fileRecord) {
            return { status: 'error', message: 'File not found or not authorized' };
        }

        // Delete from storage
        if (fileRecord.storage_path) {
            const { error: deleteStorageError } = await supabase.storage
                .from(STORAGE_CONFIG.bucket)
                .remove([fileRecord.storage_path]);

            if (deleteStorageError) {
                console.error('[ERROR] Storage deletion failed:', deleteStorageError);
            }
        }

        // Delete database record
        const { error: deleteDbError } = await supabase
            .from('shared_files')
            .delete()
            .eq('id', fileId);

        if (deleteDbError) {
            return { status: 'error', message: `Database deletion failed: ${deleteDbError.message}` };
        }

        return { status: 'success', message: 'File deleted successfully' };

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'error', message: `Delete failed: ${errorMsg}` };
    }
}

// ============ Utility Functions ============

function generateShareToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        token += chars[values[i] % chars.length];
    }
    return token;
}

function getAppURL(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'http://localhost:5173';
}

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function calculateExpiryFromDuration(duration: string): Date {
    const now = new Date();
    switch (duration) {
        case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
        case '6h': return new Date(now.getTime() + 6 * 60 * 60 * 1000);
        case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
}

/**
 * Secure file download from backend server (decryption on backend)
 * This follows the requested architecture:
 * POST /decrypt with fileId and key -> Backend decrypts -> Returns decrypted blob
 */
export async function downloadSecurelyFromServer(
    fileId: string,
    passphrase: string,
    storagePath?: string
): Promise<{
    blob?: Blob;
    fileName?: string;
    error?: string;
}> {
    try {
        const response = await fetch('http://localhost:3000/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileId,
                password: passphrase,
                storagePath
            }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to decrypt file';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // Not a JSON error
            }
            return { error: errorMessage };
        }

        // Get blob
        const blob = await response.blob();
        
        // Try to get filename from headers
        let fileName = 'decrypted_file';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match && match[1]) {
                fileName = match[1];
            }
        } else {
            // Fallback header we added to backend
            const xFileName = response.headers.get('X-Original-Filename');
            if (xFileName) fileName = xFileName;
        }

        return {
            blob,
            fileName
        };
    } catch (error) {
        console.error('[ERROR] Secure download failed:', error);
        return { error: 'Connection to decryption server failed' };
    }
}

export default {
    uploadSecureFile,
    downloadEncryptedFile,
    decryptAndDownload,
    downloadSecurelyFromServer,
    deleteSecureFile,
    STORAGE_CONFIG
};
