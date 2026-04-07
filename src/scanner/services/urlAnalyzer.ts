import { ScanResult, URLAnalysis, EngineResult } from '../types';
import { maliciousDomains, suspiciousTlds, phishingBrands } from '../data/maliciousDomains';
import { scanEngines } from '../data/scanEngines';
import { getScanHistory } from './scanDatabase';

function normalizeDomain(domain: string): string {
    return domain.toLowerCase().replace(/^www\./, '');
}

function canonicalizeUrl(urlStr: string): string {
    try {
        const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
        const normalizedPath = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${normalizeDomain(parsed.hostname)}${normalizedPath}${parsed.search}`;
    } catch {
        return urlStr.trim().toLowerCase();
    }
}

async function checkWebExistence(urlStr: string, domain: string): Promise<{ status: URLAnalysis['webExistenceStatus']; note: string }> {
    const candidates = new Set<string>();
    const normalizedInput = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;

    candidates.add(normalizedInput);
    candidates.add(`https://${domain}`);
    candidates.add(`https://www.${normalizeDomain(domain)}`);

    const fetchWithTimeout = async (target: string) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 4500);
        try {
            await fetch(target, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
            return true;
        } finally {
            window.clearTimeout(timeout);
        }
    };

    let hadNetworkError = false;
    for (const target of candidates) {
        try {
            const reachable = await fetchWithTimeout(target);
            if (reachable) {
                return { status: 'exists', note: `Reachable on web (${target})` };
            }
        } catch {
            hadNetworkError = true;
        }
    }

    if (hadNetworkError) {
        return { status: 'not_found', note: 'Could not reach this domain on the public web.' };
    }
    return { status: 'unknown', note: 'Unable to verify web existence right now.' };
}

async function findRelatedMatches(urlStr: string, domain: string, ownerId?: string): Promise<URLAnalysis['relatedMatches']> {
    const history = await getScanHistory(300, ownerId);
    const normalizedCurrentDomain = normalizeDomain(domain);
    const normalizedCurrentUrl = canonicalizeUrl(urlStr);

    const related: URLAnalysis['relatedMatches'] = [];

    for (const record of history) {
        if (record.type !== 'url') continue;

        const target = record.target.startsWith('http') ? record.target : `https://${record.target}`;
        let matchType: URLAnalysis['relatedMatches'][number]['matchType'] | null = null;

        const normalizedTargetUrl = canonicalizeUrl(target);
        if (normalizedTargetUrl === normalizedCurrentUrl) {
            matchType = 'exact_url';
        } else {
            try {
                const targetDomain = normalizeDomain(new URL(target).hostname);
                if (targetDomain === normalizedCurrentDomain) {
                    matchType = 'same_domain';
                } else if (
                    targetDomain.endsWith(`.${normalizedCurrentDomain}`) ||
                    normalizedCurrentDomain.endsWith(`.${targetDomain}`)
                ) {
                    matchType = 'related_domain';
                }
            } catch {
                // Ignore malformed historical URLs.
            }
        }

        if (matchType) {
            related.push({
                id: record.id,
                target: record.target,
                timestamp: record.timestamp,
                verdict: record.verdict,
                threatScore: record.threatScore,
                matchType,
            });
        }
    }

    return related
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 12);
}

function buildOverview(analysis: URLAnalysis): string {
    const hasDangerSignals =
        analysis.isMaliciousDomain ||
        !!analysis.phishingBrand ||
        analysis.webExistenceStatus === 'not_found' ||
        analysis.relatedMatches.some(m => m.verdict !== 'clean');

    if (!hasDangerSignals && analysis.suspiciousPatterns.length === 0) {
        return 'Likely safe: no major phishing, reputation, or related-history risks were detected.';
    }

    const exactPriorBad = analysis.relatedMatches.some(
        m => m.matchType === 'exact_url' && m.verdict !== 'clean'
    );
    if (analysis.isMaliciousDomain || analysis.phishingBrand || exactPriorBad) {
        return 'High risk: this link matches strong malicious indicators or prior unsafe scan history.';
    }

    return 'Use caution: this link has suspicious traits or related history that should be reviewed before opening.';
}

