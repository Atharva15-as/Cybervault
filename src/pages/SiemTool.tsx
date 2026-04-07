import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Search, Filter, Download, RefreshCw, AlertTriangle, Info, Siren, FileWarning, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { activityService, ActivityEntry } from '../services/activityService';
import { getScanHistory } from '../scanner/services/scanDatabase';
import { ScanHistoryRecord } from '../scanner/types';

const AUTO_REFRESH_SECONDS = 30;

type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
type SourceType = 'activity' | 'scanner';

interface SiemEvent {
    id: string;
    source: SourceType;
    severity: Severity;
    eventType: string;
    title: string;
    description: string;
    target?: string;
    timestamp: number;
}

const severityStyles: Record<Severity, { text: string; bg: string; border: string }> = {
    info: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    low: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    high: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

function severityFromScan(record: ScanHistoryRecord): Severity {
    if (record.verdict === 'malicious' || record.threatScore >= 80) return 'critical';
    if (record.verdict === 'suspicious' || record.threatScore >= 55) return 'high';
    if (record.threatScore >= 30) return 'medium';
    return 'low';
}

function severityFromActivity(entry: ActivityEntry): Severity {
    if (entry.type === 'login' || entry.type === 'logout') return 'info';
    if (entry.type === 'file_delete') return 'medium';
    if (entry.type === 'scan_url' || entry.type === 'scan_file') return 'medium';
    return 'low';
}

function toEventFromScan(record: ScanHistoryRecord): SiemEvent {
    return {
        id: `siem-scan-${record.id}`,
        source: 'scanner',
        severity: severityFromScan(record),
        eventType: record.type === 'url' ? 'url_scan' : 'file_scan',
        title: `${record.type === 'url' ? 'URL' : 'File'} Scan ${record.verdict.toUpperCase()}`,
        description: `${record.detectionCount}/${record.totalEngines} engines flagged this target.`,
        target: record.target,
        timestamp: record.timestamp,
    };
}

function toEventFromActivity(entry: ActivityEntry): SiemEvent {
    return {
        id: `siem-activity-${entry.id}`,
        source: 'activity',
        severity: severityFromActivity(entry),
        eventType: entry.type,
        title: entry.title,
        description: entry.description,
        target: entry.metadata?.fileName || entry.metadata?.url,
        timestamp: new Date(entry.timestamp).getTime(),
    };
}

function downloadCsv(events: SiemEvent[]) {
    const header = ['timestamp', 'source', 'severity', 'eventType', 'title', 'description', 'target'];
    const rows = events.map((event) => [
        new Date(event.timestamp).toISOString(),
        event.source,
        event.severity,
        event.eventType,
        `"${event.title.replace(/"/g, '""')}"`,
        `"${event.description.replace(/"/g, '""')}"`,
        `"${(event.target || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cybervault-siem-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function SiemTool() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<SiemEvent[]>([]);
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | SourceType>('all');
    const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
    const [alertsOnly, setAlertsOnly] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
    const [nextRefreshIn, setNextRefreshIn] = useState<number>(AUTO_REFRESH_SECONDS);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const panelBg = isDark ? 'bg-[#0b1220]/80 border-[#334155]' : 'bg-white border-[#CBD5E1]';

    const loadEvents = async () => {
        setLoading(true);
        const [scanRecords, activityRecords] = await Promise.all([
            getScanHistory(400, user?.id),
            Promise.resolve(activityService.getAll()),
        ]);
        const merged = [
            ...scanRecords.map(toEventFromScan),
            ...activityRecords.map(toEventFromActivity),
        ].sort((a, b) => b.timestamp - a.timestamp);
        setEvents(merged);
        setLastUpdatedAt(Date.now());
        setNextRefreshIn(AUTO_REFRESH_SECONDS);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, [user?.id]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNextRefreshIn((prev) => {
                if (prev <= 1) {
                    loadEvents();
                    return AUTO_REFRESH_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(interval);
    }, [user?.id]);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            if (sourceFilter !== 'all' && event.source !== sourceFilter) return false;
            if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
            if (alertsOnly && !['high', 'critical'].includes(event.severity)) return false;
            const query = search.trim().toLowerCase();
            if (!query) return true;
            const hay = `${event.title} ${event.description} ${event.eventType} ${event.target || ''}`.toLowerCase();
            return hay.includes(query);
        });
    }, [events, sourceFilter, severityFilter, alertsOnly, search]);

    const stats = useMemo(() => {
        const high = filteredEvents.filter((event) => event.severity === 'high').length;
        const critical = filteredEvents.filter((event) => event.severity === 'critical').length;
        return {
            total: filteredEvents.length,
            alerts: high + critical,
            critical,
            scanner: filteredEvents.filter((event) => event.source === 'scanner').length,
        };
    }, [filteredEvents]);

    const incidents = useMemo(() => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const recent = events.filter((event) => event.timestamp >= oneHourAgo);
        const recentDay = events.filter((event) => event.timestamp >= twentyFourHoursAgo);

        const maliciousUrlScansLastHour = recent.filter(
            (event) =>
                event.source === 'scanner' &&
                event.eventType === 'url_scan' &&
                event.severity === 'critical'
        ).length;

        const criticalLastHour = recent.filter((event) => event.severity === 'critical').length;
        const highOrCriticalDay = recentDay.filter((event) => ['high', 'critical'].includes(event.severity)).length;

        const detected: { id: string; title: string; severity: Severity; description: string }[] = [];

        if (maliciousUrlScansLastHour >= 3) {
            detected.push({
                id: 'rule-malicious-url-burst',
                title: 'Malicious URL Burst',
                severity: 'critical',
                description: `${maliciousUrlScansLastHour} critical URL scan events in the last hour.`,
            });
        }

        if (criticalLastHour >= 5) {
            detected.push({
                id: 'rule-critical-spike',
                title: 'Critical Event Spike',
                severity: 'critical',
                description: `${criticalLastHour} critical events detected in the last hour.`,
            });
        }

        if (highOrCriticalDay >= 12) {
            detected.push({
                id: 'rule-persistent-threats',
                title: 'Persistent Threat Activity',
                severity: 'high',
                description: `${highOrCriticalDay} high/critical events in the last 24 hours.`,
            });
        }

        if (detected.length === 0) {
            detected.push({
                id: 'rule-normal',
                title: 'No Active Incident Rules Triggered',
                severity: 'low',
                description: 'Current event stream is within normal baseline thresholds.',
            });
        }

        return detected;
    }, [events]);

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link to="/scanner" className={`inline-flex items-center gap-2 text-sm ${textMuted} hover:text-primary-500 transition-colors`}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Scanner
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <aside className="xl:col-span-4">
                        <div className={`sticky top-24 rounded-2xl border p-6 ${panelBg}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
                                <Shield className="h-4 w-4 text-primary-500" />
                                <span className="text-xs text-primary-500 font-semibold uppercase tracking-wide">SIEM Manual</span>
                            </div>
                            <h1 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Simple SIEM Tool</h1>
                            <p className={`text-sm mb-5 ${textMuted}`}>
                                Monitor website security events in one place: scan logs, activity logs, alerts, and quick export.
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                                    <h2 className={`text-sm font-semibold mb-2 ${textPrimary}`}>How To Use</h2>
                                    <ol className={`list-decimal pl-5 text-sm space-y-2 ${textMuted}`}>
                                        <li>Click <strong>Refresh Logs</strong> to load latest file/URL scans and user activities.</li>
                                        <li>Filter by source and severity to focus on suspicious or critical items.</li>
                                        <li>Use <strong>Search</strong> for domain, filename, or event type.</li>
                                        <li>Enable <strong>Alerts Only</strong> to display high-risk incidents.</li>
                                        <li>Export filtered logs as CSV for reports or audit sharing.</li>
                                    </ol>
                                </div>

                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                                    <h3 className={`text-sm font-semibold mb-2 ${textPrimary}`}>Normal-Level SIEM Tasks</h3>
                                    <ul className={`text-sm space-y-2 ${textMuted}`}>
                                        <li>Track file and URL scan verdicts over time.</li>
                                        <li>Detect repeated suspicious domains in user activity.</li>
                                        <li>See critical alerts quickly for manual response.</li>
                                        <li>Generate lightweight CSV evidence for internal review.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <section className="xl:col-span-8">
                        <div className={`rounded-2xl border p-5 mb-4 ${panelBg}`}>
                            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
                                <h2 className={`text-xl font-bold ${textPrimary}`}>SIEM Action Console</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={loadEvents} className="btn-secondary text-sm" disabled={loading}>
                                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                        Refresh Logs
                                    </button>
                                    <button onClick={() => downloadCsv(filteredEvents)} className="btn-primary text-sm" disabled={filteredEvents.length === 0}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                            <div className={`text-xs mb-4 ${textMuted}`}>
                                Last updated: {new Date(lastUpdatedAt).toLocaleTimeString()} • Auto-refresh in {nextRefreshIn}s
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="glass-card p-3">
                                    <p className={`text-xs ${textMuted}`}>Total Events</p>
                                    <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
                                </div>
                                <div className="glass-card p-3">
                                    <p className={`text-xs ${textMuted}`}>Active Alerts</p>
                                    <p className="text-2xl font-bold text-orange-400">{stats.alerts}</p>
                                </div>
                                <div className="glass-card p-3">
                                    <p className={`text-xs ${textMuted}`}>Critical</p>
                                    <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
                                </div>
                                <div className="glass-card p-3">
                                    <p className={`text-xs ${textMuted}`}>Scanner Events</p>
                                    <p className="text-2xl font-bold text-primary-500">{stats.scanner}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2 relative">
                                    <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search target, event, or description..."
                                        className="input-field pl-9"
                                    />
                                </div>
                                <select
                                    className="input-field"
                                    value={sourceFilter}
                                    onChange={(e) => setSourceFilter(e.target.value as 'all' | SourceType)}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="scanner">Scanner</option>
                                    <option value="activity">Activity</option>
                                </select>
                                <select
                                    className="input-field"
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value as 'all' | Severity)}
                                >
                                    <option value="all">All Severity</option>
                                    <option value="info">Info</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${alertsOnly ? 'border-orange-500/40 bg-orange-500/15 text-orange-300' : 'border-dark-700 text-gray-400 hover:text-gray-200'}`}
                                    onClick={() => setAlertsOnly((value) => !value)}
                                >
                                    <Siren className="h-3 w-3 inline mr-1" />
                                    Alerts Only
                                </button>
                                <button
                                    className="px-3 py-1.5 rounded-lg text-xs border border-dark-700 text-gray-400 hover:text-gray-200 transition-colors"
                                    onClick={() => { setSearch(''); setSourceFilter('all'); setSeverityFilter('all'); setAlertsOnly(false); }}
                                >
                                    <Filter className="h-3 w-3 inline mr-1" />
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-4 mb-4 ${panelBg}`}>
                            <h3 className={`font-semibold mb-3 ${textPrimary}`}>Incident Rules</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {incidents.map((incident) => {
                                    const sev = severityStyles[incident.severity];
                                    return (
                                        <div key={incident.id} className={`rounded-xl border p-3 ${sev.bg} ${sev.border}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Siren className={`h-4 w-4 ${sev.text}`} />
                                                <p className={`text-sm font-semibold ${textPrimary}`}>{incident.title}</p>
                                            </div>
                                            <p className={`text-xs ${textMuted}`}>{incident.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`rounded-2xl border overflow-hidden ${panelBg}`}>
                            <div className={`px-4 py-3 border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                <h3 className={`font-semibold ${textPrimary}`}>Live Security Timeline</h3>
                            </div>
                            {loading ? (
                                <div className="p-8 text-center">
                                    <RefreshCw className="h-6 w-6 mx-auto animate-spin text-primary-500 mb-2" />
                                    <p className={textMuted}>Loading logs...</p>
                                </div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FileWarning className={`h-8 w-8 mx-auto mb-2 ${textMuted}`} />
                                    <p className={textMuted}>No events found for current filters.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-dark-700/50 max-h-[680px] overflow-auto">
                                    {filteredEvents.map((event) => {
                                        const sev = severityStyles[event.severity];
                                        const severityIcon = event.severity === 'critical'
                                            ? <Siren className={`h-4 w-4 ${sev.text}`} />
                                            : event.severity === 'high'
                                                ? <AlertTriangle className={`h-4 w-4 ${sev.text}`} />
                                                : event.severity === 'info'
                                                    ? <Info className={`h-4 w-4 ${sev.text}`} />
                                                    : <Activity className={`h-4 w-4 ${sev.text}`} />;

                                        return (
                                            <div key={event.id} className={`px-4 py-3 ${isDark ? 'hover:bg-dark-800/30' : 'hover:bg-[#F2FAF6]'} transition-colors`}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${sev.bg} ${sev.border}`}>
                                                        {severityIcon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <p className={`text-sm font-semibold ${textPrimary}`}>{event.title}</p>
                                                            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${sev.bg} ${sev.border} ${sev.text}`}>
                                                                {event.severity}
                                                            </span>
                                                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-primary-500/20 text-primary-400 bg-primary-500/10">
                                                                {event.source}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs mb-1 ${textMuted}`}>{event.description}</p>
                                                        {event.target && <p className="text-xs text-primary-400 break-all">{event.target}</p>}
                                                    </div>
                                                    <div className={`text-[11px] whitespace-nowrap ${textMuted}`}>
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
