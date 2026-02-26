import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, Shield, Search, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import DetectionRing from '../components/DetectionRing';
import { analyzeUrl } from '../services/urlAnalyzer';
import { saveScanResult } from '../services/scanDatabase';
import { ScanResult } from '../types';
import '../styles/scanner.css';

export default function UrlScanner() {
    const [url, setUrl] = useState('');
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');
    const [result, setResult] = useState<ScanResult | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ analysis: true, patterns: true, engines: true });

    const toggleSection = (k: string) => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

    const handleScan = async () => {
        if (!url.trim()) return;
        setScanning(true); setResult(null); setProgress(0);
        try {
            const res = await analyzeUrl(url.trim(), (s, p) => { setStage(s); setProgress(p); });
            setResult(res);
            await saveScanResult(res);
        } catch (err) { console.error(err); }
        setScanning(false);
    };

    const Section = ({ id, title, icon, children, count }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }) => (
        <div className="cyber-card" style={{ marginBottom: 12 }}>
            <button onClick={() => toggleSection(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyber-text)' }}>
                {icon}<span style={{ fontWeight: 600, flex: 1, textAlign: 'left' }}>{title}</span>
                {count !== undefined && <span className={`threat-badge threat-badge-${count > 0 ? 'suspicious' : 'clean'}`}>{count}</span>}
                {expandedSections[id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections[id] && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
        </div>
    );

    return (
        <div className="scanner-root scanner-bg" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="scan-line-overlay" />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '5rem', flex: 1, width: '100%' }}>
                <Link to="/scanner" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--cyber-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back to Scanner
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
                    <Globe size={28} style={{ color: '#00fff5', filter: 'drop-shadow(0 0 6px rgba(0,255,245,0.5))' }} />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6' }}>URL Scanner</h1>
                </div>

                {/* URL Input */}
                {!result && (
                    <div className="cyber-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input
                                className="cyber-input"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleScan()}
                                placeholder="https://example.com/"
                                style={{ flex: 1, backgroundColor: '#12121f', color: '#ffffff' }}
                            />
                            <button className="cyber-btn-solid" onClick={handleScan} disabled={!url.trim() || scanning} style={{ whiteSpace: 'nowrap', padding: '12px 24px', display: 'inline-flex', alignItems: 'center' }}>
                                <Search size={16} style={{ marginRight: 6 }} /> Scan URL
                            </button>
                        </div>
                    </div>
                )}

                {/* Scanning */}
                {scanning && (
                    <div className="cyber-card" style={{ padding: '2rem', marginTop: '1.5rem', textAlign: 'center' }}>
                        <div className="scanning-pulse" style={{ marginBottom: 16 }}>
                            <Globe size={48} style={{ color: 'var(--neon-magenta)' }} />
                        </div>
                        <div className="terminal-text" style={{ marginBottom: 12, color: 'var(--neon-magenta)' }}>[ {stage} ]</div>
                        <div className="cyber-progress" style={{ marginBottom: 8 }}>
                            <div className="cyber-progress-bar" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--neon-magenta), var(--neon-orange))' }} />
                        </div>
                        <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem' }}>{progress}% complete</div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div style={{ marginTop: '1rem' }}>
                        {/* Top Result */}
                        <div className="cyber-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', justifyContent: 'center' }}>
                                <DetectionRing detections={result.detectionCount} total={result.totalEngines} threatScore={result.threatScore} verdict={result.verdict} />
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        {result.verdict === 'clean' ? <CheckCircle size={20} style={{ color: 'var(--neon-green)' }} /> : result.verdict === 'suspicious' ? <AlertTriangle size={20} style={{ color: 'var(--neon-yellow)' }} /> : <XCircle size={20} style={{ color: 'var(--neon-red)' }} />}
                                        <span className={`threat-badge threat-badge-${result.verdict}`}>{result.verdict.toUpperCase()}</span>
                                    </div>
                                    <div className="terminal-text" style={{ fontSize: '0.85rem', wordBreak: 'break-all', marginBottom: 12, color: 'var(--neon-magenta)' }}>{result.target}</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="cyber-btn" onClick={() => { setResult(null); setUrl(''); }} style={{ fontSize: '0.8rem', padding: '8px 16px' }}>New Scan</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* URL Analysis */}
                        {result.urlAnalysis && (
                            <Section id="analysis" title="URL Analysis" icon={<Globe size={18} style={{ color: 'var(--neon-magenta)' }} />}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                                    {[
                                        { label: 'Domain', value: result.urlAnalysis.domain, color: result.urlAnalysis.isMaliciousDomain ? 'var(--neon-red)' : 'var(--neon-green)' },
                                        { label: 'TLD', value: result.urlAnalysis.tld, color: result.urlAnalysis.isSuspiciousTld ? 'var(--neon-yellow)' : 'var(--neon-green)' },
                                        { label: 'Protocol', value: result.urlAnalysis.protocol, color: result.urlAnalysis.protocol === 'http:' ? 'var(--neon-yellow)' : 'var(--neon-green)' },
                                        { label: 'URL Length', value: `${result.urlAnalysis.urlLength} chars`, color: result.urlAnalysis.urlLength > 200 ? 'var(--neon-yellow)' : 'var(--cyber-text)' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ padding: 12, background: 'rgba(10,10,18,0.5)', borderRadius: 8, border: '1px solid var(--cyber-border)' }}>
                                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--cyber-muted)', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: item.color, wordBreak: 'break-all' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Flags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {result.urlAnalysis.isMaliciousDomain && <span className="threat-badge threat-badge-malicious">⚠ Known Malicious Domain</span>}
                                    {result.urlAnalysis.isSuspiciousTld && <span className="threat-badge threat-badge-suspicious">⚠ Suspicious TLD</span>}
                                    {result.urlAnalysis.phishingBrand && <span className="threat-badge threat-badge-malicious">🎣 Phishing: {result.urlAnalysis.phishingBrand}</span>}
                                    {result.urlAnalysis.ipInUrl && <span className="threat-badge threat-badge-high">⚠ IP in URL</span>}
                                    {result.urlAnalysis.hasObfuscation && <span className="threat-badge threat-badge-high">⚠ URL Obfuscation</span>}
                                    {result.urlAnalysis.excessiveSubdomains && <span className="threat-badge threat-badge-medium">⚠ Excessive Subdomains</span>}
                                    {!result.urlAnalysis.isMaliciousDomain && !result.urlAnalysis.isSuspiciousTld && !result.urlAnalysis.phishingBrand && <span className="threat-badge threat-badge-clean">✓ No major flags</span>}
                                </div>
                            </Section>
                        )}

                        {/* Suspicious Patterns */}
                        {result.urlAnalysis && (
                            <Section id="patterns" title="Detected Patterns" icon={<AlertTriangle size={18} style={{ color: 'var(--neon-orange)' }} />} count={result.urlAnalysis.suspiciousPatterns.length}>
                                {result.urlAnalysis.suspiciousPatterns.length === 0 ? (
                                    <div style={{ color: 'var(--neon-green)', fontSize: '0.85rem' }}>✓ No suspicious patterns detected</div>
                                ) : result.urlAnalysis.suspiciousPatterns.map((p, i) => (
                                    <div key={i} style={{ padding: '10px 12px', marginBottom: 6, background: 'rgba(10,10,18,0.5)', borderRadius: 6, border: '1px solid var(--cyber-border)', borderLeft: `3px solid ${p.severity === 'critical' ? 'var(--neon-red)' : p.severity === 'high' ? 'var(--neon-orange)' : 'var(--neon-yellow)'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--cyber-text)', fontSize: '0.85rem' }}>{p.pattern}</span>
                                            <span className={`threat-badge threat-badge-${p.severity}`} style={{ fontSize: '0.6rem' }}>{p.severity}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>{p.description}</div>
                                    </div>
                                ))}
                            </Section>
                        )}

                        {/* Engine Results */}
                        <Section id="engines" title={`Engine Results (${result.detectionCount}/${result.totalEngines})`} icon={<Shield size={18} style={{ color: 'var(--neon-cyan)' }} />}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="engine-table">
                                    <thead><tr><th>Engine</th><th>Result</th><th>Category</th></tr></thead>
                                    <tbody>
                                        {result.engineResults.sort((a, b) => (b.detected ? 1 : 0) - (a.detected ? 1 : 0)).map((e, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>{e.engine}</td>
                                                <td>{e.detected ? <span style={{ color: 'var(--neon-red)', fontWeight: 600 }}>{e.result}</span> : <span style={{ color: 'var(--neon-green)' }}>Clean</span>}</td>
                                                <td style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem' }}>{e.category}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
}
