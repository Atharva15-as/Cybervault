// Metadata Stripping Service — Analyze and remove metadata from files

export interface FileMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    metadata: MetadataEntry[];
    riskLevel: 'low' | 'medium' | 'high';
    privacyScore: number; // 0-100, higher = more private (less metadata)
}

export interface MetadataEntry {
    category: string;
    key: string;
    value: string;
    risk: 'safe' | 'warning' | 'danger';
    description: string;
}

// Detect EXIF-like patterns in binary data
function findStringPatterns(data: Uint8Array, maxBytes: number = 50000): MetadataEntry[] {
    const entries: MetadataEntry[] = [];
    const textDecoder = new TextDecoder('ascii', { fatal: false });
    const searchData = data.slice(0, Math.min(data.length, maxBytes));
    const text = textDecoder.decode(searchData);

    // GPS patterns
    const gpsPatterns = [
        /GPS[\w]*Latitude/gi,
        /GPS[\w]*Longitude/gi,
        /GPS[\w]*Altitude/gi,
    ];
    for (const pattern of gpsPatterns) {
        if (pattern.test(text)) {
            entries.push({
                category: 'Location', key: 'GPS Coordinates',
                value: 'Detected in file', risk: 'danger',
                description: 'GPS data can reveal the exact location where the photo was taken'
            });
            break;
        }
    }

    // Device/Software patterns  
    const devicePatterns: [RegExp, string, string][] = [
        [/iPhone|iPad|Android|Samsung|Google Pixel|Huawei/gi, 'Device Model', 'Reveals what device was used'],
        [/Adobe|Photoshop|GIMP|Lightroom|Canva/gi, 'Software', 'Reveals editing software used'],
        [/Windows|macOS|Linux|iOS/gi, 'Operating System', 'Reveals OS information'],
        [/Canon|Nikon|Sony|Fuji|Olympus/gi, 'Camera Make', 'Reveals camera manufacturer'],
    ];

    for (const [pattern, key, desc] of devicePatterns) {
        const match = text.match(pattern);
        if (match) {
            entries.push({
                category: 'Device', key, value: match[0],
                risk: 'warning', description: desc
            });
        }
    }

    // Author/Creator patterns
    const authorPatterns: [RegExp, string][] = [
        [/(?:Author|Creator|Artist|by)[\s:=]+([A-Za-z\s]{2,30})/gi, 'Author/Creator'],
        [/(?:Copyright|©)[\s:=]+(.{2,50})/gi, 'Copyright Info'],
    ];
    for (const [pattern, key] of authorPatterns) {
        const match = pattern.exec(text);
        if (match) {
            entries.push({
                category: 'Identity', key, value: match[1]?.trim() || match[0],
                risk: 'danger', description: 'Can reveal the identity of the file creator'
            });
        }
    }

    // Date/Time patterns
    const datePatterns = /(\d{4})[:\-/](\d{2})[:\-/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/g;
    const dateMatch = datePatterns.exec(text);
    if (dateMatch) {
        entries.push({
            category: 'Temporal', key: 'Creation Date',
            value: dateMatch[0], risk: 'warning',
            description: 'Original creation timestamp of the file'
        });
    }

    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = emailPattern.exec(text);
    if (emailMatch) {
        entries.push({
            category: 'Identity', key: 'Email Address',
            value: emailMatch[0], risk: 'danger',
            description: 'Embedded email can identify the file creator or owner'
        });
    }

    return entries;
}

// Analyze image EXIF markers
function analyzeImageHeaders(data: Uint8Array): MetadataEntry[] {
    const entries: MetadataEntry[] = [];

    // Check for EXIF marker (0xFFE1)
    for (let i = 0; i < Math.min(data.length - 1, 100); i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xE1) {
            entries.push({
                category: 'Image', key: 'EXIF Data Block',
                value: `Found at offset ${i}`, risk: 'warning',
                description: 'EXIF block may contain camera settings, GPS, timestamps, and device info'
            });
            break;
        }
    }

    // Check for XMP marker
    const text = new TextDecoder('ascii', { fatal: false }).decode(data.slice(0, 5000));
    if (text.includes('xmp') || text.includes('XMP')) {
        entries.push({
            category: 'Image', key: 'XMP Metadata',
            value: 'Present', risk: 'warning',
            description: 'XMP can contain editing history, tags, and descriptions'
        });
    }

    // Check for ICC profile
    for (let i = 0; i < Math.min(data.length - 1, 200); i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xE2) {
            entries.push({
                category: 'Image', key: 'ICC Color Profile',
                value: `Found at offset ${i}`, risk: 'safe',
                description: 'Color profile data, generally safe'
            });
            break;
        }
    }

    return entries;
}