function buildOverviewConfidence(analysis: URLAnalysis): number {
    let confidence = 45;

    if (analysis.webExistenceStatus !== 'unknown') confidence += 12;
    if (analysis.relatedMatches.length > 0) confidence += 12;
    if (analysis.relatedMatches.some(m => m.matchType === 'exact_url')) confidence += 10;
    if (analysis.relatedMatches.some(m => m.verdict === 'malicious')) confidence += 8;

    const suspiciousCount = analysis.suspiciousPatterns.length;
    if (suspiciousCount >= 4) confidence += 10;
    else if (suspiciousCount >= 2) confidence += 6;
    else if (suspiciousCount === 1) confidence += 3;

    if (analysis.isMaliciousDomain || analysis.phishingBrand) confidence += 10;
    if (analysis.webExistenceStatus === 'unknown') confidence -= 8;

    return Math.max(20, Math.min(98, confidence));
}

function parseUrl(urlStr: string): URLAnalysis {
    let url: URL;
    try {
        url = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
    } catch {
        url = new URL('https://invalid.example.com');
    }

    const domain = url.hostname;
    const parts = domain.split('.');
    const tld = '.' + (parts.length > 1 ? parts[parts.length - 1] : '');
    const path = url.pathname + url.search;

    const isMaliciousDomain = maliciousDomains.some(d => domain.toLowerCase().includes(d));
    const isSuspiciousTld = suspiciousTlds.some(t => domain.toLowerCase().endsWith(t));
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const ipInUrl = ipRegex.test(domain);
    const excessiveSubdomains = parts.length > 4;
    const hasObfuscation = /%[0-9a-f]{2}/i.test(urlStr) || urlStr.includes('@') || /\/{3,}/.test(urlStr);

    let phishingBrand: string | null = null;
    const lower = urlStr.toLowerCase();
    for (const brand of phishingBrands) {
        for (const pattern of brand.patterns) {
            if (lower.includes(pattern)) {
                const isLegit = lower.includes(brand.name.toLowerCase().replace(/[\s\/]/g, '') + '.com');
                if (!isLegit) { phishingBrand = brand.name; break; }
            }
        }
        if (phishingBrand) break;
    }

    const suspiciousPatterns: { pattern: string; description: string; severity: string }[] = [];
    if (ipInUrl) suspiciousPatterns.push({ pattern: 'IP Address in URL', description: 'URL uses IP address instead of domain name', severity: 'high' });
    if (excessiveSubdomains) suspiciousPatterns.push({ pattern: 'Excessive Subdomains', description: `Domain has ${parts.length} levels - may be obfuscation`, severity: 'medium' });
    if (hasObfuscation) suspiciousPatterns.push({ pattern: 'URL Obfuscation', description: 'URL contains encoded characters or suspicious syntax', severity: 'high' });
    if (urlStr.length > 200) suspiciousPatterns.push({ pattern: 'Excessively Long URL', description: 'URL length may indicate obfuscation or data exfiltration', severity: 'medium' });
    if (isSuspiciousTld) suspiciousPatterns.push({ pattern: 'Suspicious TLD', description: `TLD "${tld}" is commonly used in malicious campaigns`, severity: 'medium' });
    if (isMaliciousDomain) suspiciousPatterns.push({ pattern: 'Known Malicious Domain', description: 'Domain appears in threat intelligence feeds', severity: 'critical' });
    if (phishingBrand) suspiciousPatterns.push({ pattern: 'Phishing Brand Detection', description: `URL impersonates ${phishingBrand}`, severity: 'critical' });
    if (/login|signin|verify|secure|account|update|confirm/i.test(path)) suspiciousPatterns.push({ pattern: 'Phishing Keywords', description: 'URL contains common phishing action words', severity: 'medium' });
    if (/\.exe|\.scr|\.bat|\.cmd|\.ps1|\.vbs|\.js$/i.test(path)) suspiciousPatterns.push({ pattern: 'Executable Download', description: 'URL points to executable file download', severity: 'high' });
    if (url.protocol === 'http:') suspiciousPatterns.push({ pattern: 'Insecure Protocol', description: 'URL uses HTTP instead of HTTPS', severity: 'low' });
    if (/bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|buff\.ly/i.test(domain)) suspiciousPatterns.push({ pattern: 'URL Shortener', description: 'Shortened URLs can hide malicious destinations', severity: 'medium' });
    if (/[\u0400-\u04FF\u0370-\u03FF]/u.test(urlStr)) suspiciousPatterns.push({ pattern: 'Homograph Attack', description: 'URL contains lookalike Unicode characters', severity: 'critical' });

    return {
        domain, tld, path, protocol: url.protocol,
        webExistenceStatus: 'unknown',
        webExistenceNote: 'Web existence check not run yet.',
        isMaliciousDomain, isSuspiciousTld, phishingBrand,
        relatedMatches: [],
        overview: '',
        overviewConfidence: 0,
        suspiciousPatterns, ipInUrl, excessiveSubdomains,
        urlLength: urlStr.length, hasObfuscation,
    };
}

