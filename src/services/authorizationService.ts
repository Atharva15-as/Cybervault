/**
 * Authorization Service
 * Handles permission checks and authorization logic for sensitive operations
 */

import { User } from '@supabase/supabase-js';

export interface AuthorizationResult {
    authorized: boolean;
    message: string;
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (user: User | null): boolean => {
    return !!user;
};

/**
 * Check if user can perform file operations
 */
export const canPerformFileOperations = (user: User | null): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to perform this action.'
        };
    }
    return { authorized: true, message: '' };
};

/**
 * Check if user can share files
 */
export const canShareFile = (user: User | null): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to share files.'
        };
    }
    // Additional checks can be added here (e.g., subscription status, etc.)
    return { authorized: true, message: '' };
};

/**
 * Check if user can download files
 */
export const canDownloadFile = (user: User | null): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to download files.'
        };
    }
    return { authorized: true, message: '' };
};

/**
 * Check if user can delete files
 */
export const canDeleteFile = (user: User | null, fileOwnerId?: string): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to delete files.'
        };
    }

    // Verify ownership if fileOwnerId is provided
    if (fileOwnerId && user.id !== fileOwnerId) {
        return {
            authorized: false,
            message: 'You do not have permission to delete this file. Only the owner can delete files.'
        };
    }

    return { authorized: true, message: '' };
};

/**
 * Check if user is community admin
 */
export const isCommunityAdmin = (userId: string | undefined, communityCreatorId: string | undefined): boolean => {
    if (!userId || !communityCreatorId) return false;
    return userId === communityCreatorId;
};

/**
 * Check if user can perform community operations
 */
export const canManageCommunity = (user: User | null, communityCreatorId?: string): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to manage communities.'
        };
    }

    if (communityCreatorId && user.id !== communityCreatorId) {
        return {
            authorized: false,
            message: 'You do not have permission to manage this community. Only the creator can perform this action.'
        };
    }

    return { authorized: true, message: '' };
};

/**
 * Check if user can access activity log
 * Activity logs are personal and only the owner can view them
 */
export const canViewActivityLog = (user: User | null, logOwnerId?: string): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to view your activity log.'
        };
    }

    if (logOwnerId && user.id !== logOwnerId) {
        return {
            authorized: false,
            message: 'You do not have permission to view this activity log.'
        };
    }

    return { authorized: true, message: '' };
};

/**
 * Check if user can view admin reports
 * Currently only authenticated users can view
 * Can be extended to check for admin role
 */
export const canViewAdminReports = (user: User | null, isAdminUser?: boolean): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to view reports.'
        };
    }

    if (isAdminUser === false) {
        return {
            authorized: false,
            message: 'You do not have permission to view admin reports. Contact support if you believe this is a mistake.'
        };
    }

    return { authorized: true, message: '' };
};

/**
 * Check if user can perform scan operations
 * Scans can be public, but storing scan history requires authentication
 */
export const canStoreScanHistory = (user: User | null): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to save scan history.'
        };
    }
    return { authorized: true, message: '' };
};

/**
 * Check if user can access scan history
 * Scan history is personal
 */
export const canAccessScanHistory = (user: User | null, historyOwnerId?: string): AuthorizationResult => {
    if (!user) {
        return {
            authorized: false,
            message: 'Authentication required. Please login to view scan history.'
        };
    }

    if (historyOwnerId && user.id !== historyOwnerId) {
        return {
            authorized: false,
            message: 'You do not have permission to view this scan history.'
        };
    }

    return { authorized: true, message: '' };
};
