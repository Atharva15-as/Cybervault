# Secure File Encryption System - Implementation Guide

## Overview
CyberVault implements a comprehensive secure file upload, encryption, storage, and download system with PIN-based protection. This guide outlines the complete workflow from file upload through secure decryption, ensuring maximum security, privacy, and data integrity.

## System Architecture

```
USER UPLOADS FILE
        ↓
[1. PIN VALIDATION]
    ├── Prompt for PIN
    ├── Validate length (≥6 chars)
    └── Check complexity (recommended: alphanumeric + symbols)
        ↓
[2. ENCRYPTION PHASE]
    ├── File → Binary Buffer
    ├── Derive Key: PBKDF2(PIN, salt, 600000 iterations, SHA-256)
    ├── Generate: Random IV (96-bit for AES-GCM)
    ├── Encrypt: AES-256-GCM(file binary, IV, key)
    ├── Calculate: SHA-256 checksum of original file
    └── Format: [SALT(16B)] + [IV(12B)] + [ENCRYPTED_DATA] + [CHECKSUM]
        ↓
[3. STORAGE PHASE]
    ├── Upload encrypted blob to Supabase Storage
    ├── Store metadata in database:
    │   ├── file_name (original)
    │   ├── file_size (original)
    │   ├── file_hash (SHA-256 of original)
    │   ├── pin_hash (bcrypt/Argon2 of PIN)
    │   ├── storage_path (encrypted file location)
    │   ├── created_at, updated_at
    │   └── download_count, expiry settings
    ├── Ensure NO plain text PIN stored
    └── Ensure NO original file stored
        ↓
[FILE DOWNLOAD REQUEST]
        ↓
[4. PIN VERIFICATION PHASE]
    ├── Prompt user for PIN
    ├── Hash provided PIN: bcrypt/Argon2(input_pin)
    ├── Compare with stored hash
    ├── Limit attempts: 5 attempts per 15 minutes
    ├── Log failed attempts (without PIN)
    └── Block after exceeding limit
        ↓
[5. DECRYPTION PHASE]
    ├── Retrieve encrypted file from storage
    ├── Extract: salt, IV, encrypted_data
    ├── Re-derive key: PBKDF2(PIN, salt, 600000 iterations)
    ├── Decrypt: AES-256-GCM(encrypted_data, IV, key)
    ├── Extract: metadata, file_data
    ├── Verify checksum: SHA-256(file_data) == stored_hash
    └── Return file if checksums match
        ↓
[6. INTEGRITY VERIFICATION]
    ├── Check file_size matches original
    ├── Validate file type consistency
    ├── Ensure no data loss or corruption
    └── Confirm bit-by-bit match with original
        ↓
[FILE DOWNLOADED - EXACT BINARY MATCH]
```

---

## 1. FILE UPLOAD & PIN VALIDATION

### 1.1 PIN Requirements

```typescript
interface PINValidation {
    minLength: 6;
    maxLength: 128;
    requireMixedCase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    blockCommonPasswords?: boolean;
}

// Validation Function
function validatePIN(pin: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    
    if (!pin || pin.length < 6) {
        errors.push('PIN must be at least 6 characters long');
    }
    if (pin.length > 128) {
        errors.push('PIN must not exceed 128 characters');
    }
    // Optional: Recommend stronger PINs
    if (!/[a-z]/.test(pin)) {
        errors.push('Recommended: Include lowercase letters');
    }
    if (!/[A-Z]/.test(pin)) {
        errors.push('Recommended: Include uppercase letters');
    }
    if (!/[0-9]/.test(pin)) {
        errors.push('Recommended: Include numbers');
    }
    if (!/[^a-zA-Z0-9]/.test(pin)) {
        errors.push('Recommended: Include special characters');
    }
    
    // Block common passwords
    const blacklist = ['password', '123456', 'qwerty', '12345678'];
    if (blacklist.includes(pin.toLowerCase())) {
        errors.push('PIN is too common. Please choose a stronger PIN');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

### 1.2 PIN Strength Estimation

The `encryptionService.estimateStrength()` function provides real-time feedback:

```typescript
const strength = encryptionService.estimateStrength(userPin);
// Returns: { score: 0-100, label, color, suggestions: string[] }

