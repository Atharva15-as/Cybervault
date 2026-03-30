/**
 * Secure File Storage System - Frontend JavaScript
 * Handles file upload, encryption, listing, and decryption
 */

// ==================== DOM ELEMENTS ====================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearFileBtn = document.getElementById('clearFileBtn');

const encryptPassword = document.getElementById('encryptPassword');
const togglePassword = document.getElementById('togglePassword');
const passwordStrength = document.getElementById('passwordStrength');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

const uploadBtn = document.getElementById('uploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const uploadMessage = document.getElementById('uploadMessage');

const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');

const decryptModal = document.getElementById('decryptModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const decryptPassword = document.getElementById('decryptPassword');
const toggleDecryptPassword = document.getElementById('toggleDecryptPassword');
const decryptBtn = document.getElementById('decryptBtn');
const decryptMessage = document.getElementById('decryptMessage');
const decryptProgress = document.getElementById('decryptProgress');
const decryptProgressBar = document.getElementById('decryptProgressBar');

// ==================== STATE ====================
let selectedFile = null;
let currentDecryptFileId = null;

// ==================== UPLOAD AREA HANDLERS ====================

/**
 * Setup upload area
 */
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

/**
 * Handle file selection
 */
function handleFileSelect(file) {
    selectedFile = file;
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    fileInfo.style.display = 'flex';
    uploadArea.style.display = 'none';
    
    checkUploadFormValidity();
}

/**
 * Clear selected file
 */
clearFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadArea.style.display = 'block';
    checkUploadFormValidity();
});

// ==================== PASSWORD HANDLERS ====================

/**
 * Toggle password visibility
 */
togglePassword.addEventListener('click', () => {
    const type = encryptPassword.type === 'password' ? 'text' : 'password';
    encryptPassword.type = type;
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});

toggleDecryptPassword.addEventListener('click', () => {
    const type = decryptPassword.type === 'password' ? 'text' : 'password';
    decryptPassword.type = type;
    toggleDecryptPassword.textContent = type === 'password' ? '👁️' : '🙈';
});

/**
 * Password strength estimation
 */
encryptPassword.addEventListener('input', (e) => {
    const password = e.target.value;
    
    if (password.length > 0) {
        const strength = estimatePasswordStrength(password);
        updateStrengthMeter(strength);
        passwordStrength.style.display = 'block';
    } else {
        passwordStrength.style.display = 'none';
    }
    
    checkUploadFormValidity();
});

/**
 * Estimate password strength
 */
function estimatePasswordStrength(password) {
    let score = 0;
    
    // Length checks
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character diversity
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    // Penalize simple patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // aaa, 111
    
    // Bonus for variety
    const uniqueChars = new Set(password).size;
    score += Math.min(5, Math.floor(uniqueChars / 3));
    
    score = Math.min(100, Math.max(0, score));
    
    return score;
}

/**
 * Update strength meter
 */
function updateStrengthMeter(score) {
    strengthBar.style.width = score + '%';
    strengthBar.className = 'strength-bar';
    
    let label = 'Very Weak';
    if (score >= 80) {
        strengthBar.classList.add('strong');
        label = '💪 Very Strong';
    } else if (score >= 60) {
        strengthBar.classList.add('good');
        label = '✓ Strong';
    } else if (score >= 40) {
        strengthBar.classList.add('fair');
        label = '△ Fair';
    } else if (score >= 20) {
        strengthBar.classList.add('weak');
        label = '⚠ Weak';
    }
    
    strengthText.textContent = label;
}

/**
 * Check if upload form is valid
 */
function checkUploadFormValidity() {
    const hasFile = selectedFile !== null;
    const hasPassword = encryptPassword.value.length >= 6;
    uploadBtn.disabled = !(hasFile && hasPassword);
}

// ==================== UPLOAD HANDLER ====================

/**
 * Handle file upload
 */
uploadBtn.addEventListener('click', uploadFile);

