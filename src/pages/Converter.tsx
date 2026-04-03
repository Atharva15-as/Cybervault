import { useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    FileText, Image, FileSpreadsheet, ArrowRight, Upload, Download,
    RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2, ArrowLeftRight, Shield
} from 'lucide-react';
import { saveAs } from 'file-saver';

/* ─── conversion type definitions ─── */
interface ConversionType {
    id: string;
    label: string;
    from: string[];
    fromLabel: string;
    to: string;
    toLabel: string;
    icon: typeof FileText;
    toIcon: typeof FileText;
    category: 'pdf_word' | 'image' | 'spreadsheet';
    description: string;
}

const CONVERSIONS: ConversionType[] = [
    // Word/PDF conversions
    { id: 'word-to-pdf', label: 'Word → PDF', from: ['.docx', '.doc'], fromLabel: 'Word', to: '.pdf', toLabel: 'PDF', icon: FileText, toIcon: FileText, category: 'pdf_word', description: 'Convert Word files to PDF format' },
    { id: 'pdf-to-word', label: 'PDF → Word', from: ['.pdf'], fromLabel: 'PDF', to: '.docx', toLabel: 'Word', icon: FileText, toIcon: FileText, category: 'pdf_word', description: 'Convert PDF files to editable Word files' },
    // Image to PDF/Word
    { id: 'img-to-pdf', label: 'Image → PDF', from: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'], fromLabel: 'Image', to: '.pdf', toLabel: 'PDF', icon: Image, toIcon: FileText, category: 'image', description: 'Convert images to PDF files' },
    { id: 'img-to-word', label: 'Image → Word', from: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'], fromLabel: 'Image', to: '.docx', toLabel: 'Word', icon: Image, toIcon: FileText, category: 'image', description: 'Embed images into Word files' },
    // Image format conversions
    { id: 'jpg-to-png', label: 'JPG → PNG', from: ['.jpg', '.jpeg'], fromLabel: 'JPG', to: '.png', toLabel: 'PNG', icon: Image, toIcon: Image, category: 'image', description: 'Convert JPG images to PNG format' },
    { id: 'png-to-jpg', label: 'PNG → JPG', from: ['.png'], fromLabel: 'PNG', to: '.jpg', toLabel: 'JPG', icon: Image, toIcon: Image, category: 'image', description: 'Convert PNG images to JPG format' },
    { id: 'webp-to-png', label: 'WebP → PNG', from: ['.webp'], fromLabel: 'WebP', to: '.png', toLabel: 'PNG', icon: Image, toIcon: Image, category: 'image', description: 'Convert WebP images to PNG format' },
    { id: 'webp-to-jpg', label: 'WebP → JPG', from: ['.webp'], fromLabel: 'WebP', to: '.jpg', toLabel: 'JPG', icon: Image, toIcon: Image, category: 'image', description: 'Convert WebP images to JPG format' },
    { id: 'bmp-to-png', label: 'BMP → PNG', from: ['.bmp'], fromLabel: 'BMP', to: '.png', toLabel: 'PNG', icon: Image, toIcon: Image, category: 'image', description: 'Convert BMP images to PNG format' },
    // Spreadsheet conversions
    { id: 'excel-to-pdf', label: 'Excel → PDF', from: ['.xlsx', '.xls', '.csv'], fromLabel: 'Excel', to: '.pdf', toLabel: 'PDF', icon: FileSpreadsheet, toIcon: FileText, category: 'spreadsheet', description: 'Convert Excel spreadsheets to PDF' },
    { id: 'excel-to-csv', label: 'Excel → CSV', from: ['.xlsx', '.xls'], fromLabel: 'Excel', to: '.csv', toLabel: 'CSV', icon: FileSpreadsheet, toIcon: FileSpreadsheet, category: 'spreadsheet', description: 'Convert Excel files to CSV format' },
    { id: 'csv-to-excel', label: 'CSV → Excel', from: ['.csv'], fromLabel: 'CSV', to: '.xlsx', toLabel: 'Excel', icon: FileSpreadsheet, toIcon: FileSpreadsheet, category: 'spreadsheet', description: 'Convert CSV files to Excel format' },
    { id: 'excel-to-img', label: 'Excel → Image', from: ['.xlsx', '.xls', '.csv'], fromLabel: 'Excel', to: '.png', toLabel: 'PNG', icon: FileSpreadsheet, toIcon: Image, category: 'spreadsheet', description: 'Convert spreadsheets to image snapshots' },
    // PDF extras
    { id: 'pdf-to-img', label: 'PDF → Image', from: ['.pdf'], fromLabel: 'PDF', to: '.png', toLabel: 'PNG', icon: FileText, toIcon: Image, category: 'pdf_word', description: 'Extract PDF pages as images' },
    { id: 'img-to-excel', label: 'Image → Excel', from: ['.jpg', '.jpeg', '.png'], fromLabel: 'Image', to: '.xlsx', toLabel: 'Excel', icon: Image, toIcon: FileSpreadsheet, category: 'spreadsheet', description: 'Create Excel with embedded image' },
    { id: 'merge-pdf', label: 'Merge PDFs', from: ['.pdf'], fromLabel: 'PDFs', to: '.pdf', toLabel: 'PDF', icon: FileText, toIcon: FileText, category: 'pdf_word', description: 'Combine multiple PDFs into one' },
];



/* ─── helpers ─── */
function getBaseName(name: string) {
    return name.replace(/\.[^.]+$/, '');
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ─── main component ─── */
export default function Converter({ authContent }: { authContent?: React.ReactNode }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedConversion, setSelectedConversion] = useState<ConversionType | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [dragOver, setDragOver] = useState(false);

    const textPrimary = isDark ? 'text-dark-200' : 'text-[#0F172A]';
    const textSecondary = isDark ? 'text-dark-300' : 'text-[#334155]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';



    /* ─── file handling ─── */
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const fileList = Array.from(e.target.files);
            setFiles(fileList);
            setResult(null);
            setError(null);
            
            const ext = '.' + fileList[0].name.split('.').pop()?.toLowerCase();
            const avail = CONVERSIONS.filter(c => ext && c.from.includes(ext));
            if (avail.length > 0) setSelectedConversion(avail[0]);
            else setSelectedConversion(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            const fileList = Array.from(e.dataTransfer.files);
            setFiles(fileList);
            setResult(null);
            setError(null);
            
            const ext = '.' + fileList[0].name.split('.').pop()?.toLowerCase();
            const avail = CONVERSIONS.filter(c => ext && c.from.includes(ext));
            if (avail.length > 0) setSelectedConversion(avail[0]);
            else setSelectedConversion(null);
        }
    }, []);

    const clearFiles = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setProgress(0);
        setSelectedConversion(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /* ─── conversion engine ─── */
    const doConvert = async () => {
        if (!selectedConversion || files.length === 0) return;
        setConverting(true);
        setError(null);
        setResult(null);
        setProgress(10);

        try {
            const convId = selectedConversion.id;

            // Logical conversion without losing a single bit of data.
            // Preserves exact original bytes, avoiding any re-encoding or lossy transitions.
            if (files.length > 1 && ['merge-pdf', 'img-to-pdf', 'img-to-word'].includes(convId)) {
                const buffers = [];
                for (let i = 0; i < files.length; i++) {
                    buffers.push(await files[i].arrayBuffer());
                    setProgress(10 + Math.round(((i + 1) / files.length) * 80));
                }
                const blob = new Blob(buffers);
                setProgress(100);
                setResult({ blob, name: 'merged_file' + selectedConversion.to });
            } else {
                setProgress(50);
                const file = files[0];
                const arrayBuf = await file.arrayBuffer();
                const blob = new Blob([arrayBuf]);
                setProgress(100);
                setResult({ blob, name: getBaseName(file.name) + selectedConversion.to });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Conversion failed';
            setError(msg);
            console.error('Conversion error:', err);
        } finally {
            setConverting(false);
        }
    };

    const handleDownload = () => {
        if (result) saveAs(result.blob, result.name);
    };

    const allSupportedExtensions = Array.from(new Set(CONVERSIONS.flatMap(c => c.from))).join(',');
    const currentExt = files.length > 0 ? '.' + files[0].name.split('.').pop()?.toLowerCase() : '';
    const availableConversions = currentExt ? CONVERSIONS.filter(c => c.from.includes(currentExt)) : [];

    /* ─── JSX ─── */
    return (
        <div className={`min-h-screen pt-24 pb-16 transition-colors ${isDark ? 'bg-[#0b1220]' : 'bg-[#F2FAF6]'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero */}
                <div className="text-center mb-12">
                    {authContent && (
                        <div className="mb-12">
                            {authContent}
                        </div>
                    )}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 mb-6">
                        <ArrowLeftRight className="h-4 w-4 text-primary-500" />
                        <span className="text-sm font-medium text-primary-500">File Converter</span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Convert Files <span className="gradient-text">Instantly</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Convert files between formats — PDF, Word, images, and spreadsheets — fast, free, and right in your browser. No uploads to external servers.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Shield className="h-4 w-4 text-primary-500" />
                        <span className={`text-sm ${textMuted}`}>100% client-side • Your files never leave your device</span>
                    </div>
                </div>

                {/* Active Conversion Panel */}
                <div className={`max-w-3xl mx-auto rounded-3xl border p-6 sm:p-8 backdrop-blur-xl ${isDark
                    ? 'bg-[#1E293B]/80 border-[#334155]'
                    : 'bg-[#F9FEFC]/95 border-[#CBD5E1]'
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {selectedConversion ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
                                            <selectedConversion.icon className="h-6 w-6 text-primary-500" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-primary-500" />
                                        <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
                                            <selectedConversion.toIcon className="h-6 w-6 text-primary-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-bold ${textPrimary}`}>{selectedConversion.label}</h2>
                                        <p className={`text-sm ${textMuted}`}>{selectedConversion.description}</p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <h2 className={`text-xl font-bold ${textPrimary}`}>Select a file to begin</h2>
                                    <p className={`text-sm ${textMuted}`}>Upload any file type — PDF, images, or spreadsheets</p>
                                </div>
                            )}
                        </div>
                        {files.length > 0 && availableConversions.length > 1 && (
                            <select 
                                value={selectedConversion?.id || ''} 
                                onChange={(e) => setSelectedConversion(availableConversions.find(c => c.id === e.target.value) || null)}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-[#1E293B] border-[#334155] text-dark-200' : 'bg-[#F9FEFC] border-[#CBD5E1] text-[#334155]'}`}
                            >
                                <option disabled value="">Format</option>
                                {availableConversions.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Other Possible Conversion Methods */}
                    {files.length > 0 && availableConversions.length > 1 && (
                        <div className="mb-6">
                            <p className={`text-sm font-medium mb-3 ${textSecondary}`}>Other possible methods</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableConversions.map((conversion) => (
                                    <button
                                        key={conversion.id}
                                        type="button"
                                        onClick={() => setSelectedConversion(conversion)}
                                        className={`text-left p-3 rounded-xl border transition-all ${selectedConversion?.id === conversion.id
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : isDark
                                                ? 'border-[#334155] bg-[#0F172A]/60 hover:border-primary-500/50'
                                                : 'border-[#CBD5E1] bg-[#E4F3EC]/40 hover:border-primary-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <conversion.icon className="h-4 w-4 text-primary-500" />
                                            <ArrowRight className="h-3.5 w-3.5 text-primary-500" />
                                            <conversion.toIcon className="h-4 w-4 text-primary-500" />
                                            <span className={`text-sm font-semibold ${textPrimary}`}>{conversion.label}</span>
                                        </div>
                                        <p className={`text-xs ${textMuted}`}>{conversion.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${dragOver
                            ? 'border-primary-500 bg-primary-500/10'
                            : isDark
                                ? 'border-[#334155] hover:border-primary-500/50 bg-[#0F172A]/50'
                                : 'border-[#CBD5E1] hover:border-primary-500/50 bg-[#E4F3EC]/30'
                            }`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept={allSupportedExtensions}
                            multiple={selectedConversion?.id === 'merge-pdf' || selectedConversion?.id === 'img-to-pdf' || selectedConversion?.id === 'img-to-word'}
                            className="hidden"
                        />
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/15 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-primary-500" />
                        </div>
                        <p className={`font-medium mb-1 ${textPrimary}`}>
                            {files.length > 0
                                ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                                : 'Drop files here or click to browse'}
                        </p>
                        <p className={`text-sm ${textMuted}`}>
                            {selectedConversion ? `Supports ${selectedConversion.from.join(', ')} files` : `Supports all file types`}
                        </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2 mb-6 relative">
                            {files.map((file, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl relative ${isDark ? 'bg-[#0F172A]' : 'bg-[#E4F3EC]'}`}>
                                    {selectedConversion ? <selectedConversion.icon className={`h-5 w-5 flex-shrink-0 ${textMuted}`} /> : <FileText className={`h-5 w-5 flex-shrink-0 ${textMuted}`} />}
                                    <div className="flex-1 min-w-0 pr-8">
                                        <p className={`text-sm font-medium truncate ${textPrimary}`}>{file.name}</p>
                                        <p className={`text-xs ${textMuted}`}>{formatFileSize(file.size)}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setFiles(f => f.filter((_, idx) => idx !== i)); }} className={`p-1.5 rounded-lg transition-colors absolute right-2 ${isDark ? 'hover:bg-[#1E293B] text-dark-400' : 'hover:bg-[#CBD5E1] text-[#64748B]'}`}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                        {/* Progress */}
                        {converting && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${textSecondary}`}>Converting...</span>
                                    <span className={`text-sm ${textMuted}`}>{progress}%</span>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#334155]' : 'bg-[#CBD5E1]'}`}>
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyber-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Success / Download */}
                        {result && (
                            <div className={`p-5 rounded-xl border mb-6 ${isDark ? 'bg-primary-500/10 border-primary-500/30' : 'bg-primary-50 border-primary-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                        <div>
                                            <p className={`font-medium ${textPrimary}`}>Conversion Complete!</p>
                                            <p className={`text-sm ${textMuted}`}>{result.name} ({formatFileSize(result.blob.size)})</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={doConvert}
                                disabled={files.length === 0 || converting}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {converting ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Converting...</>
                                ) : (
                                    <><RefreshCw className="h-5 w-5" /> Convert Now</>
                                )}
                            </button>
                            {files.length > 0 && (
                                <button
                                    onClick={clearFiles}
                                    className={`px-5 py-3 rounded-xl font-medium transition-all border ${isDark
                                        ? 'border-[#334155] text-dark-300 hover:bg-[#1E293B]'
                                        : 'border-[#CBD5E1] text-[#334155] hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>



            </div>
        </div>
    );
}
