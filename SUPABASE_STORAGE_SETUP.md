# Supabase Storage & Access Control Implementation Guide

This guide covers the complete setup and implementation of end-to-end encrypted file storage using Supabase with client-side AES-256-GCM encryption and Row-Level Security (RLS).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. File Selection                                    │   │
│  │ 2. AES-256-GCM Encryption (Web Crypto API)          │   │
│  │ 3. SHA-256 Hash Computation                         │   │
│  │ 4. Metadata Encryption                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Storage (Encrypted Blob)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [16-byte salt][12-byte IV][Encrypted Payload]       │   │
│  │ - Metadata (name, size, type, hash)                 │   │
│  │ - File content                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         Supabase Database (RLS Protected)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ shared_files table                                   │   │
│  │ - file_id, owner_id (RLS: owner_id = auth.uid())   │   │
│  │ - file_hash, encrypted_hash                         │   │
│  │ - storage_path, share_token                         │   │
│  │ - expiry_date, max_downloads                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 1.2 Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `user_files`
3. Set bucket to **Private** (RLS will control access)
4. Enable versioning if desired

### 1.3 Enable RLS on Storage
1. Go to Storage → Policies
2. Create RLS policy for `user_files` bucket:

```sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user_files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to download their own files
CREATE POLICY "Users can download their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user_files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user_files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 2: Database Schema

### 2.1 Run SQL Schema
Execute the SQL in `supabase/schema.sql` in your Supabase SQL Editor:

```sql
-- The schema includes:
-- - shared_files table with RLS policies
-- - shared_file_emails table for email sharing
-- - Indexes for performance
-- - Triggers for auto-updating timestamps
-- - Views for statistics
```

### 2.2 Verify RLS Policies
The schema includes these RLS policies:
- **Users can view own files**: `owner_id = auth.uid()`
- **Users can insert own files**: `owner_id = auth.uid()`
- **Users can update own files**: `owner_id = auth.uid()`
- **Users can delete own files**: `owner_id = auth.uid()`
- **Public can view by share token**: `is_active = true AND expiry_date > NOW()`

## Step 3: Client-Side Encryption Implementation

### 3.1 Encryption Service (`encryptionService.ts`)
Provides:
- **AES-256-GCM encryption** with Web Crypto API
- **PBKDF2 key derivation** (600,000 iterations)
- **SHA-256 hashing** for integrity verification
- **Passphrase generation** for sharing

Key functions:
```typescript
// Encrypt a file
const result = await encryptionService.encryptFile(file, passphrase);
// Returns: { blob, passphraseUsed, originalHash, encryptedHash }

// Decrypt a file
const decrypted = await encryptionService.decryptFile(encryptedBlob, passphrase);
// Returns: { blob, fileName, fileSize, fileType, originalHash }

// Compute SHA-256 hash
const hash = await encryptionService.computeHash(data);

// Verify integrity
const isValid = await encryptionService.verifyEncryptedIntegrity(blob, storedHash);
```

### 3.2 Storage Encryption Service (`storageEncryptionService.ts`)
Handles:
- **File upload** with encryption and metadata storage
- **File download** with integrity verification
- **RLS-protected queries** to database
- **Share token generation** and management

Key functions:
```typescript
// Upload encrypted file
const result = await storageEncryptionService.uploadEncryptedFile(file, {
    passphrase: 'optional-custom-passphrase',
    expiryDuration: '7d',
    maxDownloads: 5,
    onProgress: (stage, percent) => console.log(stage, percent)
});

// Download and decrypt file
const result = await storageEncryptionService.downloadEncryptedFile(
    shareToken,
    passphrase,
    { onProgress: (stage, percent) => console.log(stage, percent) }
);

// Get user's files (RLS protected)
const result = await storageEncryptionService.getUserFiles();

// Delete file
const result = await storageEncryptionService.deleteFile(fileId);
```

## Step 4: UI Components

### 4.1 SecureFileUpload Component
```typescript
<SecureFileUpload 
    onUploadSuccess={(fileId, shareToken, passphrase) => {
        // Handle successful upload
    }}
    onUploadError={(error) => {
        // Handle error
    }}
/>
```

Features:
- File selection with drag-and-drop
- Expiry duration selection (1h, 24h, 7d, 30d)
- Max downloads limit
- Custom passphrase with strength meter
- Real-time progress tracking
- Share URL and passphrase display

### 4.2 SecureFileDownload Component
```typescript
<SecureFileDownload 
    shareToken={token}
    onDownloadSuccess={(fileName) => {
        // Handle successful download
    }}
    onDownloadError={(error) => {
        // Handle error
    }}
/>
```

Features:
- Passphrase input with visibility toggle
- Real-time decryption progress
- Integrity verification
- Automatic file download
- Error handling with user-friendly messages

### 4.3 SecureFileManager Component
```typescript
<SecureFileManager 
    onFileDeleted={(fileId) => {
        // Handle file deletion
    }}
