# Secure File Exchange - Quick Start Guide

Get up and running with end-to-end encrypted file sharing in 5 minutes.

## Prerequisites

- Supabase project created
- `.env` file with Supabase credentials
- React application with Tailwind CSS

## 1. Setup Supabase

### Create Storage Bucket
```bash
# In Supabase Dashboard:
# 1. Go to Storage
# 2. Create bucket: "user_files"
# 3. Set to Private
```

### Run Database Schema
```bash
# In Supabase SQL Editor, run:
# supabase/schema.sql
```

### Enable RLS Policies
```bash
# Storage → Policies → Add policies from SUPABASE_STORAGE_SETUP.md
```

## 2. Install Dependencies

```bash
npm install lucide-react @radix-ui/react-tabs
```

## 3. Add Environment Variables

```env
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Import Components

```typescript
import SecureFileExchange from './pages/SecureFileExchange';

// In your router or app:
<Route path="/secure-exchange" element={<SecureFileExchange />} />
```

## 5. Test the Flow

### Upload a File
1. Go to Secure File Exchange page
2. Click "Upload & Encrypt" tab
3. Select a file
4. Click "Encrypt & Upload"
5. Copy the share URL and passphrase

### Download a File
1. Click "Decrypt & Download" tab
2. Paste the share token
3. Enter the passphrase
4. Click "Decrypt & Download"
5. File downloads with original name and extension

### Manage Files
1. Click "My Files" tab
2. View all uploaded files
3. See download counts and expiry dates
4. Delete files as needed

## Key Features

### 🔐 Encryption
- **AES-256-GCM**: Military-grade encryption
- **PBKDF2**: 600,000 iterations for key derivation
- **SHA-256**: Integrity verification
- **Zero-Knowledge**: Encryption happens in browser

### 🔒 Access Control
- **RLS Policies**: Database enforces owner-based access
- **Storage Policies**: Bucket policies prevent unauthorized access
- **Share Tokens**: Random 32-character tokens
- **Expiry Dates**: Time-limited access
- **Download Limits**: Optional maximum downloads

### 📊 Management
- **File Listing**: View all uploaded files
- **Statistics**: Total size, downloads, active files
- **Deletion**: Remove files with confirmation
- **Monitoring**: Track download counts

## API Reference

### Upload File
```typescript
import storageEncryptionService from './services/storageEncryptionService';

const result = await storageEncryptionService.uploadEncryptedFile(file, {
    passphrase: 'optional-custom-passphrase',
    expiryDuration: '7d',  // '1h', '24h', '7d', '30d'
    maxDownloads: 5,        // 0 = unlimited
    onProgress: (stage, percent) => console.log(stage, percent)
});

if (result.success) {
    console.log('Share URL:', result.shareUrl);
    console.log('Passphrase:', result.passphrase);
    console.log('Share Token:', result.shareToken);
}
```

### Download File
```typescript
const result = await storageEncryptionService.downloadEncryptedFile(
    shareToken,
    passphrase,
    {
        onProgress: (stage, percent) => console.log(stage, percent)
    }
);

if (result.success) {
    // File is automatically downloaded
    console.log('Downloaded:', result.fileName);
}
```

### Get User Files
```typescript
const result = await storageEncryptionService.getUserFiles();

if (result.success) {
    result.files?.forEach(file => {
        console.log(file.fileName, file.fileSize, file.expiryDate);
    });
}
```

### Delete File
```typescript
const result = await storageEncryptionService.deleteFile(fileId);

if (result.success) {
    console.log('File deleted');
}
```

## Encryption Details

### File Structure
```
[16-byte salt][12-byte IV][Encrypted Payload]

Encrypted Payload:
[4-byte metadata length][metadata JSON][file data]

Metadata:
{
    "name": "original-filename.ext",
    "size": 1024,
    "type": "application/octet-stream",
    "originalHash": "sha256-hash",
    "encryptedAt": "2024-03-26T10:00:00Z"
}
```

### Key Derivation
```
PBKDF2(
    password: passphrase,
    salt: random 16 bytes,
    iterations: 600000,
    hash: SHA-256,
    keyLength: 256 bits
)
```

### Encryption
```
AES-256-GCM(
    key: derived key,
    iv: random 12 bytes,
    plaintext: [metadata][file data],
    aad: none
)
```

## Security Best Practices

1. **Share Separately**: Send URL and passphrase through different channels
2. **Strong Passphrases**: Use custom passphrases for sensitive files
3. **Set Expiry**: Use shorter expiry times for sensitive content
4. **Limit Downloads**: Restrict downloads for highly sensitive files
5. **Delete After Use**: Remove files after recipients download
6. **HTTPS Only**: Always use HTTPS in production
7. **Monitor Access**: Track download patterns
8. **Backup Passphrases**: Users should securely backup passphrases

## Troubleshooting

### "User not authenticated"
- Ensure user is logged in
- Check Supabase auth configuration

### "File not found"
- Verify share token is correct
- Check if file has expired
- Ensure RLS policies are enabled

### "Decryption failed"
- Verify passphrase is correct
- Check if file was corrupted
- Try downloading again

### "Storage upload failed"
- Check bucket exists
- Verify RLS policies allow upload
- Check file size limits

## Examples

### Complete Upload Example
```typescript
import SecureFileUpload from './components/SecureFileUpload';

export function MyUploadPage() {
    return (
        <SecureFileUpload
            onUploadSuccess={(fileId, shareToken, passphrase) => {
                console.log('Upload successful!');
                console.log('Share this URL:', `${window.location.origin}/share/${shareToken}`);
                console.log('With passphrase:', passphrase);
            }}
            onUploadError={(error) => {
                console.error('Upload failed:', error.message);
            }}
        />
    );
}
```

### Complete Download Example
```typescript
import SecureFileDownload from './components/SecureFileDownload';

export function MyDownloadPage({ shareToken }: { shareToken: string }) {
    return (
        <SecureFileDownload
            shareToken={shareToken}
            onDownloadSuccess={(fileName) => {
                console.log('Downloaded:', fileName);
            }}
            onDownloadError={(error) => {
                console.error('Download failed:', error.message);
            }}
        />
    );
}
```

### Complete Management Example
```typescript
import SecureFileManager from './components/SecureFileManager';

export function MyFilesPage() {
    return (
        <SecureFileManager
            onFileDeleted={(fileId) => {
                console.log('File deleted:', fileId);
            }}
        />
    );
}
```

## Next Steps

1. ✅ Setup Supabase project
2. ✅ Run database schema
3. ✅ Configure RLS policies
4. ✅ Add environment variables
5. ✅ Import components
6. ✅ Test upload/download
7. ✅ Deploy to production

## Support

For detailed information, see:
- `SUPABASE_STORAGE_SETUP.md` - Complete setup guide
- `src/services/storageEncryptionService.ts` - API documentation
- `src/services/encryptionService.ts` - Encryption details

## License

This implementation follows OWASP and NIST cryptographic guidelines.
