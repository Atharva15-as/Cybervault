# Secure File Storage - Architecture & Deployment Guide

## 🏗️ System Architecture

### High-Level Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                          │
├────────────────────────────────────────────────────────────────┤
│ 1. User selects file & enters password                         │
│ 2. Frontend sends file + password via multipart/form-data      │
│ 3. Receive encrypted file metadata and confirmation            │
│ 4. List all uploaded files                                     │
│ 5. Request decryption via password verification                │
│ 6. Download decrypted original file                            │
└────────────────────────────────────────────────────────────────┘
                              ↑↓ HTTPS
┌────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (PORT 3000)                  │
├────────────────────────────────────────────────────────────────┤
│ Routes:                                                        │
│  POST /upload   → Encrypt file + save + create metadata       │
│  GET  /files    → List all files (sanitized metadata)         │
│  POST /decrypt  → Verify password + decrypt + return          │
│  POST /delete   → Remove encrypted file + metadata            │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                      LOCAL FILESYSTEM                          │
├────────────────────────────────────────────────────────────────┤
│ /uploads/                                                      │
│  ├── {fileId}.enc        (Encrypted binary file)              │
│  ├── {fileId}.enc        (Encrypted binary file)              │
│  └── ...                                                       │
│                                                                │
│ /metadata/                                                     │
│  ├── {fileId}.json      (Salt, IV, Hash, metadata)            │
│  ├── {fileId}.json      (Salt, IV, Hash, metadata)            │
│  └── ...                                                       │
└────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Sequences

### Upload & Encryption Flow

```
User Input:
 ├── File: sample-file.zip (2.5 MB)
 └── Password: "MySecurePass123"
            ↓
Frontend Validation:
 ├── File exists & not empty ✓
 └── Password length ≥ 6 ✓
            ↓
Multipart Upload to /upload:
 ├── FormData {file, password}
 └── Send via POST
            ↓
Backend Processing:
 ├── 1. Validate password (length, format)
 ├── 2. Validate file (exists, size limit)
 ├── 3. Encrypt file:
 │   ├── Generate 16-byte salt
 │   ├── Derive key: PBKDF2(password, salt, 600k iter, SHA256)
 │   ├── Generate 16-byte IV
 │   ├── Encrypt: AES-256-GCM(file, key, IV)
 │   ├── Get auth tag (16 bytes)
 │   └── Calculate SHA-256 hash of ORIGINAL file
 ├── 4. Save encrypted blob: /uploads/{fileId}.enc
 ├── 5. Save metadata: /metadata/{fileId}.json
 │   {
 │     fileId, originalFilename, originalSize, encryptedSize,
 │     salt (hex), iv (hex), authTag (hex), hash (hex),
 │     uploadedAt, uploadedFrom
 │   }
 └── 6. Return response with fileId
            ↓
Frontend Display:
 ├── Show "Upload successful!" message
 ├── Refresh file list
 └── Clear form inputs
            ↓
Result:
 ├── Original file: NEVER stored on server ✓
 ├── Encrypted file: /uploads/{fileId}.enc (2.5 MB encrypted)
 ├── Metadata: /metadata/{fileId}.json (stored, no password!)
 └── Password: Known ONLY by user ✓
```

### Decryption & Download Flow

```
User Input:
 ├── Select encrypted file
 └── Enter password: "MySecurePass123"
            ↓
Frontend Validation:
 └── Password provided ✓
            ↓
POST /decrypt Request:
 {
   fileId: "uuid-123",
   password: "MySecurePass123"
 }
            ↓
Backend Processing:
 ├── 1. Rate limiting check
 │   └── If >5 failed attempts in 15 min: LOCK
 ├── 2. Load metadata: /metadata/{fileId}.json
 │   └── Extract: salt, iv, authTag, hash, originalSize
 ├── 3. Load encrypted file: /uploads/{fileId}.enc
 ├── 4. Verify password & decrypt:
 │   ├── Derive key: PBKDF2(password, salt, 600k iter, SHA256)
 │   ├── Decrypt: AES-256-GCM(encrypted, key, iv)
 │   ├── Verify auth tag (detects tampering)
 │   └── If failure: return "Invalid password"
 ├── 5. Verify integrity:
 │   ├── Calculate: SHA-256(decrypted_file)
 │   ├── Compare with stored hash
 │   └── If mismatch: return "File corrupted"
 ├── 6. Verify size:
 │   ├── Check: decrypted.size === originalSize
 │   └── If mismatch: return error
 ├── 7. Encode to base64 for transmission
 └── 8. Return response:
       {
         fileData: "base64-string",
         filename: "sample-file.zip",
         originalSize: 2500000
       }
            ↓
Frontend Processing:
 ├── Decode base64 → Uint8Array
 ├── Create Blob from bytes
 ├── Generate download link
 └── Trigger download
            ↓
User Download:
 └── File saved as: sample-file.zip (EXACT copy of original)
            ↓
Result:
 ├── Original file recovered bit-for-bit ✓
 ├── Integrity verified via SHA-256 ✓
 ├── Password never sent to server again ✗
 └── Encrypted file unchanged on server ✓
```

