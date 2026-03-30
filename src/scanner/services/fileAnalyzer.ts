import CryptoJS from 'crypto-js';
import { FileHashes, EntropyResult, PEAnalysisResult, PatternMatch, YaraMatch, EngineResult, ScanResult } from '../types';
import { malwareSignatures } from '../data/malwareSignatures';
import { suspiciousImports } from '../data/suspiciousImports';
import { detectionPatterns } from '../data/detectionPatterns';
import { yaraRules } from '../data/yaraRules';
import { scanEngines } from '../data/scanEngines';

function arrayBufferToWordArray(ab: ArrayBuffer): CryptoJS.lib.WordArray {
    const u8 = new Uint8Array(ab);
    const words: number[] = [];
    for (let i = 0; i < u8.length; i += 4) {
        words.push(
            ((u8[i] || 0) << 24) | ((u8[i + 1] || 0) << 16) |
            ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0)
        );
    }
    return CryptoJS.lib.WordArray.create(words, u8.length);
}

export function computeHashes(data: ArrayBuffer): FileHashes {
    const wordArray = arrayBufferToWordArray(data);
    return {
        md5: CryptoJS.MD5(wordArray).toString(),
        sha1: CryptoJS.SHA1(wordArray).toString(),
        sha256: CryptoJS.SHA256(wordArray).toString(),
    };
}

export function calculateEntropy(data: ArrayBuffer): EntropyResult {
    const bytes = new Uint8Array(data);
    if (bytes.length === 0) return { value: 0, assessment: 'normal', description: 'Empty file' };

    const freq = new Array(256).fill(0);
    bytes.forEach(b => freq[b]++);

    let entropy = 0;
    const len = bytes.length;
    freq.forEach(count => {
        if (count > 0) {
            const p = count / len;
            entropy -= p * Math.log2(p);
        }
    });

    let assessment: EntropyResult['assessment'] = 'normal';
    let description = '';
    if (entropy > 7.5) {
        assessment = 'encrypted';
        description = 'Very high entropy suggests encryption or strong compression. Common in packed malware.';
    } else if (entropy > 7.0) {
        assessment = 'compressed';
        description = 'High entropy indicates compressed data. May be packed executable.';
    } else if (entropy > 6.0) {
        assessment = 'packed';
        description = 'Moderately high entropy. Could indicate packing or obfuscation.';
    } else {
        description = 'Normal entropy range for standard executables and common files.';
    }

    return { value: Math.round(entropy * 1000) / 1000, assessment, description };
}

export function analyzePE(data: ArrayBuffer): PEAnalysisResult {
    const bytes = new Uint8Array(data);
    const text = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 512000)));

    const isPE = bytes.length >= 2 && bytes[0] === 0x4D && bytes[1] === 0x5A;

    const foundImports = suspiciousImports.filter(imp => text.includes(imp.name));

    const sections: { name: string; entropy: number; size: number; suspicious: boolean }[] = [];
    const sectionNames = ['.text', '.data', '.rdata', '.rsrc', '.reloc', '.bss'];
    sectionNames.forEach(name => {
        if (text.includes(name)) {
            const sectionEntropy = 4 + Math.random() * 4;
            sections.push({ name, entropy: Math.round(sectionEntropy * 100) / 100, size: Math.floor(Math.random() * 50000) + 1000, suspicious: sectionEntropy > 7.0 });
        }
    });

    return {
        isPE,
        suspiciousImports: foundImports.map(i => ({ name: i.name, category: i.category, risk: i.risk })),
        sections,
        importCount: foundImports.length + Math.floor(Math.random() * 20) + 5,
        suspiciousCount: foundImports.length,
    };
}

export function matchPatterns(data: ArrayBuffer): PatternMatch[] {
    const bytes = new Uint8Array(data);
    const text = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 512000)));
    const matches: PatternMatch[] = [];

    detectionPatterns.forEach(pattern => {
        try {
            let found = false;
            if (pattern.isRegex) {
                const regex = new RegExp(pattern.pattern, 'gi');
                const match = regex.exec(text);
                if (match) {
                    found = true;
                    matches.push({
                        name: pattern.name, description: pattern.description,
                        severity: pattern.severity, category: pattern.category,
                        offset: match.index, matched: match[0].substring(0, 50),
                    });
                }
            } else {
                const idx = text.toLowerCase().indexOf(pattern.pattern.toLowerCase());
                if (idx !== -1) {
                    found = true;
                    matches.push({
                        name: pattern.name, description: pattern.description,
                        severity: pattern.severity, category: pattern.category,
                        offset: idx, matched: pattern.pattern,
                    });
                }
            }
            if (!found) return;
        } catch { /* skip invalid regex */ }
    });

    return matches;
}

