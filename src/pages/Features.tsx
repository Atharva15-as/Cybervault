import {
    Shield,
    Lock,
    Clock,
    UserCheck,
    FileCheck,
    ShieldAlert,
    Cloud,
    X,
    ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const features = [
    {
        icon: Lock,
        title: 'End-to-End Encryption',
        description: 'Files are encrypted with AES-256 before upload. Only you and your recipients can decrypt the data using RSA key pairs.',
        highlight: 'AES-256 + RSA',
        details: [
            'Client-side encryption ensures unencrypted data never leaves your device.',
            'AES-256-GCM authenticated encryption for confidentiality and integrity.',
            'RSA-2048 based hybrid encryption scheme for secure key sharing.',
            'Unique encryption keys generated for every single file.',
        ]
    },
    {
        icon: Cloud,
        title: 'Secure File Upload & Download',
        description: 'All file transfers occur over TLS-encrypted connections. Files remain encrypted at rest in our secure cloud storage.',
        highlight: 'TLS Protected',
        details: [
            'TLS 1.3 protocol strictly enforced for all data in transit.',
            'Encrypted at rest using provider-managed keys plus your client-side encryption.',
            'Chunked upload support for handling large files securely.',
            'Automatic integrity verification after every transfer.',
        ]
    },
    {
        icon: Clock,
        title: 'Token-Based Access with Expiry',
        description: 'Generate secure, time-limited download tokens. Links automatically expire after the specified duration.',
        highlight: 'Auto-Expiry',
        details: [
            'Cryptographically secure random tokens for download links.',
            'Customizable expiration times (1 hour, 1 day, 1 week).',
            'Option to limit the number of downloads per link.',
            'Immediate revocation capability for any active shared link.',
        ]
    },
    {
        icon: UserCheck,
        title: 'User Authentication & Authorization',
        description: 'Robust user authentication with secure password hashing. Role-based access control for fine-grained permissions.',
        highlight: 'RBAC Enabled',
        details: [
            'Passwords hashed using strong algorithms (Bcrypt/Argon2).',
            'Session management with secure, HTTP-only cookies.',
            'Support for Multi-Factor Authentication (MFA).',
            'Granular permissions to control who can view or edit files.',
        ]
    },
    {
        icon: FileCheck,
        title: 'File Integrity Verification',
        description: 'Every file is verified using SHA-256 hash checksums. Detect any tampering or corruption instantly.',
        highlight: 'SHA-256 Hash',
        details: [
            'SHA-256 checksums calculated before encryption and after decryption.',
            'Ensures bit-perfect file restoration.',
            'Protects against data corruption during transfer or storage.',
            'Verifiable proof that the file has not been tampered with.',
        ]
    },
    {
        icon: ShieldAlert,
        title: 'Protection Against Unauthorized Access',
        description: 'Multi-layered security prevents unauthorized access. Suspicious activities are logged and blocked.',
        highlight: 'Multi-Layer',
        details: [
            'Real-time threat detection and IP blocking.',
            'Rate limiting to prevent brute-force attacks.',
            'Comprehensive audit logs for all file access events.',
            'Automatic account lockout after failed login attempts.',
        ]
    },
];

export default function Features() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textSubtle = isDark ? 'text-[#94A3B8]' : 'text-[#94A3B8]';
    const modalBg = isDark ? 'bg-dark-900/95 border-[#334155]' : 'bg-white/95 border-[#CBD5E1]';

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <Shield className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Security Features</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Enterprise-Grade
                        <br />
                        <span className="gradient-text">Security</span>
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                        CyberVault provides comprehensive security features to protect your
                        sensitive data at every stage of storage and sharing.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`glass-card p-6 card-hover group cursor-pointer relative overflow-hidden`}
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setSelectedFeature(feature)}
                        >
                            {/* Icon */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-cyber-500/20 flex items-center justify-center group-hover:from-primary-500/30 group-hover:to-cyber-500/30 transition-all">
                                    <feature.icon className="h-6 w-6 text-primary-500" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium">
                                    {feature.highlight}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className={`text-lg font-semibold mb-2 group-hover:text-primary-500 transition-colors ${textPrimary}`}>
                                {feature.title}
                            </h3>
                            <p className={`${textMuted} text-sm leading-relaxed mb-4`}>
                                {feature.description}
                            </p>

                            {/* Click Hint */}
                            <div className={`flex items-center text-sm font-medium text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300`}>
                                NOTE: Click to learn more <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Security Standards */}
                <div className="mt-20">
                    <div className="glass-card p-8 md:p-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { value: 'AES-256', label: 'Encryption Standard' },
                                { value: 'RSA-2048', label: 'Key Exchange' },
                                { value: 'SHA-256', label: 'Integrity Check' },
                                { value: 'TLS 1.3', label: 'Transport Security' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-2xl md:text-3xl font-bold gradient-text mb-2">{stat.value}</p>
                                    <p className={`${textSubtle} text-sm`}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


            </div>

            {/* Feature Modal */}
            {selectedFeature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setSelectedFeature(null)}
                    />
                    <div className={`relative w-full max-w-2xl ${modalBg} border rounded-2xl p-8 shadow-2xl animate-scale-up overflow-hidden`}>
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedFeature(null)}
                            className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Icon Side */}
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyber-500/20 flex items-center justify-center">
                                    <selectedFeature.icon className="h-8 w-8 text-primary-500" />
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className={`text-2xl font-bold font-heading ${textPrimary}`}>
                                        {selectedFeature.title}
                                    </h3>
                                    <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium whitespace-nowrap">
                                        {selectedFeature.highlight}
                                    </span>
                                </div>

                                <p className={`${textMuted} text-lg mb-6 leading-relaxed`}>
                                    {selectedFeature.description}
                                </p>

                                <div className={`space-y-3 p-6 rounded-xl ${isDark ? 'bg-dark-800/50' : 'bg-[#E4F3EC]'}`}>
                                    <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${textSubtle}`}>
                                        Key Technical Details
                                    </h4>
                                    <ul className="space-y-3">
                                        {selectedFeature.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                                                <span className={`${isDark ? 'text-dark-300' : 'text-[#334155]'}`}>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