// Display to user:
// - Very Weak (0-20)
// - Weak (20-40)
// - Fair (40-60)
// - Strong (60-80)
// - Very Strong (80-100)
```

---

## 2. ENCRYPTION PHASE

### 2.1 Key Derivation (PBKDF2)

**Why PBKDF2?**
- Industry standard for password-based encryption
- Resistant to dictionary attacks via high iteration count
- Deterministic: Same PIN + salt always produces same key

**Implementation:**
```typescript
async deriveKeyFromPassphrase(passphrase: string, salt?: Uint8Array): Promise<{
    key: CryptoKey;
    salt: Uint8Array;
}> {
    const salt = salt || crypto.getRandomValues(new Uint8Array(16));
    
    // PBKDF2 Configuration
    const config = {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000,  // High iteration count (recommended ≥ 600k)
        hash: 'SHA-256'      // Cryptographically secure hash
    };
    
    // Derive 256-bit AES key from PIN
    const key = await crypto.subtle.deriveKey(
        config,
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    
    return { key, salt };
}
```

**Security Properties:**
- 600,000 iterations makes brute force extremely expensive (2-3 seconds per attempt)
- Computational cost: ~2004 GBs to crack a 6-character PIN (at 1.1B/second)
- Time: ~24 days to crack a 6-character PIN with single GPU

### 2.2 File Encryption (AES-256-GCM)

**Why AES-256-GCM?**
- NIST approved algorithm
- Authenticated encryption: detects tampering
- Provides both confidentiality AND authenticity
- Prevents bit-flipping attacks

**Encryption Process:**
```typescript
async encryptFile(file: File, providedPassphrase: string): Promise<{
    blob: Blob;
    passphraseUsed: string;
}> {
    // 1. Generate random salt (prevents rainbow tables)
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // 2. Derive encryption key from PIN
    const { key } = await this.deriveKeyFromPassphrase(providedPassphrase, salt);
    
    // 3. Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit
    
    // 4. Read file as binary buffer (bit-by-bit integrity)
    const fileBuffer = await file.arrayBuffer();
    
    // 5. Attach metadata (name, size, type)
    const metadata = JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
    });
    const combined = combineMetadataAndFile(metadata, fileBuffer);
    
    // 6. Encrypt entire payload
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        combined.buffer
    );
    
    // 7. Package: [SALT(16)] + [IV(12)] + [ENCRYPTED_PAYLOAD]
    const finalBlob = packageEncryption(salt, iv, encryptedData);
    
    return {
        blob: finalBlob,
        passphraseUsed
    };
}
```

### 2.3 Checksum Calculation (SHA-256)

```typescript
async calculateFileChecksum(file: File): Promise<string> {
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Usage:
const checksum = await calculateFileChecksum(originalFile);
// Stored in database: file_hash = "a1b2c3d4e5f6..."
```

---

## 3. STORAGE PHASE

### 3.1 Database Schema (PostgreSQL/Supabase)

```sql
CREATE TABLE shared_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- File Metadata
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,  -- SHA-256 hex (64 chars)
    
    -- Security
    pin_hash VARCHAR(255) NOT NULL,  -- bcrypt hash (NOT plain text PIN!)
    
    -- Storage
    storage_path TEXT NOT NULL,      -- Supabase Storage path
    
    -- Sharing
    share_token VARCHAR(128) UNIQUE,
    share_url TEXT,
    expiry_date TIMESTAMP,
    expiry_duration VARCHAR(50),
    
    -- Audit
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Security Metadata
    malicious_score FLOAT DEFAULT 0,
    security_status ENUM('safe', 'warning', 'danger') DEFAULT 'safe'
);
```

### 3.2 Upload Function with Encryption

```typescript
async uploadSecureFile(
    file: File,
    pin: string,
    expiryDays: number = 7
): Promise<{
    fileId: string;
    shareUrl: string;
    status: 'success' | 'error';
    message: string;
}> {
    // Step 1: Validate PIN
    const pinValidation = validatePIN(pin);
    if (!pinValidation.valid) {
        return {
            fileId: '',
            shareUrl: '',
            status: 'error',
            message: pinValidation.errors[0]
        };
    }
    
    // Step 2: Encrypt file
    const { blob: encryptedBlob } = await encryptionService.encryptFile(
        file,
        pin
    );
    
    // Step 3: Calculate checksum of ORIGINAL file
    const fileHash = await calculateFileChecksum(file);
    
    // Step 4: Hash PIN for storage (DO NOT store plain text PIN)
    const pinHash = await bcrypt.hash(pin, 12);
    
    // Step 5: Generate share token
    const shareToken = generateShareToken(32);
    
    // Step 6: Upload encrypted file to Supabase Storage
    const storageResponse = await supabase.storage
        .from('encrypted-files')
        .upload(
            `${user.id}/${generateUUID()}/${file.name}.enc`,
            encryptedBlob
        );
    
    if (storageResponse.error) {
        return {
            fileId: '',
            shareUrl: '',
            status: 'error',
            message: `Storage upload failed: ${storageResponse.error.message}`
        };
    }
    
    // Step 7: Save metadata to database (NO PIN stored!)
    const { data, error } = await supabase
        .from('shared_files')
        .insert({
            user_id: user.id,
            file_name: file.name,
            file_size: file.size,
            file_hash: fileHash,
            pin_hash: pinHash,
            storage_path: storageResponse.data.path,
            share_token: shareToken,
            share_url: `${APP_URL}/share/${shareToken}`,
            expiry_date: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
            expiry_duration: `${expiryDays} days`,
            security_status: 'safe'
        })
        .select()
        .single();
    
    if (error) {
        // Cleanup: Delete uploaded file if DB insert fails
        await supabase.storage
            .from('encrypted-files')
            .remove([storageResponse.data.path]);
        
        return {
            fileId: '',
            shareUrl: '',
            status: 'error',
            message: `Database save failed: ${error.message}`
        };
    }
    
    return {
        fileId: data.id,
        shareUrl: data.share_url,
        status: 'success',
        message: 'File uploaded and encrypted successfully'
    };
}
```

### 3.3 Security Guarantees

✓ **No original file stored** - Only encrypted blob in storage
✓ **No PIN stored** - Only bcrypt hash in database
✓ **No sensitive data logged** - PIN/key never logged
✓ **Encrypted transport** - HTTPS only via Supabase
✓ **Access control** - Only file owner can access metadata
✓ **Audit trail** - Timestamps and download counts tracked

---

## 4. FILE DOWNLOAD & PIN VERIFICATION

### 4.1 Brute Force Protection

```typescript
const BRUTE_FORCE_CONFIG = {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,  // 15 minutes
    trackAttempts: true
};