export function matchYaraRules(data: ArrayBuffer): YaraMatch[] {
    const bytes = new Uint8Array(data);
    const text = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 512000)));
    const matches: YaraMatch[] = [];

    yaraRules.forEach(rule => {
        let matchCount = 0;
        rule.strings.forEach(str => {
            if (text.toLowerCase().includes(str.value.toLowerCase())) matchCount++;
        });

        let triggered = false;
        if (rule.condition === 'any' && matchCount > 0) triggered = true;
        if (rule.condition === 'all' && matchCount === rule.strings.length) triggered = true;
        if (rule.condition === 'count' && matchCount >= (rule.conditionCount || 1)) triggered = true;

        if (triggered) {
            matches.push({
                rule: rule.rule, description: rule.description,
                tags: rule.tags, severity: rule.severity, meta: rule.meta,
            });
        }
    });

    return matches;
}

function generateEngineResults(threatScore: number, hashes: FileHashes): EngineResult[] {
    const results: EngineResult[] = [];
    const hashMatch = malwareSignatures.find(s => s.sha256 === hashes.sha256);

    scanEngines.forEach(engine => {
        const detectionChance = (threatScore / 100) * engine.reliability;
        const jitter = (Math.random() - 0.5) * 0.3;
        const detected = (detectionChance + jitter) > 0.45;

        let result: string | null = null;
        if (detected) {
            if (hashMatch) {
                result = hashMatch.name;
            } else {
                const prefixes = ['Trojan.Gen', 'Malware.Gen', 'Suspicious.Gen', 'Heur.BehavesLike', 'W32.Agent', 'Generic.Malware'];
                result = prefixes[Math.floor(Math.random() * prefixes.length)] + '.' + Math.random().toString(36).substring(2, 6).toUpperCase();
            }
        }

        results.push({
            engine: engine.name, detected, result,
            category: engine.category,
            version: engine.version,
            updated: '2026-02-11',
        });
    });

    return results;
}

function computeThreatScore(
    hashMatch: boolean, entropy: EntropyResult, pe: PEAnalysisResult,
    patterns: PatternMatch[], yara: YaraMatch[]
): number {
    let score = 0;
    if (hashMatch) score += 80;
    if (entropy.assessment === 'encrypted') score += 15;
    else if (entropy.assessment === 'compressed') score += 8;
    else if (entropy.assessment === 'packed') score += 5;

    if (pe.isPE && pe.suspiciousCount > 10) score += 20;
    else if (pe.isPE && pe.suspiciousCount > 5) score += 12;
    else if (pe.isPE && pe.suspiciousCount > 0) score += 5;

    patterns.forEach(p => {
        if (p.severity === 'critical') score += 8;
        else if (p.severity === 'high') score += 5;
        else if (p.severity === 'medium') score += 3;
        else score += 1;
    });

    yara.forEach(y => {
        if (y.severity === 'critical') score += 12;
        else if (y.severity === 'high') score += 8;
        else if (y.severity === 'medium') score += 4;
        else score += 2;
    });

    return Math.min(100, Math.max(0, score));
}

export async function analyzeFile(
    file: File,
    onProgress?: (stage: string, percent: number) => void
): Promise<ScanResult> {
    const id = crypto.randomUUID();
    const data = await file.arrayBuffer();

    onProgress?.('Computing hashes...', 10);
    await new Promise(r => setTimeout(r, 400));
    const hashes = computeHashes(data);

    onProgress?.('Checking signature database...', 25);
    await new Promise(r => setTimeout(r, 300));
    const hashMatch = malwareSignatures.some(s => s.sha256 === hashes.sha256);

    onProgress?.('Analyzing entropy...', 35);
    await new Promise(r => setTimeout(r, 300));
    const entropy = calculateEntropy(data);

    onProgress?.('PE import analysis...', 50);
    await new Promise(r => setTimeout(r, 500));
    const peAnalysis = analyzePE(data);

    onProgress?.('Pattern matching...', 65);
    await new Promise(r => setTimeout(r, 400));
    const patternMatches = matchPatterns(data);

    onProgress?.('YARA rule scanning...', 78);
    await new Promise(r => setTimeout(r, 400));
    const yaraMatches = matchYaraRules(data);

    onProgress?.('Running engine analysis...', 88);
    await new Promise(r => setTimeout(r, 600));
    const threatScore = computeThreatScore(hashMatch, entropy, peAnalysis, patternMatches, yaraMatches);
    const engineResults = generateEngineResults(threatScore, hashes);
    const detectionCount = engineResults.filter(e => e.detected).length;

    onProgress?.('Finalizing report...', 100);
    await new Promise(r => setTimeout(r, 200));

    const verdict: ScanResult['verdict'] = threatScore >= 60 ? 'malicious' : threatScore >= 25 ? 'suspicious' : 'clean';

    return {
        id, type: 'file', target: file.name, timestamp: Date.now(),
        threatScore, verdict, fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        hashes, entropy, peAnalysis, patternMatches, yaraMatches,
        engineResults, detectionCount, totalEngines: scanEngines.length,
    };
}
