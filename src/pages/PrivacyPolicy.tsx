import { ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const sections = [
    {
        title: '1. Information We Collect',
        points: [
            'Account details such as name, email address, and authentication data.',
            'Usage information, including feature access, device/browser metadata, and activity logs.',
            'Encrypted file metadata required for secure storage, sharing, and access control.',
        ],
    },
    {
        title: '2. How We Use Information',
        points: [
            'To provide and maintain secure file encryption, storage, and sharing services.',
            'To improve product reliability, detect abuse, and protect platform security.',
            'To communicate important account, security, and service-related updates.',
        ],
    },
    {
        title: '3. Data Security',
        points: [
            'CyberVault uses encryption-in-transit and encryption-at-rest protections.',
            'We implement access controls, monitoring, and incident response procedures.',
            'You are responsible for protecting your account credentials and recovery methods.',
        ],
    },
    {
        title: '4. Data Sharing and Disclosure',
        points: [
            'We do not sell your personal data.',
            'We may share data with trusted processors strictly for hosting, security, and infrastructure operations.',
            'We may disclose information when required by law or to protect legal rights and user safety.',
        ],
    },
    {
        title: '5. Your Rights and Choices',
        points: [
            'You may request access, correction, or deletion of your personal information.',
            'You may manage account preferences and communication settings where available.',
            'You may contact us for privacy requests or policy clarifications.',
        ],
    },
    {
        title: '6. Contact',
        points: [
            'For privacy-related questions, contact: support@cybervault.com',
        ],
    },
];

export default function PrivacyPolicy() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textBody = isDark ? 'text-dark-300' : 'text-[#334155]';
    const textSubtle = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <ShieldCheck className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Legal</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Privacy Policy
                    </h1>
                    <p className={textMuted}>
                        Last updated: April 3, 2026
                    </p>
                </div>

                <div className="glass-card p-6 md:p-8 space-y-8">
                    <p className={`${textBody} leading-relaxed`}>
                        This Privacy Policy explains how CyberVault collects, uses, protects, and discloses information when you use our services.
                    </p>

                    {sections.map((section) => (
                        <section key={section.title}>
                            <h2 className={`text-lg md:text-xl font-semibold mb-3 ${textPrimary}`}>
                                {section.title}
                            </h2>
                            <ul className="space-y-2">
                                {section.points.map((point) => (
                                    <li key={point} className={`flex items-start gap-3 ${textBody}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2.5 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <p className={`mt-6 text-sm ${textSubtle}`}>
                    By using CyberVault, you acknowledge and agree to this Privacy Policy.
                </p>
            </div>
        </div>
    );
}
