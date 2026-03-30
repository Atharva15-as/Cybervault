import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Trash2, FileSearch, Globe, Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Activity } from 'lucide-react';
import { getScanHistory, getScanStats, deleteScanRecord, clearAllHistory } from '../services/scanDatabase';
import { ScanHistoryRecord, ScanStats } from '../types';
import '../styles/scanner.css';

export default function ScanHistory() {
    const [records, setRecords] = useState<ScanHistoryRecord[]>([]);
    const [stats, setStats] = useState<ScanStats | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'file' | 'url' | 'clean' | 'suspicious' | 'malicious'>('all');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const [h, s] = await Promise.all([getScanHistory(100), getScanStats()]);
        setRecords(h); setStats(s); setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const filtered = records.filter(r => {
        if (activeFilter === 'all') return true;
        if (['file', 'url'].includes(activeFilter)) return r.type === activeFilter;
        return r.verdict === activeFilter;
    });

    const handleDelete = async (id: string) => {
        await deleteScanRecord(id);
        loadData();
    };

    const handleClear = async () => {
        if (confirm('Clear all scan history? This cannot be undone.')) {
            await clearAllHistory(); loadData();
        }
    };

    const VerdictBadge = ({ v }: { v: string }) => {
        const icon = v === 'clean' ? <CheckCircle size={12} /> : v === 'suspicious' ? <AlertTriangle size={12} /> : <XCircle size={12} />;
        return <span className={`threat-badge threat-badge-${v}`} style={{ fontSize: '0.65rem' }}>{icon} {v}</span>;
    };

    // Mini bar chart - REMOVED


    return (
        <div className="scanner-root scanner-bg" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="scan-line-overlay" />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '5rem', flex: 1, width: '100%' }}>
                <Link to="/scanner" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--cyber-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back to Scanner
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <History size={28} className="text-primary-500 drop-shadow-lg" />
                    <h1 className="text-3xl md:text-3xl font-bold font-heading m-0 text-primary-500">
                        Scan <span className="gradient-text">History</span>
                    </h1>
                </div>

                {/* Stats Dashboard */}
                {stats && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Total Scans', value: stats.totalScans, icon: <Activity size={18} />, color: 'var(--neon-cyan)' },
                                { label: 'File Scans', value: stats.fileScans, icon: <FileSearch size={18} />, color: 'var(--neon-cyan)' },
                                { label: 'URL Scans', value: stats.urlScans, icon: <Globe size={18} />, color: 'var(--neon-magenta)' },
                                { label: 'Threats', value: stats.threatsFound, icon: <AlertTriangle size={18} />, color: 'var(--neon-red)' },
                                { label: 'Clean', value: stats.cleanScans, icon: <CheckCircle size={18} />, color: 'var(--neon-green)' },
                                { label: 'Avg Score', value: stats.averageThreatScore, icon: <TrendingUp size={18} />, color: 'var(--neon-yellow)' },
                            ].map((s, i) => (
                                <div key={i} className="stat-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <span style={{ color: s.color }}>{s.icon}</span>
                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyber-muted)' }}>{s.label}</span>
                                    </div>
                                    <div className="count-up" style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>


                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="scanner-tabs" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {(['all', 'file', 'url', 'clean', 'suspicious', 'malicious'] as const).map(f => (
                            <button key={f} className={`scanner-tab ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                                {f === 'all' ? 'All' : f === 'file' ? 'Files' : f === 'url' ? 'URLs' : f}
                            </button>
                        ))}
                    </div>
                    {records.length > 0 && (
                        <button className="cyber-btn cyber-btn-danger" onClick={handleClear} style={{ fontSize: '0.75rem', padding: '6px 12px', marginLeft: 'auto' }}>
                            Clear All
                        </button>
                    )}
                </div>

                {/* History List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--cyber-muted)' }}>
                        <div className="scanning-pulse"><Shield size={32} style={{ color: 'var(--neon-cyan)' }} /></div>
                        <div style={{ marginTop: 12 }}>Loading scan history...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="cyber-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <History size={48} style={{ color: 'var(--cyber-muted)', marginBottom: 12 }} />
                        <div style={{ color: 'var(--cyber-text)', fontSize: '1rem', marginBottom: 4 }}>No scan records found</div>
                        <div style={{ color: 'var(--cyber-muted)', fontSize: '0.85rem' }}>Start scanning files or URLs to build your history</div>
                        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Link to="/scanner/file"><button className="cyber-btn" style={{ fontSize: '0.8rem' }}>Scan File</button></Link>
                            <Link to="/scanner/url"><button className="cyber-btn" style={{ fontSize: '0.8rem' }}>Scan URL</button></Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filtered.map(r => (
                            <div key={r.id} className="cyber-card" style={{ padding: '14px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    {r.type === 'file' ? <FileSearch size={18} style={{ color: 'var(--neon-cyan)' }} /> : <Globe size={18} style={{ color: 'var(--neon-magenta)' }} />}
                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cyber-text)', wordBreak: 'break-all' }}>{r.target}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', marginTop: 2 }}>
                                            {new Date(r.timestamp).toLocaleString()} {r.fileSize ? ` • ${(r.fileSize / 1024).toFixed(1)} KB` : ''}
                                        </div>
                                    </div>
                                    <VerdictBadge v={r.verdict} />
                                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: r.threatScore >= 60 ? 'var(--neon-red)' : r.threatScore >= 25 ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>{r.threatScore}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--cyber-muted)' }}>SCORE</div>
                                    </div>
                                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--cyber-text)' }}>{r.detectionCount}/{r.totalEngines}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--cyber-muted)' }}>ENGINES</div>
                                    </div>
                                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyber-muted)', padding: 4 }} title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