/>
```

Features:
- List all user's encrypted files
- Display file metadata (size, status, expiry)
- Download count tracking
- Delete files with confirmation
- Summary statistics

### 4.4 SecureFileExchange Page
Complete page combining all components with:
- Tabbed interface (Upload, Download, Manage)
- Security information
- Best practices guide

## Step 5: Encryption Workflow

### Upload Workflow
```
1. User selects file
2. Generate or derive encryption key (PBKDF2)
3. Generate random salt (16 bytes) and IV (12 bytes)
4. Create metadata JSON (name, size, type, hash)
5. Combine: [metadata_length][metadata][file_data]
6. Encrypt combined payload with AES-256-GCM
7. Prepend salt and IV: [salt][iv][encrypted_payload]
8. Upload encrypted blob to Supabase Storage
9. Store metadata in database (RLS protected)
10. Return share token and passphrase to user
```

### Download Workflow
```
1. User provides share token and passphrase
2. Query database for file metadata (RLS enforced)
3. Check expiry date and download limits
4. Download encrypted blob from storage
5. Extract salt and IV from blob
6. Derive key using PBKDF2 with extracted salt
7. Decrypt payload with AES-256-GCM
8. Extract metadata and file data
9. Verify SHA-256 hash of file data
10. Restore original filename and extension
11. Trigger browser download
12. Update download count in database
```

## Step 6: Security Considerations

### 6.1 Key Management
- **Client-side only**: Keys never leave the browser
- **PBKDF2 derivation**: 600,000 iterations for brute-force resistance
- **Random salt**: 16 bytes per file for uniqueness
- **Random IV**: 12 bytes per encryption for GCM mode

### 6.2 Integrity Verification
- **SHA-256 hashing**: Computed on both original and encrypted data
- **Tamper detection**: Hash mismatch indicates tampering
- **GCM authentication**: Built-in authentication tag prevents forgery

### 6.3 Access Control
- **RLS policies**: Database enforces owner-based access
- **Storage policies**: Bucket policies prevent unauthorized access
- **Share tokens**: Random 32-character tokens for public sharing
- **Expiry dates**: Time-limited access to shared files
- **Download limits**: Optional maximum downloads per file

### 6.4 Transport Security
- **HTTPS only**: Always use HTTPS for your frontend
- **TLS encryption**: Supabase provides TLS for all connections
- **JWT tokens**: Supabase uses JWT for authentication

### 6.5 Best Practices
1. **Never share complete URLs**: Share URL and passphrase separately
2. **Use strong passphrases**: Encourage users to set custom passphrases
3. **Set appropriate expiry**: Balance accessibility with security
4. **Limit downloads**: Restrict downloads for sensitive content
5. **Delete after use**: Remove files after recipients download
6. **Monitor access**: Track download counts and access patterns
7. **Backup keys**: Users should backup passphrases securely
8. **HTTPS enforcement**: Always use HTTPS in production

## Step 7: Testing

### 7.1 Unit Tests
```typescript
// Test encryption/decryption
const file = new File(['test'], 'test.txt');
const encrypted = await encryptionService.encryptFile(file, 'passphrase');
const decrypted = await encryptionService.decryptFile(encrypted.blob, 'passphrase');
assert(decrypted.fileName === 'test.txt');

// Test hash verification
const isValid = await encryptionService.verifyEncryptedIntegrity(
    encrypted.blob,
    encrypted.encryptedHash
);
assert(isValid === true);

// Test wrong passphrase
try {
    await encryptionService.decryptFile(encrypted.blob, 'wrong-passphrase');
    assert(false, 'Should have thrown');
} catch (e) {
    assert(e.message.includes('Decryption failed'));
}
```

### 7.2 Integration Tests
```typescript
// Test full upload/download cycle
const file = new File(['sensitive data'], 'secret.txt');
const uploadResult = await storageEncryptionService.uploadEncryptedFile(file);
assert(uploadResult.success === true);

const downloadResult = await storageEncryptionService.downloadEncryptedFile(
    uploadResult.shareToken,
    uploadResult.passphrase
);
assert(downloadResult.success === true);
assert(downloadResult.fileName === 'secret.txt');

// Verify content matches
const originalContent = await file.text();
const downloadedContent = await downloadResult.blob.text();
assert(originalContent === downloadedContent);
```

### 7.3 Security Tests
```typescript
// Test RLS enforcement
const user1Token = await getAuthToken(user1);
const user2Token = await getAuthToken(user2);

// User1 uploads file
const uploadResult = await uploadFile(user1Token, file);

// User2 should not see user1's files
const user2Files = await getUserFiles(user2Token);
assert(!user2Files.find(f => f.id === uploadResult.fileId));

// User2 should not be able to download without passphrase
try {
    await downloadFile(user2Token, uploadResult.shareToken, 'wrong-passphrase');
    assert(false, 'Should have failed');
} catch (e) {
    assert(e.message.includes('Decryption failed'));
}
```

## Step 8: Deployment

### 8.1 Environment Variables
```env
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 8.2 HTTPS Configuration
- Ensure your frontend is served over HTTPS
- Configure CORS in Supabase if needed
- Set secure cookie flags

### 8.3 Monitoring
- Monitor storage usage
- Track download patterns
- Alert on suspicious activity
- Log access attempts

## Troubleshooting

### Issue: "User not authenticated"
- Ensure user is logged in before uploading
- Check Supabase auth configuration
- Verify JWT token is valid

### Issue: "File not found or unauthorized"
- Verify share token is correct
- Check if file has expired
- Ensure RLS policies are enabled

### Issue: "Decryption failed"
- Verify passphrase is correct
- Check if file was corrupted during transfer
- Ensure browser supports Web Crypto API

### Issue: "Storage upload failed"
- Check bucket exists and is accessible
- Verify RLS policies allow upload
- Check file size limits
- Ensure storage quota not exceeded

### Issue: "Integrity check failed"
- File may have been tampered with
- Network error during download
- Storage corruption
- Try downloading again

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Guidelines](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-38D.pdf)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors
4. Verify RLS policies are correctly configured
5. Test with sample files first
