import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanResult } from '../types';

export function generatePdfReport(result: ScanResult): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(0, 255, 245);
    doc.setFontSize(22);
    doc.text('CYBERVAULT THREAT REPORT', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 170);
    doc.text(`Generated: ${new Date(result.timestamp).toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Report ID: ${result.id}`, pageWidth / 2, 34, { align: 'center' });

    let y = 50;

    // Verdict Banner
    const verdictColors: Record<string, [number, number, number]> = {
        clean: [0, 200, 80], suspicious: [255, 180, 0], malicious: [255, 50, 50],
    };
    const vc = verdictColors[result.verdict] || [150, 150, 150];
    doc.setFillColor(vc[0], vc[1], vc[2]);
    doc.roundedRect(14, y, pageWidth - 28, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`VERDICT: ${result.verdict.toUpperCase()}  |  Threat Score: ${result.threatScore}/100  |  Detections: ${result.detectionCount}/${result.totalEngines}`, pageWidth / 2, y + 13, { align: 'center' });
    y += 30;

    // Target Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('SCAN SUMMARY', 14, y);
    y += 6;

    const summaryData = [
        ['Type', result.type.toUpperCase()],
        ['Target', result.target],
    ];
    if (result.type === 'file') {
        summaryData.push(['File Size', `${((result.fileSize || 0) / 1024).toFixed(2)} KB`]);
        summaryData.push(['File Type', result.fileType || 'Unknown']);
    }
    autoTable(doc, {
        startY: y, head: [['Property', 'Value']], body: summaryData,
        theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [0, 255, 245] },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // File Hashes
    if (result.hashes) {
        doc.setFontSize(12);
        doc.text('FILE HASHES', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y, head: [['Algorithm', 'Hash']], body: [
                ['MD5', result.hashes.md5], ['SHA-1', result.hashes.sha1], ['SHA-256', result.hashes.sha256],
            ],
            theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [0, 255, 245] },
            margin: { left: 14, right: 14 }, styles: { fontSize: 8 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Entropy
    if (result.entropy) {
        doc.setFontSize(12);
        doc.text('ENTROPY ANALYSIS', 14, y);
        y += 6;
        autoTable(doc, {
            startY: y, head: [['Metric', 'Value']], body: [
                ['Shannon Entropy', result.entropy.value.toString()],
                ['Assessment', result.entropy.assessment.toUpperCase()],
                ['Description', result.entropy.description],
            ],
            theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [0, 255, 245] },
            margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check page overflow
    if (y > 240) { doc.addPage(); y = 20; }

    // Pattern Matches
    if (result.patternMatches && result.patternMatches.length > 0) {
        doc.setFontSize(12);
        doc.text(`PATTERN MATCHES (${result.patternMatches.length})`, 14, y);
        y += 6;
        autoTable(doc, {
            startY: y, head: [['Name', 'Category', 'Severity', 'Description']],
            body: result.patternMatches.map(p => [p.name, p.category, p.severity.toUpperCase(), p.description]),
            theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [0, 255, 245] },
            margin: { left: 14, right: 14 }, styles: { fontSize: 7 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (y > 240) { doc.addPage(); y = 20; }

    // YARA Matches
    if (result.yaraMatches && result.yaraMatches.length > 0) {
        doc.setFontSize(12);
        doc.text(`YARA RULES MATCHED (${result.yaraMatches.length})`, 14, y);
        y += 6;
        autoTable(doc, {
            startY: y, head: [['Rule', 'Severity', 'Tags', 'Description']],
            body: result.yaraMatches.map(r => [r.rule, r.severity.toUpperCase(), r.tags.join(', '), r.description]),
            theme: 'grid', headStyles: { fillColor: [30, 30, 50], textColor: [0, 255, 245] },
            margin: { left: 14, right: 14 }, styles: { fontSize: 7 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Engine Results (new page)
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`ENGINE RESULTS (${result.detectionCount}/${result.totalEngines} detected)`, 14, 20);

    const detected = result.engineResults.filter(e => e.detected);


    if (detected.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(255, 50, 50);
        doc.text('DETECTIONS:', 14, 30);
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
            startY: 34, head: [['Engine', 'Result', 'Category']],
            body: detected.map(e => [e.engine, e.result || '-', e.category]),
            theme: 'grid', headStyles: { fillColor: [180, 30, 30] },
            margin: { left: 14, right: 14 }, styles: { fontSize: 7 },
        });
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 150);
        doc.text(`CyberVault Scanner Report - Page ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`cybervault_scan_${result.id.slice(0, 8)}.pdf`);
}
