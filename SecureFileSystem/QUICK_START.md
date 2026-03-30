# 🚀 Quick Start Guide - Secure File Storage

Get your secure file storage system running in **less than 5 minutes**.

---

## Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **NPM 7+** (comes with Node.js)
- **Any browser** (Chrome, Firefox, Safari, Edge)

---

## Installation (Windows, macOS, Linux)

### Option 1: Automated Setup (Recommended)

**On Windows:**
```bash
setup.bat
```

**On macOS/Linux:**
```bash
bash setup.sh
```

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create required directories:**
   ```bash
   mkdir uploads
   mkdir metadata
   mkdir public
   ```

3. **Verify structure:**
   You should have:
   - ✓ `server.js`
   - ✓ `utils/encryption.js`
   - ✓ `public/index.html`
   - ✓ `public/style.css`
   - ✓ `public/script.js`
   - ✓ `uploads/` (empty)
   - ✓ `metadata/` (empty)
   - ✓ `package.json`

---

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Both start the server on **http://localhost:3000**

---

## First Use - 30 Second Walkthrough

1. **Open browser:** Go to `http://localhost:3000`

2. **Create a password:**
   - Enter password in the "Upload Password" field
   - Watch the strength meter (green = strong)
   - Example: `MySecure123!Pass`

3. **Upload a file:**
   - Click the upload area or drag & drop a file
   - Select a file from your computer
   - Click "Upload & Encrypt"
   - Wait for the progress bar (1-2 seconds)

4. **See your file:**
   - In the "Your Files" section, you'll see your encrypted file
   - Shows: filename, size, upload date

5. **Download & decrypt:**
   - Click the "Decrypt" button on your file
   - Enter the same password you used to upload
   - The original file downloads automatically

6. **Delete (optional):**
   - Click the "Delete" button
   - Confirm in the dialog
   - File is permanently removed

---

## Common Tasks

### Upload Multiple Files
1. Repeat the upload process for each file
2. **Use the same password** for all files with the same password
3. All encrypted files are password-protected

### Change Password
- **To encrypt with a different password:**
  - Delete files encrypted with old password
  - Upload new files with new password
  - Passwords are NOT stored - only the encrypted files exist

### Download All Files
1. Go through each file
2. Click "Decrypt"
3. Enter password
4. Click "Download"
5. Repeat for each file

---

## Troubleshooting

### Server won't start
```bash
# Check Node.js version
node --version  # Should be 16.0.0 or higher

# Check if port 3000 is available
# If not, edit server.js line 4:
# const PORT = 3001;  // Change to different port

# Try reinstalling dependencies
rm -rf node_modules
npm install
npm start
```

### Can't decrypt file
- **Wrong password?** Passwords are case-sensitive
- **Corrupted file?** Try uploading again
- **Browser issue?** Try a different browser or clear cache (Ctrl+Shift+Del)

### File upload fails
- **File too large?** Files are limited to 100MB (edit `server.js` line 18)
- **Disk space?** Check your `uploads/` folder has space
- **Permissions?** Make sure `uploads/` folder is writable

### Windows can't find command
- Make sure Node.js is in your PATH
- Restart your terminal after installing Node.js
- Use `setup.bat` instead of manual commands

---

## Understanding the System

### What Gets Encrypted?
- ✅ Your file contents
- ✅ File is unreadable without password
- ✅ Encryption happens on your browser (not sent to server)

### What Happens on Upload?
1. Browser encrypts your file with AES-256
2. Encrypted file uploaded to server
3. File saved as random UUID (filename hidden)
4. Metadata stored separately (size, date, original name)
5. Original unencrypted file never sent

### What Happens on Download?
1. Browser downloads encrypted file
2. Browser downloads encryption metadata
3. Browser decrypts using your password (not server)
4. Original file recreated exactly
5. Downloaded to your `Downloads` folder

### Security Guarantees
- 🔒 **AES-256-GCM**: Military-grade encryption
- 🔑 **PBKDF2**: Password strengthening (600,000 iterations)
- ✓ **SHA-256**: File integrity verification
- 🛡️ **Rate limiting**: Protects against brute-force attacks
- 🚫 **No password storage**: Passwords never stored on server

