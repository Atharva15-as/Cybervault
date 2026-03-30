import { Link } from 'react-router-dom';
import {
    Shield, Blocks, Lock, FileText, Fingerprint, PenTool, Image,
    FileSearch, Timer, ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const tools = [
    {
        name: 'Blockchain Timestamps',
        description: 'Anchor file hashes to the blockchain for immutable proof of existence',
        icon: Blocks, path: '/tools/blockchain', color: 'purple',
        badge: '⛓️ Priority',
    },
    {
        name: 'E2E Encryption',
        description: 'Encrypt files client-side with AES-256-GCM — zero-knowledge architecture',
        icon: Lock, path: '/tools/encrypt', color: 'emerald',
        badge: '🔐 Core',
    },
    {
        name: 'Secure Notes',
        description: 'Share encrypted text, passwords, API keys with burn-after-read',
        icon: FileText, path: '/tools/notes', color: 'amber',
        badge: '🔥 New',
    },
    {
        name: 'File DNA Fingerprint',
        description: 'Multi-hash fingerprinting with SSH-style visual art & file comparison',
        icon: Fingerprint, path: '/tools/file-dna', color: 'cyan',
        badge: '🧬 Unique',
    },
    {
        name: 'Digital Signatures',
        description: 'ECDSA cryptographic signing to prove file authenticity',
        icon: PenTool, path: '/tools/signatures', color: 'indigo',
        badge: '✍️ Verify',
    },
    {
        name: 'Steganography',
        description: 'Hide secret data inside normal-looking images — spy-level security',
        icon: Image, path: '/tools/steganography', color: 'pink',
        badge: '🕵️ Spy',
    },
    {
        name: 'Metadata Stripper',
        description: 'Detect and remove hidden GPS, author, device info before sharing',
        icon: FileSearch, path: '/tools/metadata', color: 'orange',
        badge: '🔍 Privacy',
    },
    {
        name: 'Dead Man\'s Switch',
        description: 'Auto-share files if you stop checking in — emergency protocol',
        icon: Timer, path: '/tools/dead-man-switch', color: 'red',
        badge: '⏱️ Emergency',
    },
];

const colorMap: Record<string, { bg: string; text: string; border: string; shadow: string; gradient: string }> = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', shadow: 'shadow-purple-500/20', gradient: 'from-purple-500 to-purple-700' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', shadow: 'shadow-emerald-500/20', gradient: 'from-emerald-500 to-emerald-700' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', shadow: 'shadow-amber-500/20', gradient: 'from-amber-500 to-amber-700' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20', shadow: 'shadow-cyan-500/20', gradient: 'from-cyan-500 to-cyan-700' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', shadow: 'shadow-indigo-500/20', gradient: 'from-indigo-500 to-indigo-700' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20', shadow: 'shadow-pink-500/20', gradient: 'from-pink-500 to-pink-700' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20', shadow: 'shadow-orange-500/20', gradient: 'from-orange-500 to-orange-700' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', shadow: 'shadow-red-500/20', gradient: 'from-red-500 to-red-700' },
};

export default function SecurityTools() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <Shield className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Advanced Security Suite</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Security <span className="gradient-text">Tools</span>
                    </h1>
                    <p className={`text-lg max-w-3xl mx-auto ${textMuted}`}>
                        A complete arsenal of security tools that no other file sharing platform offers.
                        Blockchain timestamps, steganography, E2E encryption, and more.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map(tool => {
                        const colors = colorMap[tool.color];
                        return (
                            <Link key={tool.path} to={tool.path}
                                className={`glass-card p-6 group card-hover border ${colors.border} hover:${colors.shadow} transition-all relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`} />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <tool.icon className={`h-7 w-7 ${colors.text}`} />
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${textPrimary} group-hover:${colors.text} transition-colors`}>
                                        {tool.name}
                                    </h3>
                                    <p className={`text-sm mb-4 ${textMuted}`}>{tool.description}</p>
                                    <div className={`inline-flex items-center gap-1 text-sm font-medium ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        Open Tool <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="glass-card p-8 mt-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10" />
                    <div className="relative z-10">
                        <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>All tools run 100% client-side</h2>
                        <p className={`${textMuted} max-w-xl mx-auto`}>
                            Your data never leaves your browser. No server processing, no uploads, no tracking.
                            True zero-knowledge security by design.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
