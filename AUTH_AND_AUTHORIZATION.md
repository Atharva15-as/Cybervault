# Authentication & Authorization Implementation Guide

## Overview
CyberVault implements a comprehensive authentication and authorization system to protect sensitive user operations and data access.

## Components

### 1. Authentication Service (`authContext.tsx`)
- Handles user login, registration, logout
- Manages sessions with Supabase
- Implements daily session checks for security
- Supports OAuth (Google, GitHub)
- Supports email/password authentication

**Key Features:**
- Real-time auth state management
- Demo mode for testing
- Session persistence
- Daily automatic logout

### 2. Authorization Service (`authorizationService.ts`)
Centralized authorization logic for all sensitive operations.

**Available Authorization Checks:**

#### Core Checks
- `isAuthenticated(user)` - Verify user is logged in
- `canPerformFileOperations(user)` - General file operation permission
- `canShareFile(user)` - Share file authorization
- `canDownloadFile(user)` - Download file authorization
- `canDeleteFile(user, fileOwnerId)` - Delete file with ownership verification
- `canManageCommunity(user, communityCreatorId)` - Community admin check
- `canViewActivityLog(user, logOwnerId)` - Personal activity log access
- `canAccessScanHistory(user, historyOwnerId)` - Personal scan history access
- `canViewAdminReports(user, isAdminUser)` - Admin report access
- `canStoreScanHistory(user)` - Scan history storage permission

### 3. Protected Routes Component (`ProtectedRoute.tsx`)
Wraps routes that require authentication.

**Implementation:**
- Checks user authentication status
- Shows loading spinner during auth check
- Redirects unauthenticated users to login
- Passes through authenticated users

## Protected Routes

The following routes are protected and require authentication:

1. `/dashboard` - User's personal dashboard and vault
2. `/communities` - Community list and access
3. `/community/:communityId` - Community vault access
4. `/activity` - User activity log
5. `/admin/reports` - Admin reports (optional admin check)
6. `/scanner/history` - Personal scan history

## Protected Operations

### File Operations
- **Upload**: Required authentication
  - `Home.tsx` - handleFileSelect()
  - `SecureVault.tsx` - handleDrop(), handleFileSelect()
  
- **Share**: Required authentication
  - `Home.tsx` - handleShare()
  - `SecureVault.tsx` - handleShare()
  - `CommunityVault.tsx` - handleShare()

- **Download**: Required authentication
  - `Home.tsx` - handleDownloadClick()
  - `SecureVault.tsx` - handleDownloadClick()
  - `CommunityVault.tsx` - handleDownloadClick()

- **Delete**: Required authentication + ownership verification
  - `Home.tsx` - handleDeleteFile()
  - `CommunityVault.tsx` - handleDeleteFile() [Admin only]

### Community Operations
- **Leave Community**: Required authentication
  - `CommunityVault.tsx` - handleLeaveCommunity()

- **Manage Community**: Required authentication + admin verification
  - `CommunityVault.tsx` - Delete file (admin only)

## Usage Examples

### Checking Authorization in Component

```typescript
import { canShareFile, canDeleteFile } from '../services/authorizationService';
import { useAuth } from '../context/AuthContext';

export default function MyComponent() {
    const { user } = useAuth();
    
    const handleShare = () => {
        const authCheck = canShareFile(user);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Authorization Required', message: authCheck.message });
            navigate('/login');
            return;
        }
        // Proceed with share operation
    };
    
    const handleDelete = (fileId: string, fileOwnerId: string) => {
        const authCheck = canDeleteFile(user, fileOwnerId);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Error', message: authCheck.message });
            return;
        }
        // Proceed with delete
    };
}
```

### Protecting a Route

```typescript
import ProtectedRoute from '../components/ProtectedRoute';

<Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>
```

## Token-Based Sharing Security

### Share Links
- Uses cryptographically secure random tokens
- Tokens are generated for each shared file
- Share links can have optional expiration
- Optional PIN protection for added security

**Implementation:**
- `generateShareToken()` - Generates secure token
- `/share/:token` - Public route for accessing shared files
- No authentication required for accessing shared files