async function uploadFile() {
    if (!selectedFile || !encryptPassword.value) {
        showMessage('uploadMessage', 'Please select a file and enter a password', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('password', encryptPassword.value);

    updateUploadUI(true);

    try {
        console.log('[UPLOAD] Starting file upload...');
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        console.log('[UPLOAD] Success:', data);

        showMessage(
            'uploadMessage',
            `✓ File encrypted and uploaded! File ID: ${data.fileId}`,
            'success'
        );

        // Reset form
        setTimeout(() => {
            selectedFile = null;
            fileInput.value = '';
            encryptPassword.value = '';
            fileInfo.style.display = 'none';
            uploadArea.style.display = 'block';
            passwordStrength.style.display = 'none';
            checkUploadFormValidity();
            uploadProgress.style.display = 'none';
            
            // Refresh file list
            loadFilesList();
        }, 2000);

    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        showMessage('uploadMessage', `✗ ${error.message}`, 'error');
    } finally {
        updateUploadUI(false);
    }
}

/**
 * Update upload UI during upload
 */
function updateUploadUI(isUploading) {
    uploadBtn.disabled = isUploading;
    uploadProgress.style.display = isUploading ? 'block' : 'none';
    uploadMessage.style.display = 'none';
}

// ==================== FILES LIST ====================

/**
 * Load and display files list
 */
async function loadFilesList() {
    try {
        console.log('[LIST] Loading files...');
        filesList.innerHTML = '<p class="empty-state">Loading...</p>';

        const response = await fetch('/files');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load files');
        }

        console.log('[LIST] Loaded', data.count, 'files');

        if (data.files.length === 0) {
            filesList.innerHTML = '<p class="empty-state">No files uploaded yet</p>';
            return;
        }

        filesList.innerHTML = '';
        data.files.forEach(file => {
            const fileItem = createFileItem(file);
            filesList.appendChild(fileItem);
        });

    } catch (error) {
        console.error('[LIST ERROR]', error);
        filesList.innerHTML = `<p class="empty-state">Error loading files: ${error.message}</p>`;
    }
}

/**
 * Create file item element
 */
function createFileItem(file) {
    const item = document.createElement('div');
    item.className = 'file-item';

    const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
    const uploadTime = new Date(file.uploadedAt).toLocaleTimeString();

    item.innerHTML = `
        <div class="file-item-info">
            <div class="file-item-name">📄 ${escapeHtml(file.originalFilename)}</div>
            <div class="file-item-meta">
                <span>Size: ${formatFileSize(file.originalSize)}</span>
                <span>Uploaded: ${uploadDate} ${uploadTime}</span>
            </div>
        </div>
        <div class="file-item-actions">
            <button class="btn btn-primary decrypt-btn" data-file-id="${file.fileId}">
                🔓 Decrypt
            </button>
            <button class="btn btn-danger delete-btn" data-file-id="${file.fileId}">
                🗑 Delete
            </button>
        </div>
    `;

    // Add event listeners
    item.querySelector('.decrypt-btn').addEventListener('click', () => {
        openDecryptModal(file);
    });

    item.querySelector('.delete-btn').addEventListener('click', () => {
        deleteFile(file.fileId);
    });

    return item;
}

/**
 * Delete file
 */
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) {
        return;
    }

    try {
        console.log('[DELETE] Deleting file:', fileId);

        const response = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Delete failed');
        }

        console.log('[DELETE] Success');
        loadFilesList();

    } catch (error) {
        console.error('[DELETE ERROR]', error);
        alert(`Error deleting file: ${error.message}`);
    }
}

// ==================== DECRYPT MODAL ====================

/**
 * Open decrypt modal
 */
function openDecryptModal(file) {
    currentDecryptFileId = file.fileId;
    document.getElementById('modalFilename').textContent = file.originalFilename;
    document.getElementById('modalFileSize').textContent = formatFileSize(file.originalSize);
    document.getElementById('modalUploadDate').textContent = 
        new Date(file.uploadedAt).toLocaleString();
    
    decryptPassword.value = '';
    decryptMessage.style.display = 'none';
    decryptProgress.style.display = 'none';
    decryptBtn.disabled = false;
    
    decryptModal.style.display = 'flex';
}

/**
 * Close decrypt modal
 */
function closeDecryptModal() {
    decryptModal.style.display = 'none';
    currentDecryptFileId = null;
}

closeModal.addEventListener('click', closeDecryptModal);
cancelBtn.addEventListener('click', closeDecryptModal);

/**
 * Close modal on Escape key
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && decryptModal.style.display === 'flex') {
        closeDecryptModal();
    }
});

/**
 * Close modal on outside click
 */
decryptModal.addEventListener('click', (e) => {
    if (e.target === decryptModal) {
        closeDecryptModal();
    }
});

/**
 * Handle decryption
 */
decryptBtn.addEventListener('click', decryptFile);

async function decryptFile() {
    if (!currentDecryptFileId || !decryptPassword.value) {
        showMessage('decryptMessage', 'Please enter the password', 'error');
        return;
    }

    decryptBtn.disabled = true;
    decryptProgress.style.display = 'block';
    decryptMessage.style.display = 'none';

    try {
        console.log('[DECRYPT] Starting decryption...');

        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileId: currentDecryptFileId,
                password: decryptPassword.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Decryption failed');
        }

        console.log('[DECRYPT] Success');

        // Download file
        downloadFile(data.fileData, data.filename);

        showMessage('decryptMessage', '✓ File decrypted successfully!', 'success');

        setTimeout(() => {
            closeDecryptModal();
        }, 2000);

    } catch (error) {
        console.error('[DECRYPT ERROR]', error);
        showMessage('decryptMessage', `✗ ${error.message}`, 'error');
    } finally {
        decryptProgress.style.display = 'none';
        decryptBtn.disabled = false;
    }
}

/**
 * Download file from base64
 */
function downloadFile(base64Data, filename) {
    const byteString = atob(base64Data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[DOWNLOAD] File downloaded:', filename);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show message
 */
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== EVENT LISTENERS ====================

refreshBtn.addEventListener('click', loadFilesList);

// ==================== INITIALIZATION ====================

/**
 * Initialize app
 */
function initApp() {
    console.log('[INIT] Initializing Secure File Storage System');
    loadFilesList();
}

// Load files when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Cleanup
window.addEventListener('beforeunload', () => {
    // Clear sensitive data from memory
    encryptPassword.value = '';
    decryptPassword.value = '';
});
