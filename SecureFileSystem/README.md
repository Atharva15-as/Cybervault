# 🔐 Secure File Storage System

A complete web-based secure file storage solution with end-to-end encryption using AES-256-GCM and PBKDF2 key derivation.

## ✨ Features

- **🔒 AES-256-GCM Encryption** - Military-grade authenticated encryption
- **🔑 PBKDF2 Key Derivation** - 600,000 iterations for brute-force resistance
- **📁 Drag & Drop Upload** - Easy file selection
- **🛡️ Integrity Verification** - SHA-256 checksums prevent tampering
- **🔓 Easy Decryption** - Simple password-based file recovery
- **📱 Responsive Design** - Works on desktop, tablet, mobile
- **🚀 Stream Processing** - Handles large files efficiently
- **⏱️ Rate Limiting** - Brute-force attack protection
- **📊 File Management** - List, decrypt, delete uploaded files
- **🎨 Modern UI** - Beautiful, intuitive interface

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Browser)          │
│  HTML/CSS/JavaScript (No deps)      │
├─────────────────────────────────────┤
│     Fetch API ↔ REST Endpoints      │
├─────────────────────────────────────┤
│       Backend (Node.js/Express)     │
│  - File Upload & Encryption         │
│  - File List & Metadata             │
│  - File Decryption & Verification   │
│  - Rate Limiting & Security         │
├─────────────────────────────────────┤
│    Local Filesystem Storage         │
│  /uploads → Encrypted Files (.enc)  │
│  /metadata → File Metadata (JSON)   │
└─────────────────────────────────────┘
```

## 🔐 Security Details

### Encryption Algorithm
- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **IV Size**: 16 bytes (random per file)
- **Auth Tag**: 16 bytes (detects tampering)

### Key Derivation
- **Algorithm**: PBKDF2
- **Hash Function**: SHA-256
- **Iterations**: 600,000 (high security)
- **Salt**: 16 bytes (random per file, prevents rainbow tables)
- **Output**: 256-bit key

### Integrity & Verification
- **Hash Algorithm**: SHA-256
- **Purpose**: Detect file corruption or tampering
- **Verification**: Checked during decryption

### Security Features
- ✓ Password never stored (only bcrypt hash of PIN during admin operations)
- ✓ Each file has unique salt and IV
- ✓ Authenticated encryption prevents tampering
- ✓ Rate limiting (5 attempts per 15 minutes)
- ✓ Constant-time password comparison
- ✓ Secure random number generation

## 📋 Project Structure

```
SecureFileSystem/
├── server.js                 # Express server + API routes
├── package.json             # Dependencies
├── utils/
│   └── encryption.js        # Encryption/decryption utilities
├── public/
│   ├── index.html          # Frontend HTML
│   ├── style.css           # Responsive styling
│   └── script.js           # Frontend JavaScript
├── uploads/                # Encrypted files stored here
├── metadata/               # File metadata (JSON)
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.0.0 or higher
- **npm** (comes with Node.js)
- **Git** (optional)

### Installation

1. **Clone or extract the project**
```bash
cd SecureFileSystem
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode (with auto-reload)

```bash
npm run dev
```

Requires `nodemon`: `npm install --save-dev nodemon`

## 📖 Usage Guide

### Upload & Encrypt a File

1. Open browser to `http://localhost:3000`
2. Click or drag-drop a file in the upload area
3. Enter a strong encryption password (min 6 characters)
4. View password strength indicator
5. Click "Encrypt & Upload"
6. File is encrypted server-side and stored securely

### View Uploaded Files

- Files list updates automatically after successful upload
- Shows: Filename, Size, Upload Date/Time
- Each file has "Decrypt" and "Delete" buttons

### Decrypt & Download

1. Click "Decrypt" button next to any file
2. Enter the encryption password
3. Click "Decrypt & Download"
4. Original file downloads in its original format

### Delete Files

1. Click "Delete" button next to any file
2. Confirm deletion
3. File is permanently removed from server

## 🔧 API Endpoints

### POST /upload
Encrypt and store a file

**Request:**
```json
{
  "file": <File>,
  "password": "YourSecurePassword"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "uuid-here",
  "filename": "original-name.pdf",
  "size": 2500000,
  "uploadedAt": "2024-01-20T10:30:00Z"
}
```

### GET /files
List all uploaded files

