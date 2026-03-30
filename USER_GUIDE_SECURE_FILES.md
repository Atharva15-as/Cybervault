# Secure File Access Guide - For End Users

## ⚠️ "Cannot Open This File" Error - What It Means

### Why You See This Error

When you try to open an encrypted file directly from your system, you'll see an error message like:

> **"Cannot open this file"**
> 
> "It is not a supported file type or the file has been damaged."

This is **completely normal and expected**. Here's why:

#### What's Happening:
1. ✅ Your file is **properly encrypted** using AES-256 (military-grade encryption)
2. ✅ The file is stored as binary encrypted data (`.enc` format)
3. ✅ Your operating system cannot read encrypted binary files
4. ✅ This is a **security feature**, not an error

#### Why This Is Good:
- **Only authorized users** (those with the correct PIN) can decrypt and view the file
- **Even if the file is stolen**, it cannot be opened without the PIN
- **No one can accidentally view** your encrypted files

---

## ✅ Correct Way to Access Your Encrypted Files

### Step-by-Step Process

#### **Option 1: Download via CyberVault Web App** (Recommended)

1. **Log in** to your CyberVault account at [cybervault.app](https://cybervault.app)

2. **Navigate** to "My Files" or "Dashboard"

3. **Find** the encrypted file you want to access

4. **Click "Download"** button next to the file

5. **Enter your PIN** when prompted
   - This is the PIN you set when uploading the file
   - Confirm it's correct before proceeding

6. **Wait** for decryption to complete
   - Decryption takes 2-3 seconds (this is normal)
   - You'll see a progress indicator

7. **File downloads** automatically in its original format
   - ✅ Now you can open it normally with your system
   - The decrypted file is saved to your Downloads folder
   - The original encrypted file remains safe on our servers

#### **Option 2: Share Link with Others**

1. **In your CyberVault**, click "Share" on the encrypted file

2. **Generate** a shareable link

3. **Send** the link to the person you want to share with
   - They receive a link like: `cybervault.app/share/ABC123XYZ`

4. **They click** the link and enter the PIN you provided

5. **Their decrypted file** downloads automatically

---

## 📋 File Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL COMPUTER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Original File: sample-file.zip                                │
│  Size: 2.5 MB                                               │
│  Can open: ✅ Yes (normally)                                │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ UPLOAD TO CYBERVAULT
                     │ + Enter PIN (e.g., "MySecret123")
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  CYBERVAULT SERVERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Encrypted File: sample-file.zip.enc                           │
│  Size: ~2.5 MB (slight overhead from encryption)            │
│  Can open: ❌ No - This is encrypted binary data            │
│  Format: AES-256-GCM encrypted blob                         │
│                                                              │
│  If opened directly: "Cannot open this file" error ⚠️       │
│  This is GOOD - means encryption is working!               │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ DOWNLOAD + DECRYPT
                     │ Enter correct PIN
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            YOUR LOCAL DOWNLOADS FOLDER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Decrypted File: sample-file.zip                               │
│  Size: 2.5 MB (original size, bit-for-bit identical)        │
│  Can open: ✅ Yes (exactly like the original)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Understanding PIN Protection

### What Is a PIN?
A **PIN** (Personal Identification Number) is a password you create to encrypt your file. Only someone who knows the correct PIN can decrypt and access your file.

### Setting a PIN During Upload

1. **Choose a strong PIN** (at least 6 characters)
   - Example: `SecurePass2024!`
   - ✓ Mix of uppercase, lowercase, numbers, and symbols = stronger
   - ✗ Avoid simple patterns like `123456` or `password`

2. **Remember your PIN** - you'll need it to decrypt
   - ⚠️ **If you forget the PIN, the file cannot be recovered**
   - Write it down in a secure location
   - Use a password manager to store it

3. **Share the PIN safely** with recipients
   - Send the share link via email/message
   - Send the PIN separately through different channel
   - ✓ Don't send link and PIN together

### PIN Strength Indicator

When uploading, you'll see a strength meter:

- 🔴 **Very Weak** (0-20): Too short or too simple
- 🟠 **Weak** (20-40): Add more complexity
- 🟡 **Fair** (40-60): Getting better
- 🟢 **Strong** (60-80): Good protection
- 🟢 **Very Strong** (80-100): Excellent security

**Recommendation**: Aim for "Strong" or above

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Wrong PIN" Error

**Problem**: System says "Incorrect PIN. Please try again."

**Solutions**:
- ✓ Check CAPS LOCK is off
- ✓ Verify PIN is exactly as you set it
- ✓ Check for accidental spaces before/after
- ✓ Try again (5 attempts allowed, then 15-minute lockout)

**After 5 failed attempts**: You'll be locked out for 15 minutes for security. This prevents attackers from guessing your PIN.

---

### Issue 2: "Checksum Mismatch" Error

**Problem**: System says "File integrity check failed"

**What happened**:
- The file may have been corrupted during transmission
- Or someone tried to tamper with the encrypted file

**Solutions**:
- ✓ Re-download the file from CyberVault
- ✓ Check your internet connection
- ✗ Cannot be recovered if corrupted - upload again

---

### Issue 3: File Link Expired

**Problem**: Share link shows "This link has expired"

**Why**: Links expire after a set time (default: 7 days from upload)

**Solutions**:
- ✓ Ask the file owner to generate a new share link
- ✓ Request they extend the expiry (30 days available)
- ✓ Have them upload the file again

---

### Issue 4: Encrypted File Opened Accidentally

**Problem**: You double-clicked the `.enc` file and got the error

**What happened**:
- ✓ Nothing bad! The file is still secure
- ✓ The error proves encryption is working
- ✓ No one without the PIN can access it

**What to do**:
1. Close the error dialog
2. Go to CyberVault and download properly
3. Delete the accidental copy from Downloads

---

## 🛡️ Security Best Practices

### DO ✅

- ✅ **Use strong PINs** (uppercase + lowercase + numbers + symbols)
- ✅ **Store PINs securely** (password manager, encrypted note)
- ✅ **Send PINs separately** from share links
- ✅ **Delete shared links** when no longer needed
- ✅ **Use expiry dates** on share links (shorter is better)
- ✅ **Update PINs** periodically if you suspect compromise
- ✅ **Download over secure WiFi** when possible

### DON'T ❌

- ❌ **Use simple PINs** like birthdate, phone number, sequential numbers
- ❌ **Reuse PINs** across different services
- ❌ **Share PIN with the link** (send separately)
- ❌ **Write PIN in plain text** where others can see
- ❌ **Tell anyone your PIN** unless absolutely necessary
- ❌ **Open `.enc` files** directly - always use CyberVault
- ❌ **Share email with PIN visible** - cover PIN in message

---

## 📱 Accessing Files on Different Devices

### From Phone/Tablet

1. **Open browser** and go to [cybervault.app](https://cybervault.app)
2. **Log in** with your account
3. **Find your file** in the app
4. **Click Download**, enter PIN
5. **File downloads** to your device's download folder

**Note**: Works on iPhone, Android, iPad - any device with a web browser

### From Computer

1. **Visit** [cybervault.app](https://cybervault.app) in your browser
2. **Or** desktop app (if available)
3. **Same process** as above
4. **File opens** with default application for that file type

### Offline Access

- ❌ **Cannot decrypt offline** - requires PIN verification on servers
- ✅ **Can store decrypted copies** locally after downloading
- ✅ **Re-download anytime** from CyberVault

---

## 🔄 File Size Reference

| Original File | Encrypted Size | Overhead |
|---------------|----------------|----------|
| 1 MB | ~1 MB | Minimal |
| 10 MB | ~10 MB | Minimal |
| 100 MB | ~100 MB | <1% |
| 500 MB | ~500 MB | <1% |

**Note**: Encryption overhead is negligible (~28 bytes per file from salt + IV)

---

## ⏱️ Timing Guide

| Operation | Time | Notes |
|-----------|------|-------|
| **Upload** | 1-5 min | Depends on file size & internet speed |
| **Encryption** | <1 sec | Happens client-side (on your device) |
| **Download** | 1-5 min | Depends on file size & internet speed |
| **Decryption** | 2-3 sec | PBKDF2 key derivation (secure but slower) |
| **PIN verify** | 2-3 sec | Includes key derivation, this is normal |

**The 2-3 second decryption delay is intentional**: It makes brute-force attacks (trying many PINs) very expensive, protecting your security.

---

## 🆘 Still Having Issues?

### Contact Support

📧 **Email**: support@cybervault.app
💬 **Chat**: Available in app during business hours
📋 **FAQ**: Visit help.cybervault.app

### When contacting support, include:

- ✓ **Error message** (exact text or screenshot)
- ✓ **File name** and approximate size
- ✓ **What you were trying to do** (upload, download, share)
- ✗ **DON'T** include your PIN
- ✗ **DON'T** include share links with active access needed

---

## 📚 Additional Resources

- **PIN Security**: [Strong Password Guidelines](https://www.nist.gov/publications/sp-800-63-3)
- **File Encryption**: [How AES-256 Works](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- **Data Privacy**: [Our Privacy Policy](https://cybervault.app/privacy)

---

## ✨ Summary

| Aspect | Details |
|--------|---------|
| **Error "Cannot open"** | ✅ Normal, file is encrypted |
| **Correct access method** | Download via CyberVault app |
| **Why encryption takes time** | Security feature, prevents brute-force |
| **Can you recover forgotten PIN?** | ❌ No - keep PIN safe |
| **File format after decryption** | ✅ Original format (PDF, image, etc.) |
| **Is encrypted file safe?** | ✅ Yes, even if someone gets it |
| **Do providers see contents?** | ❌ No, end-to-end encrypted |

---

**Remember**: The "Cannot open" error is a sign your files are secure. Always access encrypted files through CyberVault with the correct PIN.

Your security is our priority. 🔐