// Analyze PDF metadata
function analyzePDFMetadata(data: Uint8Array): MetadataEntry[] {
    const entries: MetadataEntry[] = [];
    const text = new TextDecoder('ascii', { fatal: false }).decode(data.slice(0, 10000));

    const pdfFields: [string, string, string, MetadataEntry['risk']][] = [
        ['Title', 'PDF Title', 'Title of the PDF file', 'safe'],
        ['Author', 'Author', 'Creator of the file', 'danger'],
        ['Creator', 'Creator Tool', 'Application used to create', 'warning'],
        ['Producer', 'PDF Producer', 'Software that generated the PDF', 'warning'],
        ['CreationDate', 'Creation Date', 'When the file was created', 'warning'],
        ['ModDate', 'Modification Date', 'Last modification time', 'warning'],
    ];

    for (const [field, key, desc, risk] of pdfFields) {
        const regex = new RegExp(`/${field}\\s*\\(([^)]+)\\)`, 'i');
        const match = regex.exec(text);
        if (match) {
            entries.push({
                category: 'PDF', key, value: match[1],
                risk, description: desc
            });
        }
    }

    return entries;
}

export const metadataService = {
    /**
     * Analyze a file for metadata
     */
    async analyzeFile(file: File): Promise<FileMetadata> {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        let metadata: MetadataEntry[] = [];

        // Basic file info
        metadata.push({
            category: 'File', key: 'File Name', value: file.name,
            risk: 'safe', description: 'Name of the file'
        });
        metadata.push({
            category: 'File', key: 'MIME Type', value: file.type || 'unknown',
            risk: 'safe', description: 'File content type'
        });
        metadata.push({
            category: 'File', key: 'File Size',
            value: `${(file.size / 1024).toFixed(1)} KB`,
            risk: 'safe', description: 'Size of the file'
        });
        if (file.lastModified) {
            metadata.push({
                category: 'File', key: 'Last Modified',
                value: new Date(file.lastModified).toLocaleString(),
                risk: 'warning', description: 'Last modification timestamp from filesystem'
            });
        }

        // Type-specific analysis
        if (file.type.startsWith('image/')) {
            metadata = metadata.concat(analyzeImageHeaders(data));
        } else if (file.type === 'application/pdf') {
            metadata = metadata.concat(analyzePDFMetadata(data));
        }

        // General string pattern search
        metadata = metadata.concat(findStringPatterns(data));

        // Deduplicate by key
        const seen = new Set<string>();
        metadata = metadata.filter(m => {
            const id = `${m.category}-${m.key}`;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        // Calculate risk and privacy score
        const dangerCount = metadata.filter(m => m.risk === 'danger').length;
        const warningCount = metadata.filter(m => m.risk === 'warning').length;
        let riskLevel: FileMetadata['riskLevel'] = 'low';
        if (dangerCount >= 2) riskLevel = 'high';
        else if (dangerCount >= 1 || warningCount >= 3) riskLevel = 'medium';

        const privacyScore = Math.max(0, 100 - (dangerCount * 25) - (warningCount * 10));

        return {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            metadata,
            riskLevel,
            privacyScore,
        };
    },

    /**
     * Create a "stripped" version of the file (for images: re-export without metadata)
     */
    async stripImageMetadata(file: File): Promise<Blob> {
        if (!file.type.startsWith('image/')) {
            throw new Error('Metadata stripping is only supported for image files');
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);

                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = outputType === 'image/jpeg' ? 0.95 : undefined;
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Failed to strip metadata')),
                    outputType,
                    quality
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },
};

export default metadataService;