**Response:**
```json
{
  "success": true,
  "count": 3,
  "files": [
    {
      "fileId": "uuid",
      "originalFilename": "sample-file.zip",
      "originalSize": 2500000,
      "uploadedAt": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### POST /decrypt
Decrypt a file

**Request:**
```json
{
  "fileId": "uuid-here",
  "password": "YourSecurePassword"
}
```

**Response:**
```json
{
  "success": true,
  "filename": "original-name.pdf",
  "fileData": "base64-encoded-file",
  "originalSize": 2500000
}
```

### POST /delete
Delete an encrypted file

**Request:**
```json
{
  "fileId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🔒 Password Best Practices

✅ **DO:**
- Use at least 12 characters
- Mix uppercase, lowercase, numbers, and symbols
- Use unique passwords for different files
- Store passwords in a password manager
- Use passphrases (e.g., "MyDog123@Jumps!")

❌ **DON'T:**
- Use simple passwords like "123456" or "password"
- Reuse passwords across services
- Share passwords in email or chat
- Write passwords on sticky notes
- Use personal information (birthdate, phone)

## 📊 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Upload 10 MB file | ~1-2s | Network dependent |
| Encryption | <1s | Server-side |
| Decryption | 2-3s | PBKDF2 key derivation |
| List files | <100ms | Fast file listing |

## 🛡️ Security Hardening

### For Development
- [x] Local storage for testing
- [x] Console logging (disabled in production)
- [x] No authentication frontend

### For Production
- [ ] Add HTTPS/TLS encryption
- [ ] Move to database (MongoDB, PostgreSQL)
- [ ] Add user authentication system
- [ ] Implement Redis for rate limiting
- [ ] Use environment variables for config
- [ ] Add request logging/monitoring
- [ ] Implement API key authentication
- [ ] Use secure password hashing for admin accounts
- [ ] Add backup/redundancy
- [ ] Regular security audits

### Deployment Example (Node.js)
```bash
# Environment variables
export PORT=3000
export NODE_ENV=production

# Use process manager (PM2)
pm2 start server.js --name "secure-files"
```

## 🧪 Testing

### Test File Upload
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@test.pdf" \
  -F "password=TestPassword123!"
```

### Test File List
```bash
curl http://localhost:3000/files
```

### Test Decryption
```bash
curl -X POST http://localhost:3000/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "your-file-id",
    "password": "TestPassword123!"
  }'
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Port already in use
```bash
# Use different port
PORT=3001 npm start

# Or kill existing process
lsof -ti :3000 | xargs kill -9  # macOS/Linux
```

### Files not persisting
- Check `/uploads` and `/metadata` directories exist
- Ensure write permissions: `chmod 755 uploads metadata`

### Decryption fails with "Invalid password"
- Verify password is exactly correct (case-sensitive)
- Check for accidental spaces before/after password
- File may be corrupted if hash doesn't match

## 📝 Logs

### Enable Debug Logging
Edit `server.js` and uncomment debug lines:
```javascript
console.log('[DEBUG]', ...);
```

### Log Locations
- **Console logs**: Terminal output
- **No file logs**: Implement with `winston` or `bunyan` for production

## 🔄 File Format Details

### Encrypted File (.enc)
```
[16 bytes: Salt]
[16 bytes: IV]
[16 bytes: Auth Tag]
[Variable: Encrypted Data]
```

### Metadata (JSON)
```json
{
  "fileId": "uuid",
  "originalFilename": "name.pdf",
  "originalSize": 2500000,
  "encryptedSize": 2501024,
  "salt": "hex-string",
  "iv": "hex-string",
  "authTag": "hex-string",
  "hash": "sha256-hash",
  "uploadedAt": "ISO-8601",
  "uploadedFrom": "ip-address"
}
```

## 📚 References

### Cryptography Standards
- [NIST AES](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf) - AES-256 algorithm
- [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) - PBKDF2
- [RFC 5116](https://tools.ietf.org/html/rfc5116) - AEAD Interface

### Node.js Documentation
- [crypto module](https://nodejs.org/api/crypto.html)
- [createCipheriv](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options)
- [pbkdf2Sync](https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2sync_password_salt_iterations_keylen_digest)

### Security Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Database integration
- User authentication system
- Web UI enhancements
- Performance optimization
- Additional encryption algorithms

## ⚠️ Disclaimer

This system is provided as-is for educational and demonstration purposes. While it implements industry-standard encryption, always:
- Test thoroughly before production use
- Keep Node.js and dependencies updated
- Regularly backup encrypted files
- Never ignore security warnings
- Use HTTPS in production
- Implement proper access controls

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify Node.js version compatibility
4. Check file permissions in upload/metadata directories

---

**Made with 🔐 for secure file storage**

