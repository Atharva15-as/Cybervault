import { Shield, Lock, Eye, Users, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const values = [
    {
        icon: Lock,
        title: 'Privacy First',
        description: 'Your data belongs to you. We use zero-knowledge architecture ensuring we never access your unencrypted files.',
    },
    {
        icon: Shield,
        title: 'Security Excellence',
        description: 'Military-grade encryption with AES-256 and RSA-2048 protects your files from unauthorized access.',
    },
    {
        icon: Eye,
        title: 'Transparency',
        description: 'Clear, honest practices. We believe in open communication about how your data is handled.',
    },
    {
        icon: Users,
        title: 'User Focused',
        description: 'Built with users in mind. Simple, intuitive interface that makes security accessible to everyone.',
    },
];

const stats = [
    { value: '256-bit', label: 'AES Encryption' },
    { value: '2048-bit', label: 'RSA Keys' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'SHA-256', label: 'Integrity Check' },
];

export default function About() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
    const textSubtle = isDark ? 'text-gray-500' : 'text-gray-500';

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <Shield className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">About Us</span>
                    </div>
                    <h1 className={`section-title ${textPrimary}`}>
                        Securing Your Digital
                        <br />
                        <span className="gradient-text">Assets with Trust</span>
                    </h1>
                </div>

                {/* Mission Statement */}
                <div className="glass-card p-8 md:p-12 mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-6">
                        <Shield className="h-8 w-8 text-primary-500" />
                    </div>
                    <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${textPrimary}`}>Our Mission</h2>
                    <p className={`text-lg max-w-3xl mx-auto leading-relaxed ${textMuted}`}>
                        CyberVault was created with a singular vision: to provide individuals and organizations
                        with a secure, reliable, and user-friendly platform for storing and sharing sensitive files.
                        In an age where data breaches are commonplace, we believe everyone deserves access to
                        enterprise-grade security without the complexity.
                    </p>
                </div>

                {/* Purpose Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                <Award className="h-6 w-6 text-primary-500" />
                            </div>
                            <h3 className={`text-xl font-semibold ${textPrimary}`}>Academic Purpose</h3>
                        </div>
                        <p className={`${textMuted} leading-relaxed`}>
                            CyberVault serves as a comprehensive cybersecurity research project, demonstrating
                            practical implementation of modern encryption techniques, secure file sharing protocols,
                            and user authentication systems. It showcases the application of AES-256, RSA encryption,
                            and SHA-256 hashing in a real-world scenario.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className={`text-xl font-semibold ${textPrimary}`}>Practical Application</h3>
                        </div>
                        <p className={`${textMuted} leading-relaxed`}>
                            Beyond academic purposes, CyberVault is designed to be a production-ready secure
                            file sharing platform. It can be deployed for real-world use cases including
                            confidential document sharing, secure backup solutions, and protected file transfers
                            for individuals and businesses.
                        </p>
                    </div>
                </div>

                {/* Core Values */}
                <div className="mb-12">
                    <h3 className={`text-2xl font-bold text-center mb-8 ${textPrimary}`}>Our Core Values</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {values.map((value) => (
                            <div key={value.title} className="glass-card p-6 card-hover">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                        <value.icon className="h-6 w-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{value.title}</h4>
                                        <p className={`${textMuted} text-sm leading-relaxed`}>{value.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Stats */}
                <div className="glass-card p-8">
                    <h3 className={`text-xl font-semibold text-center mb-8 ${textPrimary}`}>Security Standards</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <p className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</p>
                                <p className={`text-sm ${textSubtle}`}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