## Activity Logging

All sensitive operations are logged for auditing:

- File uploads
- File downloads
- File sharing
- File deletions
- Login/logout events
- Community operations
- Scan operations

**Implementation:**
- `activityService.log()` - Log operation
- Activity log accessible only to owner
- Dashboard displays user's activity log

## Session Security

### Session Management
1. **Supabase Authentication**
   - Industry-standard OAuth2 implementation
   - Secure token management
   - Server-side session validation

2. **Daily Session Check**
   - Automatic logout on new calendar day
   - Session date stored in localStorage
   - Automatic refresh of session tokens

3. **Demo Mode**
   - Can be toggled via `IS_DEMO_MODE` flag
   - Uses localStorage for demo sessions
   - Data persists between page reloads

## Best Practices for Authorization

1. **Always check authentication before sensitive operations**
   ```typescript
   if (!user) {
       navigate('/login', { state: { action: 'operation_name' } });
       return;
   }
   ```

2. **Verify ownership for user-specific resources**
   ```typescript
   const authCheck = canDeleteFile(user, fileOwnerId);
   if (!authCheck.authorized) return;
   ```

3. **Use authorization service consistently**
   - Import checkers from `authorizationService.ts`
   - Use centralized checks instead of inline logic
   - Show meaningful error messages from authorization responses

4. **Log all critical operations**
   ```typescript
   activityService.log(type, title, description, metadata);
   ```

5. **Provide clear feedback to users**
   - Show toast notifications for auth failures
   - Redirect to login with context about what action was attempted
   - Explain permission errors clearly

## Future Enhancements

1. **Role-Based Access Control (RBAC)**
   - Admin roles
   - Moderator roles
   - Custom community roles

2. **Fine-Grained Permissions**
   - View-only mode for shared vaults
   - Download limits
   - Expiration enforcement
   - IP-based access control

3. **Encrypted Keys Management**
   - Per-file encryption keys
   - Key rotation policies
   - Key escrow for recovery

4. **Advanced Audit Logging**
   - Detailed access logs
   - IP address tracking
   - Device fingerprinting
   - Anomaly detection

5. **Multi-Factor Authentication**
   - TOTP support
   - SMS verification
   - Hardware key support
   - Backup codes

## Testing Authorization

To test authorization features:

1. **Test Unauthenticated Access**
   - Try accessing protected routes directly
   - Should redirect to login

2. **Test Ownership Verification**
   - Create file as User A
   - Try to delete as User B
   - Should show "not authorized" error

3. **Test Activity Logging**
   - Perform operations
   - Check activity log
   - Verify all operations are recorded

4. **Test Session Expiration**
   - Login
   - Wait for session to expire (or set system time forward)
   - Try perform operation
   - Should prompt to login again

## Security Considerations

1. **Client-Side Authorization**
   - All checks should be validated server-side
   - Client-side checks are UI improvements only
   - Backend API must enforce permissions

2. **Token Security**
   - Share tokens are stored in URLs
   - Always use HTTPS in production
   - Consider additional PIN protection for sensitive files

3. **Activity Logs**
   - Keep detailed logs for audit trails
   - Implement log retention policies
   - Encrypt sensitive log data

4. **Password Requirements**
   - Enforce strong password policies
   - Implement rate limiting on login
   - Add CAPTCHA on repeated failures

## File Encryption/Decryption Flow (User-Facing)

**Goal:** Allow users to upload any file type, store only the encrypted `.enc`, then download and decrypt it locally to recover the original file with the correct extension for secure sharing.

```
Upload file
   ↓
Encrypt (Buffer)
   ↓
Store .enc
   ↓
Download .enc
   ↓
Decrypt → generate ORIGINAL FILE
   ↓
Save as original.extension
   ↓
Open normally
```

### Notes
- Supports any file type the user chooses (PDFs, images, videos, archives, etc.).
- Keep the original filename and extension in metadata so decryption restores the correct name.
- Store only the encrypted `.enc` in the vault to protect data at rest.
- Decryption should output a byte-identical copy of the original file.
