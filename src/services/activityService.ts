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
const MAX_ACTIVITY_AGE_DAYS = 180;

const VALID_TYPES: ActivityType[] = [
    'file_upload',
    'file_download',
    'file_share',
    'file_delete',
    'login',
    'logout',
    'scan_file',
    'scan_url',
    'community_create',
    'community_join',
    'settings_change',
];

function isValidActivityType(value: unknown): value is ActivityType {
    return typeof value === 'string' && VALID_TYPES.includes(value as ActivityType);
}

function normalizeActivity(entry: unknown): ActivityEntry | null {
    if (!entry || typeof entry !== 'object') return null;

    const candidate = entry as Partial<ActivityEntry>;
    if (!isValidActivityType(candidate.type)) return null;
    if (typeof candidate.title !== 'string' || typeof candidate.description !== 'string' || typeof candidate.timestamp !== 'string') return null;

    const parsedTime = new Date(candidate.timestamp).getTime();
    if (!Number.isFinite(parsedTime)) return null;

    const maxAgeMs = MAX_ACTIVITY_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - parsedTime > maxAgeMs) return null;

    return {
        id: typeof candidate.id === 'string' && candidate.id.length > 0 ? candidate.id : `act-${parsedTime}`,
        type: candidate.type,
        title: candidate.title.slice(0, 160),
        description: candidate.description.slice(0, 500),
        timestamp: new Date(parsedTime).toISOString(),
        metadata: candidate.metadata && typeof candidate.metadata === 'object' ? candidate.metadata : undefined,
    };
}

function getActivities(): ActivityEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        const normalized = Array.isArray(parsed)
            ? parsed.map(normalizeActivity).filter((entry): entry is ActivityEntry => !!entry)
            : [];

        normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const trimmed = normalized.slice(0, MAX_ENTRIES);
        if (stored && JSON.stringify(parsed) !== JSON.stringify(trimmed)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        }
        return trimmed;
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

    pruneOldAndInvalid() {
        const activities = getActivities();
        saveActivities(activities);
        return activities.length;
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
