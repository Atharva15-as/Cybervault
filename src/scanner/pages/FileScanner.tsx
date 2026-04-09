import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileSearch, Download, Shield, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Hash, Cpu, Binary, Bug, Flame } from 'lucide-react';
import DetectionRing from '../components/DetectionRing';
import { analyzeFile } from '../services/fileAnalyzer';
import { saveScanResult } from '../services/scanDatabase';
import { generatePdfReport } from '../services/pdfReportGenerator';
import { ScanResult } from '../types';
import { useAuth } from '../../context/AuthContext';
import '../styles/scanner.css';

export default function FileScanner() {
    const [file, setFile] = useState<File | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [stage, setStage] = useState('');
    const [result, setResult] = useState<ScanResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ hashes: true, entropy: true, engines: true });
    const inputRef = useRef<HTMLInputElement>(null);

    const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        if (e.dataTransfer.files[0]) { setFile(e.dataTransfer.files[0]); setResult(null); }
    }, []);

    const handleScan = async () => {
        if (!file) return;
        setScanning(true); setResult(null); setProgress(0);
        try {
            const res = await analyzeFile(file, (s, p) => { setStage(s); setProgress(p); });
            setResult(res);
            await saveScanResult(res, user?.id);
        } catch (err) { console.error(err); }
        setScanning(false);
    };

    const verdictIcon = (v: string) => {
        if (v === 'clean') return <CheckCircle size={20} style={{ color: 'var(--neon-green)' }} />;
        if (v === 'suspicious') return <AlertTriangle size={20} style={{ color: 'var(--neon-yellow)' }} />;
        return <XCircle size={20} style={{ color: 'var(--neon-red)' }} />;
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

    const steps = [
        { step: '1', title: 'Upload File', desc: 'Drag and drop or select a file to be analyzed by our engine.' },
        { step: '2', title: 'Wait for Scan', desc: 'Our engine performs static heuristic analysis and hash lookups.' },
        { step: '3', title: 'Review Report', desc: 'Get a comprehensive verdict with threat scores and PDF exports.' },
    ];

    const features = [
        { icon: Shield, title: 'Multi-Engine', desc: 'Scans against multiple signature databases for maximum coverage.' },
        { icon: Cpu, title: 'Heuristic Analysis', desc: 'Identifies zero-day threats through PE imports and entropy analysis.' },
        { icon: Binary, title: 'Pattern Matching', desc: 'Detects malicious patterns and YARA rules embedded in files.' },
    ];

    return (
        <div className="scanner-root scanner-bg" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="scan-line-overlay" />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '7rem', flex: 1, width: '100%' }}>
                
                <div className="mb-12">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mt-1">
                            <FileSearch size={24} className="text-primary-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary-500">File Scanner</h1>
                            <p style={{ fontSize: '1.1rem', color: 'var(--cyber-muted)', marginTop: '0.5rem' }}>
                                Built-in threat detection automatically scans your uploads for malicious signatures and vulnerabilities.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT SIDE — How to Use + Features */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="cyber-card" style={{ padding: '1.5rem', position: 'sticky', top: '7rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 255, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertTriangle size={20} style={{ color: 'var(--neon-cyan)' }} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cyber-text)', margin: 0 }}>How to Use</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                {steps.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 16 }}>
                                        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--neon-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 0 15px rgba(0, 255, 245, 0.4)' }}>
                                            {item.step}
                                        </div>
                                        <div style={{ paddingTop: 2 }}>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyber-text)', marginBottom: 4 }}>{item.title}</h4>
                                            <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--cyber-muted)', margin: 0 }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: 1, background: 'var(--cyber-border)', margin: '1.5rem 0' }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 255, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={20} style={{ color: 'var(--neon-cyan)' }} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cyber-text)', margin: 0 }}>Features & Working</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {features.map((item, idx) => (
                                    <div key={idx} style={{ padding: '1rem', borderRadius: 12, background: 'rgba(10, 10, 18, 0.5)', border: '1px solid var(--cyber-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <item.icon size={16} style={{ color: 'var(--neon-cyan)' }} />
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyber-text)', margin: 0 }}>{item.title}</h4>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--cyber-muted)', margin: 0 }}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE — Tool */}
                    <div className="lg:col-span-8">
                        {/* Drop Zone */}
                        {!result && (
                            <div
                                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <input ref={inputRef} type="file" hidden onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResult(null); } }} />
                                <Download size={48} style={{ color: dragOver ? 'var(--neon-cyan)' : 'var(--cyber-muted)', marginBottom: 12, transition: 'color 0.3s' }} />
                                {file ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="neon-cyan" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
                                        <div style={{ color: 'var(--cyber-muted)', fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(2)} KB • {file.type || 'unknown type'}</div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--cyber-text)', fontSize: '1.25rem', fontWeight: 600 }}>Upload Files</div>
                                )}
                            </div>
                        )}

                        {/* Scan Button */}
                        {file && !scanning && !result && (
                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <button className="cyber-btn-solid" onClick={handleScan} style={{ fontSize: '1rem', padding: '14px 40px' }}>
                                    Analyze File
                                </button>
                            </div>
                        )}

                        {/* Scanning Progress */}
                        {scanning && (
                            <div className="cyber-card" style={{ padding: '2rem', marginTop: '1.5rem', textAlign: 'center' }}>
                                <div className="scanning-pulse" style={{ marginBottom: 16 }}>
                                    <Shield size={48} style={{ color: 'var(--neon-cyan)' }} />
                                </div>
                                <div className="terminal-text" style={{ marginBottom: 12 }}>[ {stage} ]</div>
                                <div className="cyber-progress" style={{ marginBottom: 8 }}>
                                    <div className="cyber-progress-bar" style={{ width: `${progress}%` }} />
                                </div>
                                <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem' }}>{progress}% complete</div>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div style={{ marginTop: '0' }}>
                                {/* Top Result Card */}
                                <div className="cyber-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', justifyContent: 'center' }}>
                                        <DetectionRing detections={result.detectionCount} total={result.totalEngines} threatScore={result.threatScore} verdict={result.verdict} />
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                {verdictIcon(result.verdict)}
                                                <span className={`threat-badge threat-badge-${result.verdict}`}>{result.verdict.toUpperCase()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--cyber-text)', marginBottom: 6 }}><strong>File:</strong> {result.target}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--cyber-muted)', marginBottom: 4 }}>Size: {((result.fileSize || 0) / 1024).toFixed(2)} KB</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--cyber-muted)', marginBottom: 12 }}>Type: {result.fileType}</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <button
                                                    className="cyber-btn"
                                                    onClick={() => {
                                                        if (!user) {
                                                            navigate('/login', { state: { from: location } });
                                                            return;
                                                        }
                                                        generatePdfReport(result);
                                                    }}
                                                    style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                                                >
                                                    <Download size={14} style={{ marginRight: 6 }} /> PDF Report
                                                </button>
                                                <button className="cyber-btn" onClick={() => { setResult(null); setFile(null); }} style={{ fontSize: '0.8rem', padding: '8px 16px' }}>New Scan</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hashes */}
                                {result.hashes && (
                                    <Section id="hashes" title="File Hashes" icon={<Hash size={18} style={{ color: 'var(--neon-cyan)' }} />}>
                                        {(['md5', 'sha1', 'sha256'] as const).map(algo => (
                                            <div key={algo} style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(10,10,18,0.5)', borderRadius: 6, border: '1px solid var(--cyber-border)' }}>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--cyber-muted)', letterSpacing: 1, marginBottom: 2 }}>{algo}</div>
                                                <div className="terminal-text" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{result.hashes![algo]}</div>
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                {/* Entropy */}
                                {result.entropy && (
                                    <Section id="entropy" title="Entropy Analysis" icon={<Flame size={18} style={{ color: 'var(--neon-yellow)' }} />}>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: 12 }}>
                                            <div style={{ flex: 1, minWidth: 140, padding: 12, background: 'rgba(10,10,18,0.5)', borderRadius: 8, border: '1px solid var(--cyber-border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 800, color: result.entropy.value > 7 ? 'var(--neon-red)' : result.entropy.value > 6 ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>{result.entropy.value}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', textTransform: 'uppercase' }}>Shannon Entropy</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 140, padding: 12, background: 'rgba(10,10,18,0.5)', borderRadius: 8, border: '1px solid var(--cyber-border)', textAlign: 'center' }}>
                                                <div className={`threat-badge threat-badge-${result.entropy.assessment === 'encrypted' ? 'malicious' : result.entropy.assessment === 'normal' ? 'clean' : 'suspicious'}`} style={{ fontSize: '0.9rem', marginBottom: 4 }}>{result.entropy.assessment.toUpperCase()}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', textTransform: 'uppercase', marginTop: 8 }}>Assessment</div>
                                            </div>
                                        </div>
                                        <div style={{ padding: 12, background: 'rgba(10,10,18,0.3)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--cyber-muted)', lineHeight: 1.6 }}>
                                            {result.entropy.description}
                                            <div className="cyber-progress" style={{ marginTop: 8, height: 6 }}>
                                                <div className="cyber-progress-bar" style={{ width: `${(result.entropy.value / 8) * 100}%` }} />
                                            </div>
                                        </div>
                                    </Section>
                                )}

                                {/* PE Analysis */}
                                {result.peAnalysis && (
                                    <Section id="pe" title="PE Import Analysis" icon={<Cpu size={18} style={{ color: 'var(--neon-magenta)' }} />} count={result.peAnalysis.suspiciousCount}>
                                        {!result.peAnalysis.isPE ? (
                                            <div style={{ color: 'var(--cyber-muted)', fontSize: '0.85rem' }}>Not a PE (Portable Executable) file</div>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--cyber-text)', marginBottom: 12 }}>
                                                    Found <span className="neon-red" style={{ fontWeight: 700 }}>{result.peAnalysis.suspiciousCount}</span> suspicious imports out of {result.peAnalysis.importCount} total
                                                </div>
                                                {result.peAnalysis.suspiciousImports.map((imp, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4, background: 'rgba(10,10,18,0.5)', borderRadius: 6, border: '1px solid var(--cyber-border)' }}>
                                                        <span className={`threat-badge threat-badge-${imp.risk}`} style={{ fontSize: '0.65rem' }}>{imp.risk}</span>
                                                        <span className="terminal-text" style={{ fontSize: '0.8rem' }}>{imp.name}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', marginLeft: 'auto' }}>{imp.category}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </Section>
                                )}

                                {/* Pattern Matches */}
                                {result.patternMatches && (
                                    <Section id="patterns" title="Pattern Matches" icon={<Binary size={18} style={{ color: 'var(--neon-orange)' }} />} count={result.patternMatches.length}>
                                        {result.patternMatches.length === 0 ? (
                                            <div style={{ color: 'var(--neon-green)', fontSize: '0.85rem' }}>✓ No malicious patterns detected</div>
                                        ) : result.patternMatches.map((p, i) => (
                                            <div key={i} style={{ padding: '10px 12px', marginBottom: 6, background: 'rgba(10,10,18,0.5)', borderRadius: 6, border: '1px solid var(--cyber-border)', borderLeft: `3px solid ${p.severity === 'critical' ? 'var(--neon-red)' : p.severity === 'high' ? 'var(--neon-orange)' : 'var(--neon-yellow)'}` }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--cyber-text)', fontSize: '0.85rem' }}>{p.name}</span>
                                                    <span className={`threat-badge threat-badge-${p.severity}`} style={{ fontSize: '0.6rem' }}>{p.severity}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--cyber-muted)', marginLeft: 'auto' }}>{p.category}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>{p.description}</div>
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                {/* YARA Matches */}
                                {result.yaraMatches && (
                                    <Section id="yara" title="YARA Rules" icon={<Bug size={18} style={{ color: 'var(--neon-red)' }} />} count={result.yaraMatches.length}>
                                        {result.yaraMatches.length === 0 ? (
                                            <div style={{ color: 'var(--neon-green)', fontSize: '0.85rem' }}>✓ No YARA rules matched</div>
                                        ) : result.yaraMatches.map((y, i) => (
                                            <div key={i} style={{ padding: '12px', marginBottom: 8, background: 'rgba(10,10,18,0.5)', borderRadius: 8, border: '1px solid rgba(255,51,68,0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <span className="terminal-text" style={{ fontWeight: 700, color: 'var(--neon-red)' }}>{y.rule}</span>
                                                    <span className={`threat-badge threat-badge-${y.severity}`} style={{ fontSize: '0.6rem' }}>{y.severity}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)', marginBottom: 6 }}>{y.description}</div>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {y.tags.map(t => <span key={t} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,0,229,0.1)', color: 'var(--neon-magenta)', border: '1px solid rgba(255,0,229,0.2)' }}>{t}</span>)}
                                                </div>
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
            </div>
        </div>
    );
}
