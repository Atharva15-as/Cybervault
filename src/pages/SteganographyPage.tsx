import { useState, useRef } from 'react';
import { Image, Upload, Download, Loader2, Eye, EyeOff, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import steganographyService from '../services/steganographyService';

export default function SteganographyPage() {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const hideImageRef = useRef<HTMLInputElement>(null);
    const extractImageRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'hide' | 'extract'>('hide');
    const [isProcessing, setIsProcessing] = useState(false);
    const [secretText, setSecretText] = useState('');
    const [carrierImage, setCarrierImage] = useState<File | null>(null);
    const [carrierPreview, setCarrierPreview] = useState('');
    const [capacity, setCapacity] = useState<{ maxKB: string; width: number; height: number } | null>(null);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultPreview, setResultPreview] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const handleCarrierSelect = async (file: File) => {
        setCarrierImage(file);
        setCarrierPreview(URL.createObjectURL(file));
        const cap = await steganographyService.getImageCapacity(file);
        setCapacity(cap);
    };

    const handleHide = async () => {
        if (!carrierImage || !secretText) return;
        setIsProcessing(true);
        try {
            const blob = await steganographyService.hideDataInImage(carrierImage, secretText);
            setResultBlob(blob);
            setResultPreview(URL.createObjectURL(blob));
            addToast({ type: 'success', title: 'Data Hidden!', message: 'Secret embedded in image' });
        } catch (err) {
            addToast({ type: 'error', title: 'Failed', message: (err as Error).message });
        } finally { setIsProcessing(false); }
    };

    const handleExtract = async (file: File) => {
        setIsProcessing(true);
        try {
            const text = await steganographyService.extractDataFromImage(file);
            setExtractedText(text);
            addToast({ type: 'success', title: 'Data Extracted!', message: 'Hidden message found' });
        } catch {
            addToast({ type: 'error', title: 'No Data Found', message: 'No hidden data detected in this image' });
        } finally { setIsProcessing(false); }
    };

    const downloadResult = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url; a.download = 'steganographic_image.png'; a.click();
        URL.revokeObjectURL(url);
    };

    const hideSteps = [
        { step: '1', title: 'Select Carrier Image', desc: 'Choose a normal-looking PNG or target image to act as your carrier.' },
        { step: '2', title: 'Type Secret Message', desc: 'Enter the confidential text you want to hide inside the image.' },
        { step: '3', title: 'Hide & Download', desc: 'The text is embedded in the image pixels. Download the new resulting image.' },
    ];

    const extractSteps = [
        { step: '1', title: 'Upload Image', desc: 'Upload a steganographic image that you believe contains hidden data.' },
        { step: '2', title: 'Extract Data', desc: 'The system scans the image\'s least significant bits (LSB) to find hidden payloads.' },
        { step: '3', title: 'Read Secret', desc: 'If data is found, it will be extracted and displayed instantly.' },
    ];

    const features = [
        { icon: EyeOff, title: 'Invisible Payload', desc: 'Modifies the least significant bits, making changes completely invisible to the human eye.' },
        { icon: AlertCircle, title: 'Capacity Check', desc: 'Calculates the maximum hidden data capacity of your image safely.' },
        { icon: Image, title: 'Pristine Images', desc: 'The carrier image retains its visual fidelity and resolution.' },
    ];

    const currentSteps = activeTab === 'hide' ? hideSteps : extractSteps;

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
                        <Eye className="h-4 w-4 text-pink-500" />
                        <span className="text-sm text-pink-500 font-medium">Digital Steganography</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Hide Data <span className="gradient-text">Inside Images</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        Embed secret messages within normal-looking images. The image looks unchanged to the naked eye.
                    </p>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT SIDE — How to Use + Features */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-6 sticky top-28">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-pink-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>
                                    How to {activeTab === 'hide' ? 'Hide Data' : 'Extract'}
                                </h2>
                            </div>

                            <div className="space-y-5">
                                {currentSteps.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-pink-500/25">
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <h4 className={`text-sm font-semibold mb-1 ${textPrimary}`}>{item.title}</h4>
                                            <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`my-6 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`} />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                    <Image className="h-5 w-5 text-pink-500" />
                                </div>
                                <h2 className={`text-lg font-bold ${textPrimary}`}>Features & Working</h2>
                            </div>

                            <div className="space-y-4">
                                {features.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="h-4 w-4 text-pink-500" />
                                            <h4 className={`text-sm font-semibold ${textPrimary}`}>{item.title}</h4>
                                        </div>
                                        <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE — Tool */}
                    <div className="lg:col-span-8">
                        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                            <button onClick={() => setActiveTab('hide')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'hide' ? 'bg-pink-500 text-white' : textMuted}`}>
                                <EyeOff className="h-4 w-4" /> Hide Data
                            </button>
                            <button onClick={() => setActiveTab('extract')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'extract' ? 'bg-pink-500 text-white' : textMuted}`}>
                                <Eye className="h-4 w-4" /> Extract Data
                            </button>
                        </div>

                        {isProcessing ? (
                            <div className="glass-card p-12 text-center">
                                <Loader2 className="h-12 w-12 text-pink-500 animate-spin mx-auto mb-4" />
                                <p className={textPrimary}>{activeTab === 'hide' ? 'Embedding data in image...' : 'Scanning for hidden data...'}</p>
                            </div>
                        ) : activeTab === 'hide' ? (
                            <div className="space-y-6">
                                <div className={`glass-card p-6 border-2 border-dashed ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                    {carrierPreview ? (
                                        <div className="flex items-start gap-4">
                                            <img src={carrierPreview} alt="Carrier" className="w-32 h-32 rounded-xl object-cover" />
                                            <div className="flex-1">
                                                <h4 className={`font-semibold ${textPrimary}`}>{carrierImage?.name}</h4>
                                                {capacity && <p className={`text-sm ${textMuted}`}>{capacity.width}×{capacity.height}px • Max capacity: {capacity.maxKB} KB</p>}
                                                <button onClick={() => { setCarrierImage(null); setCarrierPreview(''); setCapacity(null); }}
                                                    className="text-xs text-red-500 mt-2 hover:underline">Change image</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Image className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                                            <h3 className={`font-semibold mb-2 ${textPrimary}`}>Select Carrier Image</h3>
                                            <p className={`text-sm mb-4 ${textMuted}`}>Choose a PNG or BMP image to hide data inside</p>
                                            <label className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-medium cursor-pointer inline-flex items-center gap-2 transition-all shadow-lg shadow-pink-500/25">
                                                <Upload className="h-4 w-4" /> Choose Image
                                                <input type="file" accept="image/*" className="hidden" ref={hideImageRef} onChange={e => { if (e.target.files?.[0]) handleCarrierSelect(e.target.files[0]); }} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {carrierImage && (
                                    <div className="glass-card p-6">
                                        <h3 className={`font-semibold mb-3 ${textPrimary}`}><Lock className="h-5 w-5 inline mr-2 text-pink-500" />Secret Message</h3>
                                        <textarea value={secretText} onChange={e => setSecretText(e.target.value)}
                                            placeholder="Enter the secret text to hide inside the image..."
                                            className="input-field min-h-[100px] resize-y" rows={3} />
                                        {capacity && <p className={`text-xs mt-2 ${textMuted}`}>{new TextEncoder().encode(secretText).length} of {parseInt(capacity.maxKB) * 1024} bytes used</p>}
                                        <button onClick={handleHide} disabled={!secretText} className="btn-primary mt-4 disabled:opacity-50">
                                            <EyeOff className="h-4 w-4 mr-2" /> Hide Data in Image
                                        </button>
                                    </div>
                                )}

                                {resultBlob && (
                                    <div className="glass-card p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Image className="h-5 w-5 text-green-500" /></div>
                                            <div><h3 className={`font-semibold ${textPrimary}`}>Data Hidden Successfully!</h3><p className={`text-sm ${textMuted}`}>The image looks identical but contains your secret</p></div>
                                        </div>
                                        {resultPreview && <img src={resultPreview} alt="Result" className="w-full max-w-md rounded-xl mb-4 mx-auto" />}
                                        <button onClick={downloadResult} className="btn-primary"><Download className="h-4 w-4 mr-2" /> Download Steganographic Image</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {!extractedText ? (
                                    <div className={`glass-card p-8 border-2 border-dashed text-center ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                        <Unlock className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                                        <h3 className={`font-semibold mb-2 ${textPrimary}`}>Extract Hidden Data</h3>
                                        <p className={`text-sm mb-4 ${textMuted}`}>Upload a steganographic image to reveal its hidden message</p>
                                        <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                            <Upload className="h-4 w-4" /> Select Image
                                            <input type="file" accept="image/*" className="hidden" ref={extractImageRef} onChange={e => { if (e.target.files?.[0]) handleExtract(e.target.files[0]); }} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="glass-card p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Eye className="h-5 w-5 text-green-500" /></div>
                                            <div><h3 className={`font-semibold ${textPrimary}`}>Hidden Message Found!</h3></div>
                                        </div>
                                        <div className={`p-4 rounded-xl font-mono text-sm whitespace-pre-wrap break-all mb-4 ${isDark ? 'bg-[#1E293B] text-pink-300' : 'bg-[#E4F3EC] text-pink-700'}`}>{extractedText}</div>
                                        <button onClick={() => setExtractedText('')} className="btn-secondary">Analyze Another Image</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
