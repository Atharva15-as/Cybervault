import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Lock,
    Upload,
    Share2,
    ArrowRight,
    CheckCircle,
    Zap,
    Globe,
    Key,
    FileCheck,
    Play,
} from 'lucide-react';
import Logo from '../components/Logo';
import ParticleNetwork from '../components/ParticleNetwork';
import { useTheme } from '../context/ThemeContext';

const steps = [
    {
        icon: Upload,
        title: 'Upload',
        description: 'Select and upload your files securely to CyberVault',
    },
    {
        icon: Lock,
        title: 'Encrypt',
        description: 'Files are encrypted with AES-256 and RSA encryption',
    },
    {
        icon: Share2,
        title: 'Secure Share',
        description: 'Generate time-limited secure links for sharing',
    },
];

const features = [
    'End-to-End Encryption',
    'Zero-Knowledge Architecture',
    'Token-Based Access Control',
    'File Integrity Verification',
    'Automatic Link Expiry',
    'Military-Grade Security',
];

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text color classes based on theme
    // Dark mode: light text | Light mode: dark text
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
    const textSubtle = isDark ? 'text-gray-500' : 'text-gray-500';

    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
                {/* Particle Network Background */}
                <div className="absolute inset-0 z-0">
                    <ParticleNetwork />
                </div>
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6 animate-fade-in">
                                <Shield className="h-4 w-4 text-primary-500" />
                                <span className="text-sm text-primary-500 font-medium">End-to-End Encrypted</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading mb-6 animate-slide-up">
                                <span className={textPrimary}>CyberVault –</span>
                                <br />
                                <span className="gradient-text">Secure Your Files</span>
                                <br />
                                <span className={textPrimary}>with End-to-End Encryption</span>
                            </h1>

                            {/* Subheading */}
                            <p className={`text-lg lg:text-xl mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animation-delay-150 ${textMuted}`}>
                                Store, encrypt, and share files with military-grade security.
                                Powered by AES-256 encryption — because your privacy matters.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-slide-up animation-delay-300">
                                <Link to="/register" className="btn-primary text-lg px-8 py-4">
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                                    Login
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap gap-6 justify-center lg:justify-start animate-slide-up animation-delay-500">
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">AES-256 Encryption</span>
                                </div>
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">RSA Key Exchange</span>
                                </div>
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">SHA-256 Integrity</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Hero Visual */}
                        <div className="relative flex items-center justify-center animate-fade-in animation-delay-300">
                            <div className="relative">
                                {/* Main Shield Container */}
                                <div className="w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-600/20 flex items-center justify-center animate-pulse-slow">
                                    <div className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full bg-gradient-to-br from-primary-500/30 to-blue-600/30 flex items-center justify-center">
                                        <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-primary-500/50 animate-glow">
                                            <Logo className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28" shieldClassName="text-white" lockClassName="text-white/90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-0 right-0 animate-float">
                                    <div className="glass-card p-3 rounded-xl">
                                        <Lock className="h-6 w-6 text-primary-500" />
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-0 animate-float animation-delay-300">
                                    <div className="glass-card p-3 rounded-xl">
                                        <Key className="h-6 w-6 text-blue-400" />
                                    </div>
                                </div>

                                <div className="absolute top-1/2 -right-4 animate-float animation-delay-500">
                                    <div className="glass-card p-3 rounded-xl">
                                        <FileCheck className="h-6 w-6 text-green-400" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 right-1/4 animate-float animation-delay-150">
                                    <div className="glass-card p-3 rounded-xl">
                                        <Zap className="h-6 w-6 text-yellow-400" />
                                    </div>
                                </div>

                                <div className="absolute top-1/4 -left-4 animate-float animation-delay-500">
                                    <div className="glass-card p-3 rounded-xl">
                                        <Globe className="h-6 w-6 text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - 3 Steps */}
            <section className={`py-24 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-dark-900/50' : 'bg-gray-100/50'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                            How It Works
                        </h2>
                        <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
                            Three simple steps to secure your files with CyberVault
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative">
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                                )}

                                <div className="glass-card p-8 text-center card-hover relative z-10">
                                    {/* Icon */}
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-blue-500/20 mb-6">
                                        <step.icon className="h-8 w-8 text-primary-500" />
                                    </div>

                                    <h3 className={`text-xl font-semibold mb-3 ${textPrimary}`}>
                                        {step.title}
                                    </h3>
                                    <p className={textMuted}>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Demo Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        See It In Action
                    </h2>
                    <p className={`text-lg max-w-2xl mx-auto mb-10 ${textMuted}`}>
                        Watch how easy it is to encrypt and share files securely.
                    </p>

                    <div
                        className={`glass-card p-4 rounded-3xl relative overflow-hidden group ${!isPlaying ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-all duration-300`}
                        onClick={() => !isPlaying && setIsPlaying(true)}
                    >
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-2xl relative overflow-hidden">
                            {isPlaying ? (
                                <iframe
                                    src="https://www.youtube.com/embed/Z5iWr6S6jJg?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1"
                                    title="CyberVault Demo"
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <>
                                    {/* Placeholder Background - Abstract Tech Grid */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-dark-950 to-black overflow-hidden">
                                        {/* Grid Pattern */}
                                        <div className="absolute inset-0 opacity-20"
                                            style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                                        </div>
                                        {/* Glowing Orb */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                                    </div>

                                    {/* Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center z-20">
                                        <div className="w-20 h-20 rounded-full bg-primary-500/90 text-white flex items-center justify-center pl-2 shadow-lg shadow-primary-500/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary-500">
                                            <Play className="h-8 w-8 fill-current" />
                                        </div>
                                    </div>

                                    {/* Video Controls (Mockup) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="h-1 flex-1 bg-gray-600 rounded-full cursor-pointer overflow-hidden group/bar">
                                                <div className="w-1/3 h-full bg-primary-500 rounded-full relative"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-white/80 text-xs font-medium tracking-wide">
                                            <span>01:23 / 03:45</span>
                                            <span>HD 1080p</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className={`py-24 px-4 sm:px-6 lg:px-8 ${isDark ? '' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                                Built for Security,
                                <br />
                                <span className="gradient-text">Designed for Simplicity</span>
                            </h2>
                            <p className={`text-lg mb-8 ${textMuted}`}>
                                CyberVault combines enterprise-grade security with an intuitive
                                interface, making secure file sharing accessible to everyone.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary-500 flex-shrink-0" />
                                        <span className={textSecondary}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/features" className="btn-primary">
                                Explore All Features
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>

                        {/* Visual */}
                        <div className="relative">
                            <div className="glass-card p-8">
                                <div className="space-y-4">
                                    {/* Mock File Items */}
                                    {['document.pdf', 'data.xlsx', 'image.png'].map((file, i) => (
                                        <div
                                            key={file}
                                            className={`flex items-center gap-4 p-4 rounded-xl border ${isDark
                                                ? 'bg-dark-800/50 border-dark-700/50'
                                                : 'bg-white border-gray-100'
                                                }`}
                                            style={{ animationDelay: `${i * 100}ms` }}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                <Lock className="h-5 w-5 text-primary-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${textPrimary}`}>{file}</p>
                                                <p className={`text-sm ${textSubtle}`}>Encrypted • Secure</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                                Protected
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="glass-card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10" />
                        <div className="relative z-10">
                            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                                Ready to Secure Your Files?
                            </h2>
                            <p className={`text-lg mb-8 max-w-xl mx-auto ${textMuted}`}>
                                Join thousands of users who trust CyberVault for their secure
                                file storage and sharing needs.
                            </p>
                            <Link to="/register" className="btn-primary text-lg px-8 py-4">
                                Get Started Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