## 🔐 Encryption Details

### AES-256-GCM Algorithm

**Why AES-256-GCM?**
- NIST approved standard (FIPS 197)
- Authenticated encryption (AEAD)
- Detects tampering automatically
- 256-bit key = extremely resistant to brute-force

**Key Components:**
```
AES-256-GCM(plaintext, key, iv) → (ciphertext, authTag)

- Key: 32 bytes (256 bits) derived from password
- IV: 16 bytes (128 bits) random per encryption
- Auth Tag: 16 bytes - proves data wasn't modified
```

**Security Properties:**
```
+ Confidentiality: Ciphertext reveals nothing about plaintext
+ Authenticity: Auth tag proves only key holder created it
+ Integrity: Any bit modification detected via auth tag
+ Non-malleability: Cannot modify ciphertext without detection
```

### PBKDF2 Key Derivation

**Purpose:** Convert user's memorable password into cryptographic key

**Process:**
```
Password: "MySecurePass123"
Salt: 16 random bytes (different per file)
                 ↓
PBKDF2(password, salt, iterations=600000, hash=SHA-256)
                 ↓
Output: 32-byte key (256 bits)
```

**Why 600,000 Iterations?**
```
Time per attempt: ~2-3 seconds on modern CPU
Cost for brute-force: 
  - 8-char password: ~500k possibilities
  - Time to crack: 500k × 3s = 1,500,000 seconds ≈ 17 days
  - With GPU: Still hours to days (depends on hardware)
  
If attacker uses 1 Bitcoin mining GPU (1 billion guesses/sec):
  - Then: Still hours needed for single password
  - But: We have rate limiting (5 attempts / 15 min max)
  - Total lockout cost per wrong guess: ~3 seconds × entire system
```

**Security Timeline:**
```
Weak password (6 chars): Vulnerable if stolen → Use strong pwd
Strong password (12 chars, mixed): ~1000 years to crack
Very strong (16+ chars, symbols): Cryptographically safe
```

### SHA-256 Integrity Hash

**Purpose:** Detect file corruption or tampering

**Process:**
```
Original file: sample-file.zip
                 ↓
SHA-256(original_bytes)
                 ↓
Hash: "a1b2c3d4..." (64-char hex string)
                 ↓
Stored in metadata for later verification
                 ↓
During decryption:
SHA-256(decrypted_bytes) === stored_hash ✓
→ File is intact and unmodified
```

## 📁 File Organization

### Directory Structure
```
SecureFileSystem/
├── server.js              # Expressserver
├── utils/
│   └── encryption.js      # Crypto functions
├── public/                # Frontend static files
│   ├── index.html        # User interface
│   ├── style.css         # Styling
│   └── script.js         # Client-side logic
├── uploads/              # Encrypted files storage
│   ├── {uuid}.enc
│   ├── {uuid}.enc
│   └── ...
├── metadata/             # File metadata storage
│   ├── {uuid}.json
│   ├── {uuid}.json
│   └── ...
├── package.json          # Node dependencies
├── .gitignore           # Git exclusions
└── README.md            # Documentation
```

### Metadata File Example
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "originalFilename": "important-file.zip",
  "originalSize": 2534567,
  "encryptedSize": 2534627,
  "salt": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  "iv": "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3",
  "authTag": "1234567890abcdef1234567890abcdef",
  "hash": "ed7002b439e9ac845f22357d822bac1444730fbdb75d5d3402ca079b8f007cdc",
  "uploadedAt": "2024-01-20T14:30:00Z",
  "uploadedFrom": "192.168.1.100"
}
```

## 🚀 Deployment Guide

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open browser
open http://localhost:3000
```