---

## File Size Limits

| Setting | Default | Change Location |
|---------|---------|-----------------|
| **Max file size** | 100 MB | `server.js` line 18 |
| **Max files** | Unlimited | Add code to `server.js` |
| **Max password length** | 128 chars | `utils/encryption.js` line 15 |

---

## Default Passwords (Testing)

Test these to verify system works:
- **Simple:** `password123`
- **Strong:** `MySecure123!Pass@2024`
- **Complex:** `k@9mP#xQ2vY&8nRtL!5sW`

---

## Next Steps

### To Learn More
- 📖 **README.md** - Complete features & API documentation
- 🏗️ **ARCHITECTURE.md** - Technical deep dive & deployment guide

### To Deploy
- 🚀 See ARCHITECTURE.md → "Production Deployment" section
- ☁️ Examples for AWS EC2, Nginx, HTTPS, PM2

### To Customize
- 🎨 Edit `public/style.css` for colors/fonts
- 🖥️ Edit `public/index.html` for UI layout
- ⚙️ Edit `server.js` for routes/features
- 🔐 Edit `utils/encryption.js` for security settings

---

## Need Help?

### Check the Logs
When running `npm run dev`, you'll see detailed logs:
```
✓ Server running on http://localhost:3000
  File uploaded: uploads/abc-def-123.enc
  Decryption successful, return 45KB
```

### Browser Console
Press `F12` for Developer Tools → Console tab:
- Shows JavaScript errors
- Shows API responses
- Helps debug issues

### Test with curl (Advanced)
```bash
# Upload a test file
curl -X POST -F "file=@myfile.txt" \
  -F "password=test123" \
  http://localhost:3000/upload

# List files
curl http://localhost:3000/files

# View server logs
npm run dev  # See real-time logs
```

---

## Performance Expectations

| Operation | Time | Note |
|-----------|------|------|
| **File upload (10 MB)** | 1-2 sec | Encryption in browser |
| **File decryption (10 MB)** | 2-3 sec | Password verification |
| **Password validation** | 0.5 sec | Security feature (400k iterations) |
| **List files** | <0.1 sec | Very fast |

---

## Common Configuration

### Change Port (if 3000 is busy)
Edit `server.js` line 4:
```javascript
const PORT = process.env.PORT || 3001;  // Change 3001 to your port
```

### Increase File Size Limit
Edit `server.js` line 18:
```javascript
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }  // 500 MB instead of 100 MB
});
```

### Require Strong Passwords
Edit `utils/encryption.js` line 14:
```javascript
if (password.length < 12) {  // Require 12 chars minimum
  errors.push('Password must be at least 12 characters');
}
```

---

## System Requirements Summary

| Component | Requirement |
|-----------|------------|
| **Node.js** | 16.0.0 or higher |
| **Disk space** | 100 MB minimum |
| **RAM** | 256 MB minimum |
| **Browser** | Any modern browser |
| **Internet** | Not required for encryption |
| **Database** | None (uses filesystem) |

---

## What's Next?

✅ **System is running?**
- Store important files securely
- Share encrypted files with others (give them the password separately)
- Test the system with various file types

📈 **Ready to scale?**
- See ARCHITECTURE.md for deploying to AWS
- Setup Nginx reverse proxy
- Configure HTTPS with Let's Encrypt
- Add authentication layer

🔧 **Want to customize?**
- Modify colors in `public/style.css`
- Add new routes in `server.js`
- Adjust security parameters in `utils/encryption.js`
- Integrate with your application

---

## Support & Documentation

| Resource | Link |
|----------|------|
| **Full Guide** | `README.md` |
| **Architecture** | `ARCHITECTURE.md` |
| **API Docs** | `README.md` → API section |
| **Deployment** | `ARCHITECTURE.md` → Production section |

---

**🎉 You're all set! Your secure file storage is ready to use.**

Start with `npm start` or `npm run dev` and open `http://localhost:3000`
