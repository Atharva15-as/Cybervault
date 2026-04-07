// Core types for CyberVault Scanner Module

export interface FileHashes {
    md5: string;
    sha1: string;
    sha256: string;
}

export interface EntropyResult {
    value: number;
    assessment: 'normal' | 'packed' | 'encrypted' | 'compressed';
    description: string;
}

export interface PESection {
    name: string;
    entropy: number;
    size: number;
    suspicious: boolean;
}

export interface PEAnalysisResult {
    isPE: boolean;
    suspiciousImports: { name: string; category: string; risk: string }[];
    sections: PESection[];
    importCount: number;
    suspiciousCount: number;
}

export interface PatternMatch {
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    offset?: number;
    matched: string;
}

export interface YaraMatch {
    rule: string;
    description: string;
    tags: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    meta: Record<string, string>;
}

export interface EngineResult {
    engine: string;
    detected: boolean;
    result: string | null;
    category: string;
    version: string;
    updated: string;
}

export interface URLAnalysis {
    domain: string;
    tld: string;
    path: string;
    protocol: string;
    webExistenceStatus: 'exists' | 'not_found' | 'unknown';
    webExistenceNote: string;
    isMaliciousDomain: boolean;
    isSuspiciousTld: boolean;
    phishingBrand: string | null;
    suspiciousPatterns: { pattern: string; description: string; severity: string }[];
    relatedMatches: {
        id: string;
        target: string;
        timestamp: number;
        verdict: 'clean' | 'suspicious' | 'malicious';
        threatScore: number;
        matchType: 'exact_url' | 'same_domain' | 'related_domain';
    }[];
    overview: string;
    overviewConfidence: number;
    ipInUrl: boolean;
    excessiveSubdomains: boolean;
    urlLength: number;
    hasObfuscation: boolean;
}

export interface ScanResult {
    id: string;
    type: 'file' | 'url';
    target: string;
    timestamp: number;
    threatScore: number;
    verdict: 'clean' | 'suspicious' | 'malicious';

    // File-specific
    fileSize?: number;
    fileType?: string;
    hashes?: FileHashes;
    entropy?: EntropyResult;
    peAnalysis?: PEAnalysisResult;
    patternMatches?: PatternMatch[];
    yaraMatches?: YaraMatch[];

    // URL-specific
    urlAnalysis?: URLAnalysis;

    // Common
    engineResults: EngineResult[];
    detectionCount: number;
    totalEngines: number;
}

export interface ScanHistoryRecord {
    id: string;
    ownerId?: string;
    type: 'file' | 'url';
    target: string;
    timestamp: number;
    threatScore: number;
    verdict: 'clean' | 'suspicious' | 'malicious';
    detectionCount: number;
    totalEngines: number;
    fileSize?: number;
    hashes?: FileHashes;
}

export interface ScanStats {
    totalScans: number;
    fileScans: number;
    urlScans: number;
    threatsFound: number;
    cleanScans: number;
    suspiciousScans: number;
    maliciousScans: number;
    averageThreatScore: number;
    scansByDay: { date: string; count: number }[];
    verdictDistribution: { verdict: string; count: number }[];
}
