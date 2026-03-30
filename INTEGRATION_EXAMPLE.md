# Integration Example - Adding Secure File Exchange to Your App

This guide shows how to integrate the Secure File Exchange system into your existing CyberVault application.

## 1. Update Your Router

Add the new route to your main routing configuration:

```typescript
// src/App.tsx or your router file
import SecureFileExchange from './pages/SecureFileExchange';

const routes = [
    // ... existing routes
    {
        path: '/secure-exchange',
        element: <ProtectedRoute><SecureFileExchange /></ProtectedRoute>,
    },
    // For public share links (no auth required)
    {
        path: '/share/:shareToken',
        element: <SecureFileSharePage />,
    },
];
```

## 2. Create a Share Page Component

Create a public page for recipients to download shared files:

```typescript
// src/pages/SecureFileSharePage.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import SecureFileDownload from '../components/SecureFileDownload';
import { Lock } from 'lucide-react';

export const SecureFileSharePage: React.FC = () => {
    const { shareToken } = useParams<{ shareToken: string }>();

    if (!shareToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Share Link</h1>
                    <p className="text-slate-400">The share token is missing or invalid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <Lock className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white">Secure File Shared</h1>
                    <p className="text-slate-400 mt-2">
                        Someone has shared an encrypted file with you
                    </p>
                </div>

                <SecureFileDownload
                    shareToken={shareToken}
                    onDownloadSuccess={(fileName) => {
                        console.log('File downloaded:', fileName);
                    }}
                    onDownloadError={(error) => {
                        console.error('Download error:', error);
                    }}
                />

                <div className="mt-8 p-4 bg-slate-800/50 rounded border border-slate-700 text-sm text-slate-300">
                    <p className="font-medium mb-2">🔒 Security Information</p>
                    <ul className="space-y-1 text-xs">
                        <li>✓ File is encrypted end-to-end</li>
                        <li>✓ Decryption happens in your browser</li>
                        <li>✓ Passphrase is never sent to server</li>
                        <li>✓ File integrity is verified</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SecureFileSharePage;
```

## 3. Add Navigation Link

Update your navbar to include the Secure File Exchange:

```typescript
// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const Navbar: React.FC = () => {
    return (
        <nav className="bg-slate-900 border-b border-slate-700">
            {/* ... existing navbar content ... */}
            
            <Link
                to="/secure-exchange"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-emerald-400 transition"
            >
                <Lock className="w-4 h-4" />
                Secure Exchange
            </Link>
        </nav>
    );
};
```

## 4. Add to Dashboard

Add a widget to your dashboard showing recent uploads:

```typescript
// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import storageEncryptionService from '../services/storageEncryptionService';
import { Upload, Download } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [recentFiles, setRecentFiles] = useState<any[]>([]);

    useEffect(() => {
        loadRecentFiles();
    }, []);

    const loadRecentFiles = async () => {
        const result = await storageEncryptionService.getUserFiles();
        if (result.success && result.files) {
            setRecentFiles(result.files.slice(0, 5));
        }
    };

    return (
        <div className="space-y-6">
            {/* ... existing dashboard content ... */}

            {/* Recent Encrypted Files */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white">Recent Encrypted Files</h3>
                </div>

                {recentFiles.length === 0 ? (
                    <p className="text-slate-400 text-sm">No encrypted files yet</p>
                ) : (
                    <div className="space-y-2">
                        {recentFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-slate-700/30 rounded"
                            >
                                <div>
                                    <p className="text-white text-sm font-medium truncate">
                                        {file.fileName}
                                    </p>
                                    <p className="text-slate-400 text-xs">
                                        {storageEncryptionService.formatFileSize(file.fileSize)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Download className="w-3 h-3" />
                                    {file.downloadCount}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
```

## 5. Add to Activity Log

Track file uploads and downloads in your activity log:

```typescript
// src/services/activityService.ts
export const activityService = {
    // ... existing methods ...

    async logFileUpload(fileName: string, fileSize: number, shareToken: string) {
        return await supabase
            .from('activity_log')
            .insert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                action: 'FILE_UPLOAD',
                description: `Uploaded encrypted file: ${fileName}`,
                metadata: {
                    fileName,
                    fileSize,
                    shareToken,
                },
                timestamp: new Date().toISOString(),
            });
    },

    async logFileDownload(shareToken: string, fileName: string) {
        return await supabase
            .from('activity_log')
            .insert({
                action: 'FILE_DOWNLOAD',
                description: `Downloaded encrypted file: ${fileName}`,
                metadata: {
                    shareToken,
                    fileName,
                },
                timestamp: new Date().toISOString(),
            });
    },
};
```

## 6. Add to Settings

Allow users to configure encryption preferences:

