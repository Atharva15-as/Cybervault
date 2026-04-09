import { supabase } from '../lib/supabase';
import { encryptionService } from './encryptionService';

/**
 * Storage Encryption Service
 * Handles encrypted file uploads to Supabase Storage with RLS protection
 * and client-side AES-256-GCM encryption
 */

export interface UploadOptions {
    passphrase?: string;
    onProgress?: (stage: string, percent: number) => void;
    expiryDuration?: string;
    expiryDateOverride?: Date;
    enableTimeLimit?: boolean;
    maxDownloads?: number;
    linkPassword?: string;
}

export interface DownloadOptions {
    onProgress?: (stage: string, percent: number) => void;
}

export interface StorageFile {
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    expiryDate: Date;
    downloadCount: number;
    maxDownloads: number;
    securityStatus: 'safe' | 'warning' | 'danger';
    maliciousScore: number;
    shareToken?: string;
    shareUrl?: string;
}

export interface UploadedFileRecord {
    id: string;
    fileName: string;
    hash: string;
    expiryDate: Date;
    downloadCount: number;
    maxDownloads: number;
    shareToken: string;
    shareUrl: string;
}

const PRIMARY_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'user_files';
const FALLBACK_STORAGE_BUCKETS = ['encrypted-files', 'user-files', 'encrypted_files', 'userfiles'];

