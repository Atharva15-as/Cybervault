import { ScanResult, ScanHistoryRecord, ScanStats } from '../types';

const DB_NAME = 'CyberVaultScanner';
const DB_VERSION = 1;
const STORE_NAME = 'scan_history';

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
            }
        };
    });
}

export async function saveScanResult(result: ScanResult): Promise<void> {
    const record: ScanHistoryRecord = {
        id: result.id, type: result.type, target: result.target,
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

export async function getScanHistory(limit = 50): Promise<ScanHistoryRecord[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const req = index.openCursor(null, 'prev');
        const results: ScanHistoryRecord[] = [];
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor && results.length < limit) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getScanStats(): Promise<ScanStats> {
    const records = await getScanHistory(1000);
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

export async function clearAllHistory(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
