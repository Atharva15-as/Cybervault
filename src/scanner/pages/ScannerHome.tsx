import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSearch, Globe, History, ChevronRight, Zap } from 'lucide-react';
import { getScanHistory, getScanStats } from '../services/scanDatabase';
import { ScanHistoryRecord, ScanStats } from '../types';
import { useAuth } from '../../context/AuthContext';
import '../styles/scanner.css';

export default function ScannerHome() {
    const [stats, setStats] = useState<ScanStats | null>(null);
    const [recentRecords, setRecentRecords] = useState<ScanHistoryRecord[]>([]);
    const [showAllFiles, setShowAllFiles] = useState(false);
    const [showAllLinks, setShowAllLinks] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        setShowAllFiles(false);
        setShowAllLinks(false);

        Promise.all([getScanStats(user?.id), getScanHistory(40, user?.id)]).then(([scanStats, history]) => {
            setStats(scanStats);
            setRecentRecords(history);
        });
    }, [user?.id]);

    const visibleItems = 3;
    const fileRecords = recentRecords.filter((record) => record.type === 'file');
    const urlRecords = recentRecords.filter((record) => record.type === 'url');
    const visibleFiles = showAllFiles ? fileRecords : fileRecords.slice(0, visibleItems);
    const visibleLinks = showAllLinks ? urlRecords : urlRecords.slice(0, visibleItems);

    return (
        <div className="scanner-root scanner-bg" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="scan-line-overlay" />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '5rem', flex: 1, width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Shield className="h-10 w-10 text-primary-500" />
                        <h1 className="glitch-text gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
                            THREAT SCANNER
                        </h1>
                    </div>
                    <p style={{ color: 'var(--cyber-muted)', fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
                        Advanced malware analysis powered by 72 detection engines, YARA rules, entropy analysis, and behavioral pattern matching
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <Link to="/scanner/file" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <FileSearch className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>File Scanner</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>Upload and analyze files</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['Hash Matching', 'Entropy Analysis', 'PE Analysis', 'Pattern Matching', 'YARA Rules', 'PDF Reports'].map((feature) => (
                                    <span key={feature} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{feature}</span>
                                ))}
                            </div>
                        </div>
                    </Link>

                    <Link to="/scanner/url" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>URL Scanner</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>Analyze suspicious URLs</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['72 Engines', 'Domain Check', 'Phishing Detection', 'TLD Analysis', 'Pattern Matching', 'Brand Detection'].map((feature) => (
                                    <span key={feature} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{feature}</span>
                                ))}
                            </div>
                        </div>
                    </Link>

                    <Link to="/scanner/history" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <History className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>Scan History</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>View past results and stats</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['SQLite Storage', 'Stats Dashboard', 'Scan Timeline', 'Export Data', 'Threat Trends'].map((feature) => (
                                    <span key={feature} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{feature}</span>
                                ))}
                            </div>
                        </div>
                    </Link>

                    <Link to="/siem" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>SIEM Tool</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>Monitor logs and alerts</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['Live Timeline', 'Severity Filters', 'Alert Detection', 'CSV Export', 'Scan + Activity Logs'].map((feature) => (
                                    <span key={feature} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{feature}</span>
                                ))}
                            </div>
                        </div>
                    </Link>
                </div>

                {(fileRecords.length > 0 || urlRecords.length > 0) && (
                    <div className="cyber-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1rem', color: 'var(--cyber-text)', marginBottom: '1rem' }}>
                            Your Recent Scans
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            <div style={{ background: 'rgba(10,10,18,0.45)', border: '1px solid var(--cyber-border)', borderRadius: 10, padding: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                                    <FileSearch size={16} style={{ color: 'var(--neon-cyan)' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyber-text)' }}>
                                        Files ({fileRecords.length})
                                    </span>
                                </div>
                                {visibleFiles.length === 0 ? (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--cyber-muted)' }}>No scanned files yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {visibleFiles.map((record) => (
                                            <div key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--cyber-text)', wordBreak: 'break-word' }}>{record.target}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', marginTop: 2 }}>
                                                    {new Date(record.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {fileRecords.length > visibleItems && (
                                    <button
                                        onClick={() => setShowAllFiles((current) => !current)}
                                        className="cyber-btn"
                                        style={{ marginTop: '0.75rem', fontSize: '0.72rem', padding: '6px 10px' }}
                                    >
                                        {showAllFiles ? 'Show less' : `Show more (${fileRecords.length - visibleItems})`}
                                    </button>
                                )}
                            </div>

                            <div style={{ background: 'rgba(10,10,18,0.45)', border: '1px solid var(--cyber-border)', borderRadius: 10, padding: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                                    <Globe size={16} style={{ color: 'var(--neon-magenta)' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyber-text)' }}>
                                        Links ({urlRecords.length})
                                    </span>
                                </div>
                                {visibleLinks.length === 0 ? (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--cyber-muted)' }}>No scanned links yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {visibleLinks.map((record) => (
                                            <div key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--cyber-text)', wordBreak: 'break-word' }}>{record.target}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', marginTop: 2 }}>
                                                    {new Date(record.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {urlRecords.length > visibleItems && (
                                    <button
                                        onClick={() => setShowAllLinks((current) => !current)}
                                        className="cyber-btn"
                                        style={{ marginTop: '0.75rem', fontSize: '0.72rem', padding: '6px 10px' }}
                                    >
                                        {showAllLinks ? 'Show less' : `Show more (${urlRecords.length - visibleItems})`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {stats && stats.totalScans > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--cyber-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} style={{ color: 'var(--neon-cyan)' }} /> Quick Stats
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                            <div className="stat-card">
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyber-muted)', marginBottom: 4 }}>Total Scans</div>
                                <div className="neon-cyan count-up" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalScans}</div>
                            </div>
                            <div className="stat-card">
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyber-muted)', marginBottom: 4 }}>Threats Found</div>
                                <div className="neon-red count-up" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.threatsFound}</div>
                            </div>
                            <div className="stat-card">
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyber-muted)', marginBottom: 4 }}>Clean</div>
                                <div className="neon-green count-up" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.cleanScans}</div>
                            </div>
                            <div className="stat-card">
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyber-muted)', marginBottom: 4 }}>Avg Score</div>
                                <div className="neon-yellow count-up" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.averageThreatScore}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