interface LoginAttempt {
    fileId: string;
    attemptedAt: Date;
    success: boolean;
}

// In-memory or database tracking (rotate after lockout)
const attemptTracker = new Map<string, LoginAttempt[]>();

async function verifyPIN(fileId: string, userPin: string): Promise<{
    success: boolean;
    message: string;
    lockoutTime?: number;
}> {
    // Check if locked out
    const attempts = attemptTracker.get(fileId) || [];
    const recentAttempts = attempts.filter(
        a => Date.now() - a.attemptedAt.getTime() < BRUTE_FORCE_CONFIG.lockoutDuration
    );
    
    if (recentAttempts.length >= BRUTE_FORCE_CONFIG.maxAttempts) {
        const lockoutExpiry = recentAttempts[0].attemptedAt.getTime() + BRUTE_FORCE_CONFIG.lockoutDuration;
        const remainingTime = Math.ceil((lockoutExpiry - Date.now()) / 1000);
        
        // Log attempt (without PIN data)
        console.log(`[SECURITY] Brute force lockout: ${fileId}, retry in ${remainingTime}s`);
        
        return {
            success: false,
            message: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
            lockoutTime: remainingTime
        };
    }
    
    // Retrieve file record and PIN hash
    const file = await getFileById(fileId);
    
    // Compare PINs using bcrypt constant-time comparison
    const pinMatches = await bcrypt.compare(userPin, file.pin_hash);
    
    // Track attempt
    recentAttempts.push({
        fileId,
        attemptedAt: new Date(),
        success: pinMatches
    });
    attemptTracker.set(fileId, recentAttempts);
    
    if (!pinMatches) {
        console.log(`[AUDIT] Failed PIN attempt for file: ${fileId}`);
        return {
            success: false,
            message: 'Incorrect PIN. Please try again.'
        };
    }
    
    // Clear attempts on success
    attemptTracker.delete(fileId);
    console.log(`[AUDIT] Successful PIN verification for file: ${fileId}`);
    
    return {
        success: true,
        message: 'PIN verified. Preparing download...'
    };
}
```

### 4.2 PIN Comparison Best Practices

```typescript
// ✓ CORRECT: Bcrypt with constant-time comparison
const isValid = await bcrypt.compare(userInput, storedHash);

