import {
    UserPlus,
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
        icon: UserPlus,
        title: 'User Registration & Login',
        description: 'Create a secure account with email verification. Your credentials are hashed using bcrypt for maximum security.',
        details: [
            'Email verification required',
            'Strong password requirements',
            'Optional two-factor authentication',
            'Secure session management',
        ],
    },
    {
        number: '02',
        icon: Upload,
        title: 'File Upload',
        description: 'Select files from your device to upload. Files are prepared for encryption before leaving your browser.',
        details: [
            'Drag & drop interface',
            'Multiple file support',
            'File type validation',
            'Size limit up to 500MB',
        ],
    },
    {
        number: '03',
        icon: Lock,
        title: 'Encryption Process',
        description: 'Files are encrypted client-side using AES-256. The encryption key is then encrypted with RSA public key.',
        details: [
            'AES-256-GCM encryption',
            'RSA-2048 key wrapping',
            'Client-side processing',
            'Zero-knowledge design',
        ],
    },
    {
        number: '04',
        icon: Database,
        title: 'Secure Storage',
        description: 'Encrypted files are stored in our cloud infrastructure with redundancy and protection against data loss.',
        details: [
            'Encrypted at rest',
            'Geographic redundancy',
            'Regular backups',
            'Access logging',
        ],
    },
    {
        number: '05',
        icon: Link2,
        title: 'Token-Based File Sharing',
        description: 'Generate secure, time-limited download links. Share with specific users or anyone with the link.',
        details: [
            'Unique token generation',
            'Configurable expiry time',
            'Download limit options',
            'Revocable access',
        ],
    },
    {
        number: '06',
        icon: Download,
        title: 'Secure Download & Expiry',
        description: 'Recipients download and decrypt files seamlessly. Links expire automatically after the set duration.',
        details: [
            'Automatic decryption',
            'Integrity verification',
            'Secure delivery',
            'Activity logging',
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
                        Understanding the complete journey of your files from upload to secure sharing.
                    </p>
                </div>

                {/* Process Flow Diagram */}
                <div className="mb-20">
                    <div className="glass-card p-8">
                        <div className="flex flex-wrap justify-center items-center gap-4 text-center">
                            {[
                                { icon: Upload, label: 'Upload' },
                                { icon: Lock, label: 'Encrypt' },
                                { icon: Database, label: 'Store' },
                                { icon: Link2, label: 'Share' },
                                { icon: Download, label: 'Download' },
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