```typescript
// src/pages/Settings.tsx
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export const EncryptionSettings: React.FC = () => {
    const [defaultExpiry, setDefaultExpiry] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
    const [defaultMaxDownloads, setDefaultMaxDownloads] = useState(0);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    Encryption Preferences
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Default Expiry Duration
                        </label>
                        <select
                            value={defaultExpiry}
                            onChange={(e) => setDefaultExpiry(e.target.value as any)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        >
                            <option value="1h">1 Hour</option>
                            <option value="24h">24 Hours</option>
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Default Max Downloads (0 = Unlimited)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={defaultMaxDownloads}
                            onChange={(e) => setDefaultMaxDownloads(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
```

## 7. Add Notifications

Show toast notifications for upload/download events:

```typescript
// src/context/ToastContext.tsx (if using toast context)
import { useToast } from './ToastContext';

export function useFileExchangeNotifications() {
    const { showToast } = useToast();

    return {
        notifyUploadSuccess: (shareToken: string) => {
            showToast({
                type: 'success',
                title: 'File Uploaded',
                message: 'Your encrypted file has been uploaded successfully',
                action: {
                    label: 'Copy Share Link',
                    onClick: () => {
                        navigator.clipboard.writeText(
                            `${window.location.origin}/share/${shareToken}`
                        );
                        showToast({
                            type: 'info',
                            message: 'Share link copied to clipboard',
                        });
                    },
                },
            });
        },

        notifyDownloadSuccess: (fileName: string) => {
            showToast({
                type: 'success',
                title: 'File Downloaded',
                message: `${fileName} has been decrypted and downloaded`,
            });
        },

        notifyError: (error: Error) => {
            showToast({
                type: 'error',
                title: 'Error',
                message: error.message,
            });
        },
    };
}
```

## 8. Add to Admin Panel

Show file statistics in admin dashboard:

```typescript
// src/pages/admin/FileStatistics.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const FileStatistics: React.FC = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const { data } = await supabase
            .from('shared_files')
            .select('*');

        if (data) {
            const stats = {
                totalFiles: data.length,
                totalSize: data.reduce((sum, f) => sum + parseInt(f.file_size), 0),
                totalDownloads: data.reduce((sum, f) => sum + f.download_count, 0),
                activeFiles: data.filter(f => f.is_active && new Date(f.expiry_date) > new Date()).length,
                expiredFiles: data.filter(f => new Date(f.expiry_date) <= new Date()).length,
            };
            setStats(stats);
        }
    };

    if (!stats) return <div>Loading...</div>;

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-800 rounded">
                <p className="text-slate-400 text-sm">Total Files</p>
                <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded">
                <p className="text-slate-400 text-sm">Total Size</p>
                <p className="text-2xl font-bold text-white">
                    {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>
            <div className="p-4 bg-slate-800 rounded">
                <p className="text-slate-400 text-sm">Total Downloads</p>
                <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded">
                <p className="text-slate-400 text-sm">Active Files</p>
                <p className="text-2xl font-bold text-white">{stats.activeFiles}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded">
                <p className="text-slate-400 text-sm">Expired Files</p>
                <p className="text-2xl font-bold text-white">{stats.expiredFiles}</p>
            </div>
        </div>
    );
};
```

## 9. Environment Configuration

Update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# File Exchange Configuration
VITE_MAX_FILE_SIZE=104857600  # 100MB in bytes
VITE_DEFAULT_EXPIRY=7d
VITE_ENABLE_FILE_EXCHANGE=true
```

## 10. Testing the Integration

### Test Upload Flow
```bash
1. Navigate to /secure-exchange
2. Click "Upload & Encrypt"
3. Select a test file
4. Click "Encrypt & Upload"
5. Verify file appears in "My Files"
6. Copy share URL and passphrase
```

### Test Download Flow
```bash
1. Open share URL in new browser/incognito
2. Enter passphrase
3. Click "Decrypt & Download"
4. Verify file downloads with correct name
5. Verify content matches original
```

### Test Access Control
```bash
1. Login as User A
2. Upload a file
3. Logout
4. Login as User B
5. Verify User B cannot see User A's files
6. Try accessing User A's file with wrong passphrase
7. Verify decryption fails
```

## Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema applied
- [ ] RLS policies enabled
- [ ] Storage bucket created and secured
- [ ] Environment variables set
- [ ] Components imported and integrated
- [ ] Routes added to router
- [ ] Navigation updated
- [ ] HTTPS enabled in production
- [ ] CORS configured if needed
- [ ] Error handling tested
- [ ] Security policies reviewed
- [ ] User documentation created

## Support

For issues or questions:
1. Check `SUPABASE_STORAGE_SETUP.md` for detailed setup
2. Review `SECURE_FILE_EXCHANGE_QUICKSTART.md` for quick reference
3. Check browser console for errors
4. Verify RLS policies are correctly configured
5. Test with sample files first