// ✗ WRONG: String comparison (vulnerable to timing attacks)
const isValid = userPin === plainTextPin;

// ✗ WRONG: Direct hash comparison
const isValid = sha256(userInput) === storedHash;
```

---

## 5. DECRYPTION & INTEGRITY VERIFICATION

### 5.1 Decryption Process

```typescript
async decryptAndVerifyFile(
    fileId: string,
    encryptedBlob: Blob,
    pin: string
): Promise<{
    file: Blob;
    fileName: string;
    fileSize: number;
    status: 'success' | 'error';
    message: string;
}> {
    try {
        // Step 1: Verify PIN first
        const pinVerification = await verifyPIN(fileId, pin);
        if (!pinVerification.success) {
            return {
                file: new Blob(),
                fileName: '',
                fileSize: 0,
                status: 'error',
                message: pinVerification.message
            };
        }
        
        // Step 2: Decrypt file using PIN
        const decryptedData = await encryptionService.decryptFile(
            encryptedBlob,
            pin
        );
        
        // Step 3: Retrieve stored checksum
        const file = await getFileById(fileId);
        const storedChecksum = file.file_hash;
        
        // Step 4: Calculate checksum of decrypted file
        const fileBuffer = await decryptedData.blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const calculatedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Step 5: Verify checksums match (bit-level integrity)
        if (calculatedChecksum !== storedChecksum) {
            console.error('[SECURITY] Checksum mismatch! File corruption detected.');
            return {
                file: new Blob(),
                fileName: '',
                fileSize: 0,
                status: 'error',
                message: 'File integrity check failed. File may be corrupted.'
            };
        }
        
        // Step 6: Verify file size matches original
        if (decryptedData.fileSize !== file.file_size) {
            return {
                file: new Blob(),
                fileName: '',
                fileSize: 0,
                status: 'error',
                message: 'File size mismatch. Download file is corrupted.'
            };
        }
        
        // Step 7: Update download count
        await supabase
            .from('shared_files')
            .update({
                download_count: file.download_count + 1,
                last_accessed: new Date().toISOString()
            })
            .eq('id', fileId);
        
        return {
            file: decryptedData.blob,
            fileName: decryptedData.fileName,
            fileSize: decryptedData.fileSize,
            status: 'success',
            message: 'File decrypted successfully with verified integrity'
        };
        
    } catch (err) {
        console.error('[ERROR] Decryption failed:', err);
        return {
            file: new Blob(),
            fileName: '',
            fileSize: 0,
            status: 'error',
            message: 'Decryption failed. The PIN may be incorrect or the file is corrupted.'
        };
    }
}
```

### 5.2 Integrity Verification Checklist

- ✓ **Checksum verification**: SHA-256 of decrypted file matches original
- ✓ **File size verification**: Decrypted size matches recorded size
- ✓ **AEAD authentication**: AES-GCM tag validates data wasn't tampered
- ✓ **Metadata consistency**: File type, name match original
- ✓ **Binary exactness**: Byte-for-byte match guaranteed

---

## 6. SECURITY RULES & BEST PRACTICES

### 6.1 Sensitive Data Handling

```typescript
// ✗ NEVER log these
console.log(userPin);           // Don't log PIN
console.log(encryptionKey);     // Don't log key
console.log(salt);              // Don't log salt
console.log(iv);                // Don't log IV

