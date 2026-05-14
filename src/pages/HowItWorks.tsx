import {
    Upload,
    Lock,
    Database,
    Link2,
    Download,
    ArrowDown,
    Shield,
    Key,
    FileCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const steps = [
    {
        number: '01',
        icon: Upload,
        title: 'Choose the File to Protect',
        description: 'Start by selecting the file you want to secure. The encryption workflow begins in your browser before the file is shared.',
        details: [
            'Single file selection flow',
            'Works directly from your device',
            'Original file stays readable until encryption starts',
            'Built for quick secure sharing',
        ],
    },
    {
        number: '02',
        icon: Key,
        title: 'Generate or Enter a Secret Key',
        description: 'Create a strong vault key or use your own passphrase. This same key is required later to decrypt the file.',
        details: [
            'Generate a fresh key instantly',
            'Custom passphrase supported',
            'Minimum 8 characters',
            'You must back it up safely',
        ],
    },
    {
        number: '03',
        icon: Lock,
        title: 'Encrypt in the Browser',
        description: 'CyberVault encrypts the file on the client side so the protected `.enc` file is created before secure delivery.',
        details: [
            'AES-256-GCM encryption',
            'Client-side processing',
            'Passphrase never sent as plain text',
            'Zero-knowledge design',
        ],
    },
    {
        number: '04',
        icon: Database,
        title: 'Upload the Encrypted File',
        description: 'The encrypted output is uploaded in protected form, and CyberVault prepares a short share link plus integrity metadata.',
        details: [
            'Encrypted at rest',
            'SHA-256 fingerprint recorded',
            'Short share URL generated',
            'Optional expiry window',
        ],
    },
    {
        number: '05',
        icon: Link2,
        title: 'Send the Link and Key Separately',
        description: 'Share the generated link so the receiver can download the encrypted file, and send the secret key through a trusted separate channel.',
        details: [
            'Receiver gets only the `.enc` file from the link',
            'Key should be shared separately',
            'Expiry can be time-limited',
            'Access stays controlled',
        ],
    },
    {
        number: '06',
        icon: Download,
        title: 'Receiver Downloads and Decrypts',
        description: 'The receiver downloads the encrypted file, enters the shared key in CyberVault, and restores the original file after integrity checks pass.',
        details: [
            'Encrypted `.enc` download',
            'Manual key entry for decryption',
            'Integrity verification',
            'Original file recovered locally',
        ],
    },
];

export default function HowItWorks() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textSubtle = isDark ? 'text-[#94A3B8]' : 'text-[#94A3B8]';

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <Shield className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Step by Step</span>
                    </div>
                    <h1 className={`section-title ${textPrimary}`}>
                        How CyberVault
                        <br />
                        <span className="gradient-text">Protects Your Files</span>
                    </h1>
                    <p className={`section-subtitle mt-4 ${textMuted}`}>
                        Follow the real CyberVault flow from file selection and key creation to encrypted sharing and safe recovery.
                    </p>
                </div>

                {/* Process Flow Diagram */}
                <div className="mb-20">
                    <div className="glass-card p-8">
                        <div className="flex flex-wrap justify-center items-center gap-4 text-center">
                            {[
                                { icon: Upload, label: 'Choose File' },
                                { icon: Key, label: 'Create Key' },
                                { icon: Lock, label: 'Encrypt' },
                                { icon: Database, label: 'Upload' },
                                { icon: Link2, label: 'Share' },
                                { icon: Download, label: 'Decrypt' },
                            ].map((item, index, arr) => (
                                <div key={item.label} className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyber-500/20 flex items-center justify-center">
                                            <item.icon className="h-7 w-7 text-primary-500" />
                                        </div>
                                        <span className={`text-sm ${textSubtle}`}>{item.label}</span>
                                    </div>
                                    {index < arr.length - 1 && (
                                        <div className="hidden sm:block w-12 h-0.5 bg-gradient-to-r from-primary-500/50 to-cyber-500/50" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Steps Timeline */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-cyber-500 to-primary-500 hidden md:block" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div key={step.number} className="relative">
                                {/* Connection dot */}
                                <div className="absolute left-8 top-8 w-2 h-2 rounded-full bg-primary-500 -translate-x-1/2 hidden md:block" />

                                <div className="md:ml-20 glass-card p-6 card-hover">
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        {/* Step Number & Icon */}
                                        <div className="flex items-center gap-4 md:flex-col md:items-center md:min-w-[80px]">
                                            <span className="text-4xl font-bold text-primary-500/30 font-heading">{step.number}</span>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyber-500/20 flex items-center justify-center">
                                                <step.icon className="h-7 w-7 text-primary-500" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <h3 className={`text-xl font-semibold mb-2 ${textPrimary}`}>
                                                {step.title}
                                            </h3>
                                            <p className={`${textMuted} mb-4`}>
                                                {step.description}
                                            </p>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {step.details.map((detail) => (
                                                    <div key={detail} className="flex items-center gap-2 text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                                        <span className={textSubtle}>{detail}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow to next step */}
                                    {index < steps.length - 1 && (
                                        <div className="flex justify-center mt-6 md:hidden">
                                            <ArrowDown className="h-6 w-6 text-primary-500/50" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Highlights */}
                <div className="mt-20">
                    <div className="glass-card p-8">
                        <h3 className={`text-xl font-semibold text-center mb-6 ${textPrimary}`}>
                            Security at Every Step
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Key,
                                    title: 'Client-Side Encryption',
                                    description: 'Your files are encrypted before leaving your device',
                                },
                                {
                                    icon: Shield,
                                    title: 'Zero-Knowledge',
                                    description: 'We never have access to your unencrypted data',
                                },
                                {
                                    icon: FileCheck,
                                    title: 'Integrity Verified',
                                    description: 'SHA-256 hashes ensure file integrity',
                                },
                            ].map((item) => (
                                <div key={item.title} className="text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/20 mb-4">
                                        <item.icon className="h-6 w-6 text-primary-500" />
                                    </div>
                                    <h4 className={`font-medium mb-1 ${textPrimary}`}>{item.title}</h4>
                                    <p className={`text-sm ${textSubtle}`}>{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
