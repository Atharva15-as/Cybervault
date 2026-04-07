import { ScanResult, ScanHistoryRecord, ScanStats } from '../types';

const DB_NAME = 'CyberVaultScanner';
const DB_VERSION = 2;
const STORE_NAME = 'scan_history';
const GUEST_OWNER_ID = 'guest';
const MAX_TARGET_LENGTH = 2048;

function normalizeOwnerId(ownerId?: string | null): string {
    return ownerId?.trim() || GUEST_OWNER_ID;
}

function isRecordVisibleToOwner(record: ScanHistoryRecord, ownerId?: string | null): boolean {
    if (ownerId?.trim()) {
        return record.ownerId === ownerId;
    }

    // Backward compatibility for old guest records that were saved before ownerId existed.
    return !record.ownerId || record.ownerId === GUEST_OWNER_ID;
}

function normalizeScanTarget(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, MAX_TARGET_LENGTH);
}

function isValidScanRecord(record: ScanHistoryRecord): boolean {
    return (
        typeof record.id === 'string' &&
        (record.type === 'file' || record.type === 'url') &&
        normalizeScanTarget(record.target).length > 0 &&
        Number.isFinite(record.timestamp) &&
        Number.isFinite(record.threatScore) &&
        Number.isFinite(record.detectionCount) &&
        Number.isFinite(record.totalEngines)
    );
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('verdict', 'verdict', { unique: false });
                store.createIndex('ownerId', 'ownerId', { unique: false });
            } else {
                const tx = (e.target as IDBOpenDBRequest).transaction;
                const store = tx?.objectStore(STORE_NAME);
                if (store && !store.indexNames.contains('ownerId')) {
                    store.createIndex('ownerId', 'ownerId', { unique: false });
                }
            }
        };
    });
}

export async function saveScanResult(result: ScanResult, ownerId?: string | null): Promise<void> {
    const target = normalizeScanTarget(result.target);
    if (!target) return;

    const record: ScanHistoryRecord = {
        ownerId: normalizeOwnerId(ownerId),
        id: result.id, type: result.type, target,
        timestamp: result.timestamp, threatScore: result.threatScore,
        verdict: result.verdict, detectionCount: result.detectionCount,
        totalEngines: result.totalEngines, fileSize: result.fileSize,
        hashes: result.hashes,
    };
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getScanHistory(limit = 50, ownerId?: string | null): Promise<ScanHistoryRecord[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const req = index.openCursor(null, 'prev');
        const results: ScanHistoryRecord[] = [];
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                const record = cursor.value as ScanHistoryRecord;
                if (!isValidScanRecord(record)) {
                    cursor.continue();
                    return;
                }
                record.target = normalizeScanTarget(record.target);

                if (isRecordVisibleToOwner(record, ownerId) && results.length < limit) {
                    results.push(record);
                }
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getScanStats(ownerId?: string | null): Promise<ScanStats> {
    const records = await getScanHistory(1000, ownerId);
    const totalScans = records.length;
    const fileScans = records.filter(r => r.type === 'file').length;
    const urlScans = records.filter(r => r.type === 'url').length;
    const maliciousScans = records.filter(r => r.verdict === 'malicious').length;
    const suspiciousScans = records.filter(r => r.verdict === 'suspicious').length;
    const cleanScans = records.filter(r => r.verdict === 'clean').length;
    const threatsFound = maliciousScans + suspiciousScans;
    const avgScore = totalScans > 0 ? records.reduce((s, r) => s + r.threatScore, 0) / totalScans : 0;

    const dayMap: Record<string, number> = {};
    records.forEach(r => {
        const day = new Date(r.timestamp).toISOString().split('T')[0];
        dayMap[day] = (dayMap[day] || 0) + 1;
    });
    const scansByDay = Object.entries(dayMap).sort().slice(-30).map(([date, count]) => ({ date, count }));

    return {
        totalScans, fileScans, urlScans, threatsFound, cleanScans, suspiciousScans, maliciousScans,
        averageThreatScore: Math.round(avgScore),
        scansByDay,
        verdictDistribution: [
            { verdict: 'clean', count: cleanScans },
            { verdict: 'suspicious', count: suspiciousScans },
            { verdict: 'malicious', count: maliciousScans },
        ],
    };
}

export async function deleteScanRecord(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function clearAllHistory(ownerId?: string | null): Promise<void> {
    const db = await openDB();
    const records = await getScanHistory(10000, ownerId);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        records.forEach(record => {
            store.delete(record.id);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