export const storageEncryptionService = {
    getAppShareUrl(shareToken: string): string {
        if (typeof window !== 'undefined' && window.location?.origin) {
            return `${window.location.origin}/share/${shareToken}`;
        }

        const fallbackOrigin = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
        return `${fallbackOrigin.replace(/\/$/, '')}/share/${shareToken}`;
    },

    resolveBucketCandidates(): string[] {
        const all = [PRIMARY_STORAGE_BUCKET, ...FALLBACK_STORAGE_BUCKETS];
        return Array.from(new Set(all.map((b) => b.trim()).filter(Boolean)));
    },

    isBucketNotFoundError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error || '');
        return /bucket.*not found/i.test(message) || /not found/i.test(message);
    },

    async uploadToAvailableBucket(storagePath: string, encryptedBlob: Blob): Promise<{ bucket: string }> {
        const buckets = this.resolveBucketCandidates();
        let lastError: Error | null = null;
        const errors: string[] = [];

        for (const bucket of buckets) {
            const { error } = await supabase.storage
                .from(bucket)
                .upload(storagePath, encryptedBlob, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (!error) return { bucket };

            lastError = new Error(error.message);
            errors.push(`${bucket}: ${error.message}`);
            
            if (!this.isBucketNotFoundError(lastError)) {
                throw lastError;
            }
        }

        const helpfulMessage = `All storage bucket candidates [${buckets.join(', ')}] failed. ` +
            `Please ensure at least one of these exists in your Supabase project "${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}". ` +
            `Details: ${errors.join('; ')}`;
        
        throw new Error(helpfulMessage);
    },

    async downloadFromAvailableBucket(storagePath: string): Promise<{ bucket: string; data: Blob }> {
        const buckets = this.resolveBucketCandidates();
        let lastError: Error | null = null;

        for (const bucket of buckets) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .download(storagePath);

            if (!error && data) {
                return { bucket, data };
            }

            lastError = new Error(error?.message || 'Storage download failed');
            if (!this.isBucketNotFoundError(lastError)) {
                throw lastError;
            }
        }

        throw lastError || new Error('Storage download failed');
    },

    async removeFromAvailableBucket(storagePath: string): Promise<void> {
        const buckets = this.resolveBucketCandidates();
        let lastError: Error | null = null;

        for (const bucket of buckets) {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([storagePath]);

            if (!error) return;

            lastError = new Error(error.message);
            if (!this.isBucketNotFoundError(lastError)) {
                throw lastError;
            }
        }

        if (lastError) throw lastError;
    },

    /**
     * Upload and encrypt a file to Supabase Storage
     * File is encrypted client-side before upload
     * Metadata is stored in the database with RLS protection
     */
    async uploadEncryptedFile(
        file: File,
        options: UploadOptions = {}
    ): Promise<{
        success: boolean;
        fileId?: string;
        shareToken?: string;
        shareUrl?: string;
        passphrase?: string;
        encryptedBlob?: Blob;
        encryptedFileName?: string;
        fileRecord?: UploadedFileRecord;
        error?: Error;
    }> {
        try {
            options.onProgress?.('Authenticating...', 5);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Encrypt the file
            options.onProgress?.('Encrypting file...', 15);
            const {
                blob: encryptedBlob,
                passphraseUsed,
                originalName,
                originalSize,
                originalHash,
                encryptedHash,
            } = await encryptionService.encryptFile(file, options.passphrase, (stage, percent) => {
                options.onProgress?.(stage, 15 + (percent * 0.5));
            });

            // Generate share token
            options.onProgress?.('Generating share token...', 65);
            const shareToken = this.generateShareToken();
            const storagePath = `${user.id}/${shareToken}.enc`;
            const encryptedFileName = this.toEncFileName(originalName);

            // Upload encrypted file to Supabase Storage
            options.onProgress?.('Uploading to storage...', 70);
            await this.uploadToAvailableBucket(storagePath, encryptedBlob);
            const shareUrl = this.getAppShareUrl(shareToken);

            // Calculate expiry date
            options.onProgress?.('Saving metadata...', 80);
            const now = new Date();
            const timeLimitEnabled = options.enableTimeLimit !== false;
            let expiryDate: Date;
            let expiryDuration: string;

            if (!timeLimitEnabled) {
                // Practical "no expiry" mode
                expiryDate = new Date('2099-12-31T23:59:59.000Z');
                expiryDuration = 'none';
            } else {
                const maxAllowedExpiry = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
                const requestedExpiry = options.expiryDateOverride ?? this.calculateExpiryDate(options.expiryDuration || '7d');
                expiryDate = requestedExpiry > maxAllowedExpiry ? maxAllowedExpiry : requestedExpiry;
                expiryDuration = options.expiryDuration || 'custom';
            }

            // Hash the link password if provided
            let linkPasswordHash: string | null = null;
            if (options.linkPassword) {
                linkPasswordHash = await this.hashPassword(options.linkPassword);
            }

            // Create database record with RLS protection
            const { data: fileRecord, error: dbError } = await supabase
                .from('shared_files')
                .insert({
                    user_id: user.id,
                    file_name: originalName,
                    file_size: this.formatFileSize(originalSize),
                    file_hash: originalHash,
                    encrypted_hash: encryptedHash,
                    pin_hash: '', // Can be set separately if needed
                    storage_path: storagePath,
                    share_token: shareToken,
                    share_url: shareUrl,
                    expiry_date: expiryDate.toISOString(),
                    expiry_duration: expiryDuration,
                    max_downloads: options.maxDownloads || 0,
                    link_password_hash: linkPasswordHash,
                    security_status: 'safe',
                    malicious_score: 0,
                })
                .select()
                .single();

            if (dbError) {
                // Clean up uploaded file if DB insert fails
                await this.removeFromAvailableBucket(storagePath);
                throw new Error(`Database error: ${dbError.message}`);
            }

            options.onProgress?.('Upload complete!', 100);

            return {
                success: true,
                fileId: fileRecord.id,
                shareToken: shareToken,
                shareUrl,
                passphrase: passphraseUsed,
                encryptedBlob,
                encryptedFileName,
                fileRecord: {
                    id: fileRecord.id,
                    fileName: fileRecord.file_name,
                    hash: fileRecord.file_hash,
                    expiryDate: new Date(fileRecord.expiry_date),
                    downloadCount: fileRecord.download_count || 0,
                    maxDownloads: fileRecord.max_downloads || 0,
                    shareToken,
                    shareUrl,
                },
            };
        } catch (error) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : String(error);
            const normalized = message.toLowerCase();
            const isBucketError = normalized.includes('bucket') && normalized.includes('not found');
            return {
                success: false,
                error: isBucketError
                    ? new Error(
                        `No compatible storage bucket found. Create "${PRIMARY_STORAGE_BUCKET}" in Supabase Storage, or set VITE_SUPABASE_STORAGE_BUCKET to an existing bucket.`
                    )
                    : error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    /**
     * Download and decrypt a file from Supabase Storage
     * Verifies integrity before decryption
     */
    async downloadEncryptedFile(
        shareToken: string,
        passphrase: string,
        options: DownloadOptions = {}
    ): Promise<{
        success: boolean;
        blob?: Blob;
        fileName?: string;
        originalHash?: string;
        error?: Error;
    }> {
        try {
            options.onProgress?.('Fetching file metadata...', 10);

            // Get file record from database
            const { data: fileRecord, error: dbError } = await supabase
                .from('shared_files')
                .select('*')
                .eq('share_token', shareToken)
                .eq('is_active', true)
                .single();

            if (dbError || !fileRecord) {
                throw new Error('File not found or has been deactivated');
            }

            // Check expiry
            if (new Date(fileRecord.expiry_date) < new Date()) {
                throw new Error('This file link has expired');
            }

            // Check download limit
            if (fileRecord.max_downloads > 0 && fileRecord.download_count >= fileRecord.max_downloads) {
                throw new Error('Download limit reached for this file');
            }

            // Download encrypted file from storage
            options.onProgress?.('Downloading encrypted file...', 30);
            const { data: encryptedData } = await this.downloadFromAvailableBucket(fileRecord.storage_path);

            // Verify integrity
            options.onProgress?.('Verifying file integrity...', 50);
            const isValid = await encryptionService.verifyEncryptedIntegrity(
                encryptedData,
                fileRecord.encrypted_hash
            );

            if (!isValid) {
                throw new Error('File integrity check failed - file may have been tampered with');
            }

            // Decrypt file
            options.onProgress?.('Decrypting file...', 70);
            const decrypted = await encryptionService.decryptFile(
                encryptedData,
                passphrase,
                (stage, percent) => {
                    options.onProgress?.(stage, 70 + (percent * 0.2));
                }
            );

            // Update download count
            options.onProgress?.('Updating download count...', 90);
            await supabase
                .from('shared_files')
                .update({
                    download_count: fileRecord.download_count + 1,
                    last_accessed: new Date().toISOString(),
                })
                .eq('id', fileRecord.id);

            options.onProgress?.('Download complete!', 100);

            return {
                success: true,
                blob: decrypted.blob,
                fileName: decrypted.fileName,
                originalHash: decrypted.originalHash,
            };
        } catch (error) {
            console.error('Download error:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    /**
     * Get all files for the current user
     * Protected by RLS - only returns user's own files
     */
    async getUserFiles(): Promise<{
        success: boolean;
        files?: StorageFile[];
        error?: Error;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data: files, error } = await supabase
                .from('shared_files')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedFiles: StorageFile[] = (files || []).map(f => ({
                id: f.id,
                fileName: f.file_name,
                fileSize: parseInt(f.file_size) || 0,
                uploadedAt: new Date(f.created_at),
                expiryDate: new Date(f.expiry_date),
                downloadCount: f.download_count,
                maxDownloads: f.max_downloads,
                securityStatus: f.security_status,
                maliciousScore: f.malicious_score,
                shareToken: f.share_token,
                shareUrl: f.share_url,
            }));

            return { success: true, files: formattedFiles };
        } catch (error) {
            console.error('Error fetching user files:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    /**
     * Delete a file (only owner can delete)
     * Removes both storage and database records
     */
    async deleteFile(fileId: string): Promise<{
        success: boolean;
        error?: Error;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get file record to find storage path
            const { data: fileRecord, error: fetchError } = await supabase
                .from('shared_files')
                .select('storage_path')
                .eq('id', fileId)
                .eq('user_id', user.id)
                .single();

            if (fetchError || !fileRecord) {
                throw new Error('File not found or unauthorized');
            }

            // Delete from storage
            try {
                await this.removeFromAvailableBucket(fileRecord.storage_path);
            } catch (storageError) {
                console.warn('Storage deletion warning:', storageError);
            }

            // Delete database record
            const { error: dbError } = await supabase
                .from('shared_files')
                .delete()
                .eq('id', fileId)
                .eq('user_id', user.id);

            if (dbError) throw dbError;

            return { success: true };
        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    /**
     * Deactivate a file (soft delete)
     */
    async deactivateFile(fileId: string): Promise<{
        success: boolean;
        error?: Error;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('shared_files')
                .update({ is_active: false })
                .eq('id', fileId)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deactivating file:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async setLinkPassword(fileId: string, password: string | null): Promise<{
        success: boolean;
        error?: Error;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const linkPasswordHash = password && password.trim().length > 0
                ? await this.hashPassword(password.trim())
                : null;

            const { error } = await supabase
                .from('shared_files')
                .update({ link_password_hash: linkPasswordHash })
                .eq('id', fileId)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error setting link password:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async setMaxDownloads(fileId: string, maxDownloads: number): Promise<{
        success: boolean;
        error?: Error;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const normalized = Number.isFinite(maxDownloads) ? Math.max(0, Math.floor(maxDownloads)) : 0;

            const { error } = await supabase
                .from('shared_files')
                .update({ max_downloads: normalized })
                .eq('id', fileId)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error setting max downloads:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    /**
     * Generate a random share token
     */
    generateShareToken(length = 20): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            token += chars[values[i] % chars.length];
        }
        return token;
    },

    /**
     * Calculate expiry date based on duration string
     */
    calculateExpiryDate(duration: string): Date {
        const now = new Date();
        const match = duration.match(/^(\d+)([hdm])$/);

        if (!match) {
            // Default to 7 days
            now.setDate(now.getDate() + 7);
            return now;
        }

        const [, value, unit] = match;
        const num = parseInt(value);

        switch (unit) {
            case 'h':
                now.setHours(now.getHours() + num);
                break;
            case 'd':
                now.setDate(now.getDate() + num);
                break;
            case 'm':
                now.setMonth(now.getMonth() + num);
                break;
        }

        return now;
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

    toEncFileName(fileName: string): string {
        const lastDotIndex = fileName.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0;
        const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
        return `${baseName}.enc`;
    },

    /**
     * Hash a password using SHA-256
     */
    async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Verify a password against its hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    },
};

export default storageEncryptionService;