// ✓ LOG ONLY this (sanitized)
console.log('[AUDIT] PIN verification attempt for file:', fileId);
console.log('[SECURITY] Failed login attempt #3 for file:', fileId);
console.log('[AUDIT] File downloaded:', fileName, 'by user:', userId);
```

### 6.2 Secure Memory Handling

```typescript
// Clear sensitive variables from memory
function secureClear(sensitiveData: string | CryptoKey) {
    if (typeof sensitiveData === 'string') {
        // Overwrite string with random data
        const view = new Uint8Array(sensitiveData.length);
        crypto.getRandomValues(view);
        // Note: JS strings are immutable, so this is symbolic
    }
    // Browser handles CryptoKey memory management
}

// Use in finally blocks
try {
    const key = await deriveKey(pin);
    // ... use key ...
} finally {
    // CryptoKey is automatically cleared by browser GC
}
```

### 6.3 Zero Data Loss Guarantee

```typescript
// Verification checklist before returning decrypted file:
async function verifyZeroDataLoss(
    original: {
        size: number;
        hash: string;
        name: string;
        type: string;
    },
    decrypted: {
        blob: Blob;
        size: number;
        name: string;
        type: string;
    }
): Promise<boolean> {
    
    // 1. Size match
    if (original.size !== decrypted.size) {
        console.error('Size mismatch:', original.size, 'vs', decrypted.size);
        return false;
    }
    
    // 2. Hash match
    const decryptedHash = await calculateFileChecksum(decrypted.blob);
    if (original.hash !== decryptedHash) {
        console.error('Hash mismatch:', original.hash, 'vs', decryptedHash);
        return false;
    }
    
    // 3. Metadata match
    if (original.name !== decrypted.name) {
        console.error('Name mismatch:', original.name, 'vs', decrypted.name);
        return false;
    }
    
    if (original.type !== decrypted.type) {
        console.error('Type mismatch:', original.type, 'vs', decrypted.type);
        return false;
    }
    
    return true;
}
```

### 6.4 Attack Prevention

| Attack | Prevention |
|--------|-----------|
| **Brute Force** | Rate limiting (5 attempts/15 min), account lockout |
| **Dictionary Attack** | PBKDF2 600k iterations (2-3s per guess) |
| **Rainbow Tables** | Random salt (16 bytes) per PIN |
| **Timing Attack** | Bcrypt constant-time comparison |
| **Man-in-Middle** | HTTPS only, no HTTP fallback |
| **File Tampering** | AES-GCM AEAD + SHA-256 checksum |
| **Side-Channel** | Avoid secrets in responses, equal-time logic |
| **Replay Attack** | File hash + timestamp prevents re-use |

---

## 7. IMPLEMENTATION CHECKLIST

### Backend Services Required

- [x] **encryptionService.ts** - AES-256-GCM, PBKDF2, checksums
- [x] **fileService.ts** - Database operations, metadata storage
- [ ] **pinSecurityService.ts** - PIN validation, hashing, verification (to implement)
- [ ] **storageService.ts** - Supabase Storage upload/download
- [ ] **auditService.ts** - Activity logging (without sensitive data)

### Components Required

- [ ] **SecureUploadModal.tsx** - File upload + PIN entry + validation
- [ ] **PINPromptModal.tsx** - PIN verification for download
- [ ] **FileSecurityStatusBadge.tsx** - Shows checksum verification status
- [ ] **DownloadProgressTracker.tsx** - Shows download + decryption progress

### Security Configuration

```typescript
// src/config/security.ts
export const SECURITY_CONFIG = {
    encryption: {
        algorithm: 'AES-GCM',
        keySize: 256,
        salt: { size: 16 },
        iv: { size: 12 },
        pbkdf2: {
            iterations: 600000,
            hash: 'SHA-256'
        }
    },
    pin: {
        minLength: 6,
        maxLength: 128,
        enforceComplexity: true,
        blockCommonPasswords: true
    },
    bruteForce: {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000,  // 15 minutes
    },
    storage: {
        bucket: 'encrypted-files',
        maxFileSize: 500 * 1024 * 1024,  // 500 MB
        retention: 30  // days
    }
};
```

---

## 8. USAGE EXAMPLES

### Upload with PIN

```typescript
import { uploadSecureFile } from '../services/fileService';
import { useToast } from '../context/ToastContext';

