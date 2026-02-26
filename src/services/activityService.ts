// Activity Log Service - localStorage-based activity tracking

export type ActivityType =
    | 'file_upload'
    | 'file_download'
    | 'file_share'
    | 'file_delete'
    | 'login'
    | 'logout'
    | 'scan_file'
    | 'scan_url'
    | 'community_create'
    | 'community_join'
    | 'settings_change';

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, string>;
}

const STORAGE_KEY = 'cybervault_activity_log';
const MAX_ENTRIES = 200;

function getActivities(): ActivityEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveActivities(activities: ActivityEntry[]) {
    // Keep only the latest entries
    const trimmed = activities.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export const activityService = {
    log(type: ActivityType, title: string, description: string, metadata?: Record<string, string>) {
        const activities = getActivities();
        const entry: ActivityEntry = {
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type,
            title,
            description,
            timestamp: new Date().toISOString(),
            metadata,
        };
        activities.unshift(entry);
        saveActivities(activities);
        return entry;
    },

    getAll(): ActivityEntry[] {
        return getActivities();
    },

    getByType(type: ActivityType): ActivityEntry[] {
        return getActivities().filter(a => a.type === type);
    },

    getRecent(count: number = 10): ActivityEntry[] {
        return getActivities().slice(0, count);
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    getStats() {
        const activities = getActivities();
        const today = new Date().toDateString();
        const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today);

        return {
            total: activities.length,
            today: todayActivities.length,
            uploads: activities.filter(a => a.type === 'file_upload').length,
            downloads: activities.filter(a => a.type === 'file_download').length,
            shares: activities.filter(a => a.type === 'file_share').length,
            scans: activities.filter(a => a.type === 'scan_file' || a.type === 'scan_url').length,
        };
    },
};