### Production Deployment (AWS EC2)

#### Step 1: Prepare Server
```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PM2 (process manager)
npm install -g pm2
```

#### Step 2: Setup Application
```bash
# Clone repository
git clone <your-repo> secure-file-storage
cd secure-file-storage

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=524288000
PBKDF2_ITERATIONS=600000
EOF
```

#### Step 3: Setup HTTPS
```bash
# Install Certbot
sudo yum install -y certbot python2-certbot-nginx

# Generate certificate (requires domain)
sudo certbot certonly --standalone -d your-domain.com

# Update server.js to use HTTPS
# See HTTPS configuration below
```

#### Step 4: Start Application
```bash
# Start with PM2
pm2 start server.js --name "secure-files"
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs
```

#### Step 5: Setup Reverse Proxy (Nginx)
```bash
sudo yum install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Production Checklist

#### Security
- [x] Enable HTTPS/TLS (required!)
- [ ] Add rate limiting (Redis backend)
- [ ] Implement user authentication
- [ ] Add CORS restrictions
- [ ] Use environment variables for secrets
- [ ] Implement audit logging
- [ ] Regular backups
- [ ] Monitor disk space for uploads

#### Performance
- [ ] Add caching headers
- [ ] Implement CDN for static files
- [ ] Database for metadata (instead of JSON files)
- [ ] Redis for session/rate-limit management
- [ ] Load balancing for high traffic
- [ ] Database replication & backups

#### Operations
- [ ] Monitoring (logs, errors, uptime)
- [ ] Health check endpoint
- [ ] Automated backups
- [ ] Graceful shutdown handling
- [ ] File deletion policies (auto-delete after time)
- [ ] Disk quota management

## 🔒 HTTPS Configuration

### Add to server.js for HTTPS:

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');

// Only in production
if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/domain.com/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/domain.com/fullchain.pem'),
        passphrase: process.env.KEY_PASSPHRASE // Optional
    };

    https.createServer(options, app).listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
} else {
    app.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
    });
}
```

## 📈 Scaling Considerations

### Current Architecture (Single Server)
- Suitable for: < 1000 files
- Limitations: Single point of failure

### Scalable Architecture (Production)
```
    ┌─ Nginx (Load Balancer)
    │
    ├─ Node.js Server #1
    ├─ Node.js Server #2
    ├─ Node.js Server #3
    │
    ├─ PostgreSQL Database (Metadata)
    ├─ Redis (Rate Limiting & Sessions)
    ├─ MongoDB (Audit Logs)
    │
    └─ S3/Cloud Storage (Encrypted Files)
```

### Migration from File Storage to S3
```javascript
// Replace file operations
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Save encrypted file to S3
app.post('/upload', async (req, res) => {
    // ... encryption logic ...
    
    const params = {
        Bucket: 'secure-files-bucket',
        Key: `${fileId}.enc`,
        Body: encryptedData,
        ServerSideEncryption: 'AES256'
    };
    
    await s3.putObject(params).promise();
    
    // Save metadata to database
    await db.files.create(metadata);
});
```

## 📊 Monitoring & Observability

### Essential Metrics
- File upload count & size
- Decryption success/failure rate
- Password verification attempts (detect brute-force)
- Server response times
- Disk space usage
- Error rates

### Logging Example
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Usage
logger.info('[UPLOAD] File encrypted', {fileId, size, timestamp});
logger.error('[DECRYPT] Failed', {fileId, reason, ip});
```

## 🔍 Security Audit

### Regular Checks
- [ ] Review password strength recommendations
- [ ] Check rate limiting is working
- [ ] Verify no passwords in logs
- [ ] Confirm HTTPS everywhere
- [ ] Test file integrity verification
- [ ] Audit file access patterns
- [ ] Review failed authentication attempts
- [ ] Verify secure deletion on file removal

### Penetration Testing
- Test brute-force resistance
- Attempt file tampering
- Try MITM attacks (over HTTP)
- Test large file uploads
- Verify handling of corrupted files
- Test concurrent operations

---

**Version**: 1.0.0
**Last Updated**: 2024-01-20
**Security Level**: Production-Ready (with HTTPS)

