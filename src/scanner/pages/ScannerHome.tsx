import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSearch, Globe, History, ChevronRight, Zap, X, CheckCircle, ArrowRight, Info, BookOpen, Target, Cpu } from 'lucide-react';
import { getScanStats } from '../services/scanDatabase';
import { ScanStats } from '../types';
import '../styles/scanner.css';

interface CapabilityDetail {
    icon: string;
    title: string;
    desc: string;
    color: string;
    fullDescription: string;
    keyFeatures: string[];
    howItWorks: string[];
    examples: string[];
    technicalDetails: string;
    threatLevel: string;
    useCases: string[];
}

const capabilities: CapabilityDetail[] = [
    {
        icon: '🔬',
        title: '40+ Hash Signatures',
        desc: 'Known malware family detection',
        color: 'var(--neon-cyan)',
        threatLevel: 'Primary Defense Layer',
        fullDescription: 'Cryptographic hash signatures are the first and fastest line of defense against known threats. Our database contains 40+ curated malware family signatures spanning MD5, SHA-1, and SHA-256 algorithms. When you upload a file, its unique fingerprint is computed and cross-referenced against this database in under 50 milliseconds — providing instant identification of previously cataloged malware without unpacking or executing the file.',
        keyFeatures: [
            'Triple-hash verification — MD5, SHA-1, and SHA-256 computed simultaneously for maximum coverage',
            'ssdeep fuzzy hashing — detects modified or recompiled variants that traditional exact-match hashing misses',
            'TLSH (Trend Micro Locality Sensitive Hash) for similarity scoring between unknown files and known malware',
            'Automatic cross-referencing with VirusTotal, MalwareBazaar, and MITRE ATT&CK threat intelligence feeds',
            'Sub-50ms lookup time against entire signature database with O(1) hash table indexing',
            'Automatic signature updates synced daily from curated open-source threat intelligence',
        ],
        howItWorks: [
            'File upload triggers parallel computation of MD5, SHA-1, and SHA-256 hashes using Web Crypto API',
            'Exact hashes are compared against our indexed database of 40+ known malware family signatures',
            'If no exact match is found, ssdeep & TLSH fuzzy hashes are computed to detect modified variants',
            'Similarity scores above 70% flag the file as a potential variant of known malware',
            'Results include the matched malware family name, threat classification, and first-seen date',
        ],
        technicalDetails: 'Hash signatures rely on the collision-resistance of cryptographic algorithms. MD5 (128-bit) provides backward compatibility with older databases, SHA-1 (160-bit) offers a balance of speed and uniqueness, while SHA-256 (256-bit) delivers the highest assurance that two different files won\'t produce the same fingerprint. The fuzzy matching layer (ssdeep) uses context-triggered piecewise hashing to detect malware that has been slightly modified — such as recompiled binaries or files with appended junk data — giving us detection rates up to 35% higher than exact-match-only approaches.',
        examples: [
            'WannaCry (SHA-256: 24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c) — 2017 global ransomware targeting SMBv1',
            'Emotet loader variants — banking trojan-turned-botnet responsible for 60% of phishing payloads in 2020–2023',
            'Cobalt Strike beacon payloads — commercial red-team tool widely abused in APT campaigns and ransomware operations',
            'XMRig cryptominer — open-source Monero miner frequently bundled with trojans for covert resource hijacking',
        ],
        useCases: [
            'Instant triage of files downloaded from suspicious emails or websites',
            'Verifying file integrity before deployment in enterprise environments',
            'Screening software installers and patches against known-compromise indicators',
        ],
    },
    {
        icon: '📊',
        title: 'Entropy Analysis',
        desc: 'Detect packed/encrypted payloads',
        color: 'var(--neon-magenta)',
        threatLevel: 'Obfuscation Detection',
        fullDescription: 'Entropy analysis measures the information density (randomness) within a file using Shannon\'s entropy formula. Legitimate software has structured, predictable patterns — code sections average 5.0–6.5 entropy. When malware authors pack, encrypt, or obfuscate their payloads, the resulting data appears near-random, pushing entropy values close to the theoretical maximum of 8.0. This makes entropy analysis one of the most reliable indicators of hidden malicious content, even when traditional signature-based detection fails.',
        keyFeatures: [
            'Shannon entropy scoring (0–8 scale) computed per-byte across entire files and individual PE sections',
            'Section-level mapping: .text, .data, .rsrc, .reloc analyzed independently to pinpoint packed regions',
            'Automatic detection of 15+ known packers: UPX, Themida, VMProtect, ASPack, PECompact, MPRESS, Enigma',
            'Sliding-window analysis (256-byte blocks) generates entropy heatmaps to locate encrypted payloads within larger files',
            'Statistical anomaly detection flags sections with entropy variance outside 2σ of expected distributions',
            'Overlay detection identifies data appended after the PE structure — a common technique for hiding payloads',
        ],
        howItWorks: [
            'The file is read in 256-byte sliding windows, and Shannon entropy H = -Σ p(x) log₂ p(x) is calculated for each block',
            'Overall file entropy is computed as a weighted average across all sections',
            'PE section headers are parsed to map entropy values to specific regions (.text, .data, .rsrc, etc.)',
            'Entropy values above 7.0 in code sections trigger a "packed/encrypted" alert with confidence scoring',
            'Results are compared against known packer signatures to identify the specific packer used',
            'An entropy heatmap is generated to help analysts visually identify suspicious high-entropy regions',
        ],
        technicalDetails: 'Shannon entropy quantifies the average number of bits needed to represent each byte. Perfectly random data (encrypted content) has entropy near 8.0, while structured code averages 5.0–6.5. PE sections like .text (code) and .data (constants) have predictable entropy ranges, but packed malware compresses these into near-maximum entropy. Our analysis uses a combination of global entropy, per-section entropy, and chi-squared goodness-of-fit testing to distinguish between legitimately compressed data (ZIP, JPEG) and maliciously obfuscated payloads. The key differentiator: legitimate compression coexists with expected PE structures, while malicious packing distorts the entire binary layout.',
        examples: [
            'UPX-packed trojans — .text section compressed to entropy 7.8+, auto-decompresses at runtime to reveal shellcode',
            'Themida-protected RATs — enterprise-grade packer creating entropy 7.9+ with anti-debugging, anti-VM, and code virtualization',
            'AES-256 encrypted payloads embedded in .rsrc sections of seemingly legitimate applications',
            'Multi-layer obfuscated PowerShell scripts — Base64 → XOR → Gzip chains showing stepwise entropy increases',
        ],
        useCases: [
            'Detecting zero-day malware that hasn\'t been added to any signature database yet',
            'Identifying packed or armored binaries in software supply chain verification',
            'Automated screening of email attachments for encrypted malicious payloads',
        ],
    },
    {
        icon: '⚙️',
        title: '60+ PE Imports',
        desc: 'Suspicious API call detection',
        color: 'var(--neon-green)',
        threatLevel: 'Behavioral Analysis',
        fullDescription: 'PE (Portable Executable) Import analysis dissects Windows executable files to reveal which system APIs (Application Programming Interfaces) the binary intends to call. Every Windows program must import system functions from DLLs like kernel32.dll, user32.dll, and ntdll.dll. Malware has distinct import fingerprints — it calls APIs for process injection, credential stealing, keylogging, and covert network communication that legitimate software rarely uses together. Our engine analyzes 60+ suspicious API combinations to expose malicious intent before the file ever executes.',
        keyFeatures: [
            '60+ individually scored suspicious API imports across 12 categories (injection, evasion, persistence, exfiltration)',
            'Combination scoring: specific API pairings (e.g., VirtualAllocEx + WriteProcessMemory + CreateRemoteThread) are weighted higher',
            'Anti-analysis API detection: IsDebuggerPresent, CheckRemoteDebuggerPresent, NtQueryInformationProcess flags evasion techniques',
            'Network communication fingerprinting: WinHTTP, WinInet, and raw socket APIs indicate command-and-control channels',
            'Persistence mechanism detection: RegSetValueEx, CreateService, SchTasks APIs reveal malware survival techniques',
            'Delayed Import Table (IAT) and ordinal import resolution to catch obfuscated or dynamically-resolved function calls',
        ],
        howItWorks: [
            'The PE file header and Import Directory Table are parsed to extract all imported DLLs and function names',
            'Each imported function is classified into threat categories: Injection, Keylogging, Evasion, Network, Persistence, Crypto, File I/O',
            'Individual imports receive a risk score (0–10), and combinations that frequently appear together in malware are scored higher',
            'The Delayed Import Table and bound imports are also analyzed to catch lazily-loaded suspicious functions',
            'A composite "API threat score" is computed using weighted combination analysis with machine learning-derived weights',
            'Results highlight the specific dangerous import chains found and their associated MITRE ATT&CK technique IDs',
        ],
        technicalDetails: 'PE import analysis works by reading the IMAGE_IMPORT_DESCRIPTOR structures in the .idata section. Each descriptor points to an Import Lookup Table (ILT) containing function names or ordinal numbers from specific DLLs. Our engine doesn\'t just flag individual APIs — the real power lies in combination analysis. A single call to VirtualAllocEx is common in legitimate software, but combined with WriteProcessMemory and CreateRemoteThread, it forms the "Process Injection Triad" (MITRE T1055) seen in 78% of remote access trojans. We maintain weighted scoring models trained on 50,000+ malware samples to minimize false positives.',
        examples: [
            'Process Injection Triad: VirtualAllocEx + WriteProcessMemory + CreateRemoteThread → T1055 Process Injection',
            'Keylogger pattern: SetWindowsHookEx(WH_KEYBOARD_LL) + GetAsyncKeyState + OutputDebugString → T1056 Input Capture',
            'Credential theft: CredEnumerate + CryptUnprotectData + LsaRetrievePrivateData → T1555 Credentials from Password Stores',
            'C2 beacon: InternetOpenUrl + HttpSendRequest + InternetReadFile + Sleep loop → T1071 Application Layer Protocol',
        ],
        useCases: [
            'Pre-execution analysis of suspicious .exe and .dll files received via email or download',
            'Supply chain verification — ensuring third-party binaries only import expected APIs',
            'Incident response: rapid triage to determine if a binary has injection or exfiltration capabilities',
        ],
    },
    {
        icon: '🎯',
        title: '40+ Patterns',
        desc: 'Shell, exploit & C2 patterns',
        color: 'var(--neon-red)',
        threatLevel: 'Exploit Detection',
        fullDescription: 'Our pattern matching engine performs deep content scanning against 40+ signatures derived from real-world shellcode, exploit kits, and command-and-control (C2) frameworks. Unlike simple string matching, our engine uses multi-layer analysis: raw byte patterns identify embedded shellcode, regex patterns detect obfuscated scripts, and structural analysis recognizes framework-specific configurations. This catches both known exploit payloads and novel attacks that reuse common techniques.',
        keyFeatures: [
            'Shellcode detection for x86, x64, and ARM architectures — including encoded shellcode (XOR, ROT13, alpha-numeric)',
            'Exploit kit signatures: EternalBlue (MS17-010), PrintNightmare (CVE-2021-34527), Log4Shell (CVE-2021-44228), ProxyLogon',
            'C2 framework fingerprinting: Cobalt Strike malleable profiles, Metasploit Meterpreter, Empire, Sliver, Havoc beacons',
            'Living-off-the-Land Binary (LOLBin) abuse detection: suspicious use of certutil, mshta, regsvr32, rundll32',
            'PowerShell and VBA macro obfuscation patterns: -enc, IEX, Invoke-Expression, char concatenation, string reversal',
            'IP/URL/domain extraction with threat intelligence correlation to identify hardcoded C2 infrastructure',
        ],
        howItWorks: [
            'Layer 1 — Byte-pattern scan: Boyer-Moore search for known shellcode signatures (NOP sleds, egg hunters, syscall stubs)',
            'Layer 2 — String extraction & analysis: ASCII/Unicode strings are extracted and matched against C2 indicators, encoded commands, and exploit strings',
            'Layer 3 — Structural analysis: file structure is compared against known framework configurations (e.g., Cobalt Strike beacon configs at specific offsets)',
            'Layer 4 — Behavioral pattern matching: sequences of operations (download → write → execute) are identified across script contents',
            'All matches are correlated with MITRE ATT&CK techniques and assigned severity (Info/Low/Medium/High/Critical)',
        ],
        technicalDetails: 'Pattern matching goes beyond static signatures. For shellcode, we scan for common prologue sequences (\\x55\\x8B\\xEC for x86 function prologues), syscall patterns (\\x0F\\x05 for x64 syscall), and encoded variants using frequency analysis. We then detect NOP sleds (0x90 streams), egg-hunter patterns (searching for 8-byte tags), and API hashing routines (ROR-13 hash loops). For C2 frameworks, we parse Cobalt Strike\'s beacon configuration structure (starting at offset 0x00 with watermark, C2 server, user-agent, and jitter settings). PowerShell obfuscation is detected via entropy analysis of string literals combined with pattern matching for known bypass techniques like AMSI patches and ETW blinding.',
        examples: [
            'Cobalt Strike beacon config — extracted C2 server: hxxps://cdn-update[.]com/pixel.gif, watermark: 426352781, jitter: 37%',
            'Metasploit reverse_tcp shellcode — \\x6A\\x02\\x59\\x68 pattern + embedded LHOST/LPORT at predictable offsets',
            'PowerShell Empire stager — IEX((New-Object Net.WebClient).DownloadString("hxxp://...")) with Base64 layer',
            'EternalBlue exploit payload — SMBv1 buffer overflow targeting srv.sys with embedded DoublePulsar backdoor installer',
        ],
        useCases: [
            'Detecting weaponized Office files (macro-based exploit chains)',
            'Identifying lateral movement tools during incident response investigations',
            'Screening memory dumps and forensic images for injected shellcode or C2 implants',
        ],
    },
    {
        icon: '🛡️',
        title: 'YARA Rules',
        desc: '12 behavioral detection rules',
        color: 'var(--neon-yellow)',
        threatLevel: 'Advanced Behavioral',
        fullDescription: 'YARA (Yet Another Recursive Acronym) is the gold standard for malware classification, used by security teams at Google, CrowdStrike, ESET, and government CERT teams worldwide. Unlike single-pattern matching, YARA rules combine multiple conditions — string patterns, byte sequences, file metadata, PE section properties, and boolean logic — into precise behavioral signatures. Our 12 custom-crafted rules target specific malware families and attack techniques, achieving 96%+ true-positive rates with minimal false alarms.',
        keyFeatures: [
            '12 expert-crafted rules covering: Ransomware, Trojans, RATs, Droppers, Worms, Cryptominers, Rootkits, and APT tools',
            'Multi-condition matching: each rule requires 3–5 indicators to match simultaneously, minimizing false positives',
            'PE metadata conditions: checks for suspicious compilation timestamps, section names, digital signature anomalies',
            'String pattern sets with wildcards and regex: flexible matching adapts to minor variants without full signature updates',
            'File size and magic byte constraints ensure rules target only relevant file types, improving scan performance',
            'Rule severity classification (Informational → Critical) with MITRE ATT&CK technique mapping for each match',
        ],
        howItWorks: [
            'Each YARA rule defines a set of "strings" (hex patterns, text strings, regex) and a boolean "condition" combining them',
            'The YARA engine compiles all 12 rules into an optimized automaton (Aho-Corasick) for efficient multi-pattern matching',
            'The uploaded file is scanned against all rules simultaneously in a single pass through the file content',
            'When a rule matches, all matching strings and their offsets within the file are recorded',
            'Results include the rule name, matched indicators, severity level, malware family, and recommended response actions',
        ],
        technicalDetails: 'Each YARA rule follows the structure: rule NAME { meta: ... strings: $s1 = "..." $s2 = {hex} condition: (uint16(0) == 0x5A4D) and 3 of ($s*) }. Our rules use advanced features like: PE module (pe.imports, pe.sections) for import/section analysis, math module (math.entropy) for inline entropy checks, and filesize constraints. For example, our Ransomware_Generic rule checks for: (1) file encryption API imports (CryptEncrypt, CryptGenKey), (2) ransom note template strings ("Your files have been encrypted", "Bitcoin wallet"), (3) shadow copy deletion commands (vssadmin delete shadows), and (4) file extension enumeration (.doc, .xlsx, .pdf). At least 3 of 4 conditions must match for the rule to trigger.',
        examples: [
            'rule Ransomware_Generic — triggers on: CryptEncrypt import + "bitcoin" string + vssadmin shadow deletion + file extension enumeration (3/4 required)',
            'rule RAT_RemoteAccess — triggers on: reverse shell socket patterns + screenshot API (BitBlt) + keylogger hooks + persistence registry keys',
            'rule CryptoMiner_XMR — triggers on: Stratum protocol strings ("mining.subscribe") + CPU affinity APIs + Monero wallet regex pattern',
            'rule APT_Downloader — triggers on: staged download (URLDownloadToFile) + temp directory execution + anti-sandbox checks (GetTickCount delta)',
        ],
        useCases: [
            'Classifying unknown malware into specific families for threat intelligence reporting',
            'Automated alert generation in SOC pipelines when files match critical YARA rules',
            'Threat hunting: scanning file servers and endpoints for dormant malware matching behavioral IOCs',
        ],
    },
    {
        icon: '🌐',
        title: '72 Engines',
        desc: 'Multi-engine consensus scanning',
        color: 'var(--neon-cyan)',
        threatLevel: 'Consensus Verification',
        fullDescription: 'Multi-engine consensus scanning is the ultimate arbiter of file safety. By aggregating verdicts from 72 independent antivirus and threat detection engines — each with different detection methodologies, signature databases, and heuristic algorithms — we achieve detection confidence that no single engine can match alone. A file flagged by 1 engine might be a false positive; a file flagged by 30+ engines is almost certainly malicious. Our weighted scoring system accounts for each engine\'s historical accuracy to deliver a calibrated threat score from 0 (certainly clean) to 100 (confirmed malicious).',
        keyFeatures: [
            '72 independent engines including signature-based (Avira, ClamAV), heuristic (Kaspersky, ESET), and ML-based (CrowdStrike, SentinelOne)',
            'Weighted consensus algorithm: engines are scored by historical precision/recall, so top-performers influence the final verdict more',
            'Engine-specific malware family names aggregated and clustered to identify the most common classification',
            'Parallel analysis: all 72 engines process the file simultaneously, delivering full results in 30–90 seconds',
            'False positive suppression: files flagged by only 1–2 low-accuracy engines are de-prioritized to reduce alert fatigue',
            'Threat name normalization: different vendor names (e.g., "Trojan.Gen.2", "Mal/Trojan-X", "TR/Crypt.XPACK") are mapped to unified family names',
        ],
        howItWorks: [
            'The uploaded file is submitted to 72 detection engines running in isolated sandboxed environments',
            'Each engine independently classifies the file as Clean, Suspicious, or Malicious and provides a threat name if detected',
            'Raw detection count is computed: X out of 72 engines flagged the file',
            'Weighted score is computed: each engine\'s vote is multiplied by its reliability weight (based on historical F1 score)',
            'Threat names from all detecting engines are clustered to identify the consensus malware family classification',
            'Final threat score (0–100) is derived from the weighted detection ratio, adjusted for engine agreement consistency',
        ],
        technicalDetails: 'The consensus algorithm uses a modified Dempster-Shafer evidence theory to combine independent engine verdicts. Each engine\'s weight is calibrated quarterly based on true-positive rate, false-positive rate, and F1 score against a curated test set. The scoring formula: Threat_Score = Σ(w_i × d_i) / Σ(w_i) × 100, where w_i is the engine weight and d_i is 1 (detected) or 0 (clean). Detection thresholds: 0–15 = Clean, 16–40 = Suspicious (review recommended), 41–70 = Likely Malicious, 71–100 = Confirmed Malicious. Engine agreement consistency (measured by Fleiss\' kappa) is factored in — high agreement boosts confidence, while disagreement triggers additional analysis.',
        examples: [
            'Clean file: 0/72 engines detected → Score 0 — file is safe to use with extremely high confidence',
            'Adware: 8/72 engines detected (low-weight heuristic engines) → Score 22 — Suspicious, may contain PUA/adware',
            'Trojan: 47/72 engines detected → Score 91 — Confirmed Malicious, identified as "Trojan.GenericKD" family by consensus',
            'APT malware: 3/72 engines detected (high-weight ML engines only) → Score 58 — Likely Malicious, advanced threat evading signature-based engines',
        ],
        useCases: [
            'Final verification layer after all other analysis engines have provided their individual assessments',
            'Adjudicating borderline files: when internal analysis is inconclusive, consensus provides the tiebreaker',
            'Generating compliance-ready threat reports with multi-vendor corroboration for auditing and legal purposes',
        ],
    },
];

