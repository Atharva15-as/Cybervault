// Dead Man's Switch Service — Auto-share files if user doesn't check in

export interface DeadManSwitch {
    id: string;
    name: string;
    description: string;
    checkInIntervalDays: number;
    lastCheckIn: string;
    nextDeadline: string;
    recipients: Recipient[];
    fileIds: string[];
    isActive: boolean;
    isTriggered: boolean;
    createdAt: string;
    warningsSent: number;
}

export interface Recipient {
    name: string;
    email: string;
    message: string;
}

const STORAGE_KEY = 'cybervault_dead_man_switch';

function getSwitches(): DeadManSwitch[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveSwitches(switches: DeadManSwitch[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(switches));
}

export const deadManSwitchService = {
    create(input: {
        name: string;
        description: string;
        checkInIntervalDays: number;
        recipients: Recipient[];
        fileIds: string[];
    }): DeadManSwitch {
        const now = new Date();
        const deadline = new Date(now.getTime() + input.checkInIntervalDays * 86400000);

        const dms: DeadManSwitch = {
            id: `dms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: input.name,
            description: input.description,
            checkInIntervalDays: input.checkInIntervalDays,
            lastCheckIn: now.toISOString(),
            nextDeadline: deadline.toISOString(),
            recipients: input.recipients,
            fileIds: input.fileIds,
            isActive: true,
            isTriggered: false,
            createdAt: now.toISOString(),
            warningsSent: 0,
        };

        const switches = getSwitches();
        switches.unshift(dms);
        saveSwitches(switches);
        return dms;
    },

    checkIn(id: string): DeadManSwitch | null {
        const switches = getSwitches();
        const dms = switches.find(s => s.id === id);
        if (!dms || dms.isTriggered) return null;

        const now = new Date();
        dms.lastCheckIn = now.toISOString();
        dms.nextDeadline = new Date(now.getTime() + dms.checkInIntervalDays * 86400000).toISOString();
        dms.warningsSent = 0;
        saveSwitches(switches);
        return dms;
    },

    getAll(): DeadManSwitch[] {
        return getSwitches();
    },

    getActive(): DeadManSwitch[] {
        return getSwitches().filter(s => s.isActive && !s.isTriggered);
    },

    getStatus(dms: DeadManSwitch): {
        status: 'safe' | 'warning' | 'critical' | 'triggered';
        timeRemaining: string;
        percentRemaining: number;
    } {
        if (dms.isTriggered) {
            return { status: 'triggered', timeRemaining: 'Triggered', percentRemaining: 0 };
        }

        const now = new Date().getTime();
        const deadline = new Date(dms.nextDeadline).getTime();
        const lastCheckIn = new Date(dms.lastCheckIn).getTime();
        const totalInterval = deadline - lastCheckIn;
        const remaining = deadline - now;
        const percentRemaining = Math.max(0, Math.min(100, (remaining / totalInterval) * 100));

        let status: 'safe' | 'warning' | 'critical' = 'safe';
        if (percentRemaining <= 10) status = 'critical';
        else if (percentRemaining <= 30) status = 'warning';

        // Format time remaining
        let timeRemaining: string;
        if (remaining <= 0) {
            timeRemaining = 'OVERDUE';
            status = 'critical';
        } else {
            const days = Math.floor(remaining / 86400000);
            const hours = Math.floor((remaining % 86400000) / 3600000);
            if (days > 0) timeRemaining = `${days}d ${hours}h`;
            else timeRemaining = `${hours}h ${Math.floor((remaining % 3600000) / 60000)}m`;
        }

        return { status, timeRemaining, percentRemaining };
    },

    trigger(id: string): void {
        const switches = getSwitches();
        const dms = switches.find(s => s.id === id);
        if (dms) {
            dms.isTriggered = true;
            dms.isActive = false;
            saveSwitches(switches);
        }
    },

    deactivate(id: string): void {
        const switches = getSwitches();
        const dms = switches.find(s => s.id === id);
        if (dms) {
            dms.isActive = false;
            saveSwitches(switches);
        }
    },

    delete(id: string): void {
        saveSwitches(getSwitches().filter(s => s.id !== id));
    },
};

export default deadManSwitchService;