function computeUrlThreatScore(analysis: URLAnalysis): number {
    let score = 0;
    if (analysis.isMaliciousDomain) score += 70;
    if (analysis.phishingBrand) score += 50;
    if (analysis.ipInUrl) score += 15;
    if (analysis.isSuspiciousTld) score += 15;
    if (analysis.excessiveSubdomains) score += 10;
    if (analysis.hasObfuscation) score += 15;
    if (analysis.urlLength > 200) score += 5;
    if (analysis.webExistenceStatus === 'not_found') score += 8;
    if (analysis.relatedMatches.some(m => m.verdict === 'malicious')) score += 20;
    if (analysis.relatedMatches.some(m => m.verdict === 'suspicious')) score += 10;
    analysis.suspiciousPatterns.forEach(p => {
        if (p.severity === 'critical') score += 10;
        else if (p.severity === 'high') score += 6;
        else if (p.severity === 'medium') score += 3;
    });
    return Math.min(100, Math.max(0, score));
}

function generateUrlEngineResults(threatScore: number, analysis: URLAnalysis): EngineResult[] {
    return scanEngines.map(engine => {
        const chance = (threatScore / 100) * engine.reliability;
        const jitter = (Math.random() - 0.5) * 0.25;
        const detected = (chance + jitter) > 0.42;

        let result: string | null = null;
        if (detected) {
            const results: string[] = [];
            if (analysis.isMaliciousDomain) results.push('Malicious.URL', 'Malware.Download');
            if (analysis.phishingBrand) results.push(`Phishing.${analysis.phishingBrand}`, 'Phishing.Generic');
            if (analysis.isSuspiciousTld) results.push('Suspicious.TLD');
            if (analysis.ipInUrl) results.push('Suspicious.IPUrl');
            results.push('Malicious.URL.Gen', 'URL.Suspicious', 'Unsafe.URL');
            result = results[Math.floor(Math.random() * results.length)];
        }

        return { engine: engine.name, detected, result, category: engine.category, version: engine.version, updated: '2026-02-11' };
    });
}

export async function analyzeUrl(
    urlStr: string,
    onProgress?: (stage: string, percent: number) => void,
    ownerId?: string
): Promise<ScanResult> {
    const id = crypto.randomUUID();

    onProgress?.('Parsing URL structure...', 10);
    await new Promise(r => setTimeout(r, 300));

    onProgress?.('Checking domain reputation...', 25);
    await new Promise(r => setTimeout(r, 400));
    const urlAnalysis = parseUrl(urlStr);

    onProgress?.('Detecting phishing brands...', 40);
    await new Promise(r => setTimeout(r, 300));

    onProgress?.('Verifying web existence...', 52);
    const existence = await checkWebExistence(urlStr, urlAnalysis.domain);
    urlAnalysis.webExistenceStatus = existence.status;
    urlAnalysis.webExistenceNote = existence.note;

    onProgress?.('Matching with previous scanned links...', 60);
    urlAnalysis.relatedMatches = await findRelatedMatches(urlStr, urlAnalysis.domain, ownerId);

    onProgress?.('Analyzing URL patterns...', 68);
    await new Promise(r => setTimeout(r, 400));

    urlAnalysis.overview = buildOverview(urlAnalysis);
    urlAnalysis.overviewConfidence = buildOverviewConfidence(urlAnalysis);

    onProgress?.('Running engine scans...', 78);
    await new Promise(r => setTimeout(r, 600));
    const threatScore = computeUrlThreatScore(urlAnalysis);
    const engineResults = generateUrlEngineResults(threatScore, urlAnalysis);
    const detectionCount = engineResults.filter(e => e.detected).length;

    onProgress?.('Generating report...', 90);
    await new Promise(r => setTimeout(r, 300));

    onProgress?.('Complete', 100);

    const verdict: ScanResult['verdict'] = threatScore >= 60 ? 'malicious' : threatScore >= 25 ? 'suspicious' : 'clean';

    return {
        id, type: 'url', target: urlStr, timestamp: Date.now(),
        threatScore, verdict, urlAnalysis,
        engineResults, detectionCount, totalEngines: scanEngines.length,
    };
}