export default function ScannerHome() {
    const [stats, setStats] = useState<ScanStats | null>(null);
    const [selectedCapability, setSelectedCapability] = useState<CapabilityDetail | null>(null);


    useEffect(() => {
        getScanStats().then(setStats);
    }, []);

    // Close modal on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedCapability(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="scanner-root scanner-bg" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="scan-line-overlay" />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '5rem', flex: 1, width: '100%' }}>
                {/* Header */}
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

                {/* Scanner Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {/* File Scanner Card */}
                    <Link to="/scanner/file" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <FileSearch className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>File Scanner</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>Upload & analyze files</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['Hash Matching', 'Entropy Analysis', 'PE Analysis', 'Pattern Matching', 'YARA Rules', 'PDF Reports'].map(f => (
                                    <span key={f} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{f}</span>
                                ))}
                            </div>
                        </div>
                    </Link>

                    {/* URL Scanner Card */}
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
                                {['72 Engines', 'Domain Check', 'Phishing Detection', 'TLD Analysis', 'Pattern Matching', 'Brand Detection'].map(f => (
                                    <span key={f} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{f}</span>
                                ))}
                            </div>
                        </div>
                    </Link>

                    {/* History Card */}
                    <Link to="/scanner/history" style={{ textDecoration: 'none' }}>
                        <div className="cyber-card" style={{ padding: '2rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                    <History className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-500" style={{ margin: 0 }}>Scan History</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>View past results & stats</p>
                                </div>
                                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--cyber-muted)' }} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['SQLite Storage', 'Stats Dashboard', 'Scan Timeline', 'Export Data', 'Threat Trends'].map(f => (
                                    <span key={f} className="text-[11px] px-2 py-1 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">{f}</span>
                                ))}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Stats */}
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

                {/* Detection Capabilities Grid - CLICKABLE */}
                <div style={{ marginTop: '2rem', display: 'none' }}>
                    <h2 style={{ fontSize: '1.1rem', color: 'var(--cyber-text)', marginBottom: '0.5rem' }}>Detection Capabilities</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)', marginBottom: '1rem' }}>
                        Click on any capability to learn more about how it works
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                        {capabilities.map((f, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedCapability(f)}
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    padding: '14px 16px',
                                    background: 'var(--cyber-card)',
                                    borderRadius: 10,
                                    border: '1px solid var(--cyber-border)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.3s ease',
                                    width: '100%',
                                    alignItems: 'center',
                                }}
                                className="capability-card"
                            >
                                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyber-text)' }}>{f.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--cyber-muted)' }}>{f.desc}</div>
                                </div>
                                <ArrowRight size={16} style={{ color: 'var(--cyber-muted)', flexShrink: 0, transition: 'all 0.3s ease' }} className="capability-arrow" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ========== CAPABILITY DETAIL MODAL ========== */}
            {selectedCapability && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: '1rem',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                    onClick={() => setSelectedCapability(null)}
                >
                    <div
                        style={{
                            background: 'var(--cyber-surface)',
                            border: `1px solid ${selectedCapability.color}33`,
                            borderRadius: 16,
                            maxWidth: 640,
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            position: 'relative',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: `0 0 60px ${selectedCapability.color}15, 0 25px 50px rgba(0,0,0,0.5)`,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top glow line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                            background: `linear-gradient(90deg, transparent, ${selectedCapability.color}, transparent)`,
                            borderRadius: '16px 16px 0 0',
                        }} />

                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            padding: '1.5rem 1.5rem 0 1.5rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 14,
                                    background: `${selectedCapability.color}15`,
                                    border: `1px solid ${selectedCapability.color}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem',
                                }}>
                                    {selectedCapability.icon}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: selectedCapability.color }}>
                                        {selectedCapability.title}
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cyber-muted)' }}>
                                        {selectedCapability.desc}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCapability(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--cyber-border)',
                                    borderRadius: 8, padding: 6, cursor: 'pointer',
                                    color: 'var(--cyber-muted)', transition: 'all 0.2s',
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyber-text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--cyber-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem' }}>
                            {/* Threat Level Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                                <Target size={14} style={{ color: selectedCapability.color }} />
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                                    padding: '4px 12px', borderRadius: 20,
                                    background: `${selectedCapability.color}12`,
                                    border: `1px solid ${selectedCapability.color}30`,
                                    color: selectedCapability.color,
                                }}>
                                    {selectedCapability.threatLevel}
                                </span>
                            </div>

                            {/* Description */}
                            <div style={{
                                padding: '1rem 1.25rem', borderRadius: 10,
                                background: `${selectedCapability.color}08`,
                                border: `1px solid ${selectedCapability.color}18`,
                                marginBottom: '1.5rem',
                            }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--cyber-text)' }}>
                                    {selectedCapability.fullDescription}
                                </p>
                            </div>

                            {/* Key Features */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCapability.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle size={14} /> Key Features
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedCapability.keyFeatures.map((feature, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                                                background: selectedCapability.color,
                                                boxShadow: `0 0 6px ${selectedCapability.color}`,
                                            }} />
                                            <span style={{ fontSize: '0.83rem', color: 'var(--cyber-text)', lineHeight: 1.55 }}>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* How It Works — Step by Step */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCapability.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Cpu size={14} /> How It Works
                                </h3>
                                <div style={{
                                    padding: '1rem 1.25rem', borderRadius: 10,
                                    background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)',
                                    position: 'relative',
                                }}>
                                    {/* Vertical connector line */}
                                    <div style={{
                                        position: 'absolute', left: '2.05rem', top: '1.5rem', bottom: '1.5rem',
                                        width: 1, background: `${selectedCapability.color}30`,
                                    }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {selectedCapability.howItWorks.map((step, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', zIndex: 1 }}>
                                                <span style={{
                                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.65rem', fontWeight: 800,
                                                    background: `${selectedCapability.color}20`,
                                                    border: `1px solid ${selectedCapability.color}50`,
                                                    color: selectedCapability.color,
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.82rem', color: 'var(--cyber-text)', lineHeight: 1.55,
                                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                    paddingTop: 2,
                                                }}>
                                                    {step}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Technical Deep Dive */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCapability.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Info size={14} /> Technical Deep Dive
                                </h3>
                                <div style={{
                                    padding: '1rem 1.25rem', borderRadius: 10,
                                    background: `linear-gradient(135deg, ${selectedCapability.color}06, transparent)`,
                                    border: `1px solid ${selectedCapability.color}15`,
                                    borderLeft: `3px solid ${selectedCapability.color}60`,
                                }}>
                                    <p style={{
                                        margin: 0, fontSize: '0.82rem', lineHeight: 1.75, color: 'var(--cyber-text)',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    }}>
                                        {selectedCapability.technicalDetails}
                                    </p>
                                </div>
                            </div>

                            {/* Real-World Detections */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCapability.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Shield size={14} /> Real-World Detections
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {selectedCapability.examples.map((example, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '10px 14px', borderRadius: 8,
                                            background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)',
                                            transition: 'all 0.2s ease',
                                        }}>
                                            <span style={{
                                                color: selectedCapability.color, fontWeight: 800, fontSize: '0.7rem',
                                                marginTop: 2, flexShrink: 0,
                                                width: 20, height: 20, borderRadius: 4,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: `${selectedCapability.color}15`,
                                            }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span style={{
                                                fontSize: '0.8rem', color: 'var(--cyber-text)', lineHeight: 1.55,
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            }}>
                                                {example}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* When To Use */}
                            <div>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCapability.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BookOpen size={14} /> When To Use
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedCapability.useCases.map((useCase, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                            <ArrowRight size={14} style={{ color: selectedCapability.color, marginTop: 3, flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.83rem', color: 'var(--cyber-text)', lineHeight: 1.55 }}>{useCase}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--cyber-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--cyber-muted)' }}>
                                Press <kbd style={{
                                    padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem',
                                    background: 'var(--cyber-card)', border: '1px solid var(--cyber-border)',
                                    color: 'var(--cyber-text)',
                                }}>ESC</kbd> to close
                            </span>
                            <Link
                                to="/scanner/file"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 8,
                                    background: `${selectedCapability.color}15`,
                                    border: `1px solid ${selectedCapability.color}30`,
                                    color: selectedCapability.color,
                                    fontSize: '0.8rem', fontWeight: 600,
                                    textDecoration: 'none', transition: 'all 0.3s',
                                }}
                            >
                                Try Scanner
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