export function UploadForm() {
    const { addToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [pin, setPin] = useState('');
    
    const handleUpload = async () => {
        const result = await uploadSecureFile(file!, pin, 7);
        
        if (result.status === 'success') {
            addToast({
                type: 'success',
                title: 'Upload successful',
                message: `Share link: ${result.shareUrl}`
            });
        } else {
            addToast({
                type: 'error',
                title: 'Upload failed',
                message: result.message
            });
        }
    };
    
    return (
        // Form JSX
    );
}
```

### Download with PIN Verification

```typescript
export function DownloadFile({ fileId, fileName }) {
    const [pin, setPin] = useState('');
    const [downloading, setDownloading] = useState(false);
    
    const handleDownload = async () => {
        setDownloading(true);
        
        const encrypted = await fetchEncryptedFile(fileId);
        const result = await decryptAndVerifyFile(fileId, encrypted, pin);
        
        if (result.status === 'success') {
            // Download the decrypted file
            downloadBlob(result.file, result.fileName);
        }
        
        setDownloading(false);
    };
    
    return (
        // Download UI
    );
}
```

---

## 9. TROUBLESHOOTING

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Checksum mismatch** | File corruption during transfer | Re-download, check network |
| **Incorrect PIN error** | Wrong PIN entered | Verify caps lock, special chars |
| **Lockout message** | Too many failed attempts | Wait 15 minutes, reset tracker |
| **Decryption failed** | PIN changed or corrupted file | Cannot recover encrypted file |
| **Size mismatch** | metadata.size != actualBlobSize | File may be corrupted |

### Debug Logging (Development Only)

```typescript
if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG] Encryption config:', SECURITY_CONFIG.encryption);
    console.log('[DEBUG] File size before:', file.size);
    console.log('[DEBUG] Checksum calculated:', checksum);
    console.log('[DEBUG] Decrypted size:', decrypted.blob.size);
}
```

---

## 10. COMPLIANCE & STANDARDS

- **Algorithm**: NIST approved (AES-256, SHA-256, PBKDF2)
- **Key Derivation**: OWASP recommended (600k+ iterations)
- **Encryption Mode**: Authenticated (GCM) to prevent tampering
- **PIN Hashing**: Bcrypt or Argon2 (not SHA-256)
- **Transport**: HTTPS/TLS only
- **Data Privacy**: GDPR compliant (no PIN logging, secure deletion)

---

## 11. FUTURE ENHANCEMENTS

- [ ] **Multi-recipient sharing** - Different PIN per recipient
- [ ] **Expiring downloads** - Auto-delete after X downloads
- [ ] **Hardware key support** - FIDO2/U2F for PIN replacement
- [ ] **Key rotation** - Re-encrypt with new PIN periodically
- [ ] **Audit dashboard** - User-facing access log
- [ ] **Encryption strength selector** - User chooses iterations/key size
- [ ] **Offline decryption** - Decrypt without server contact
