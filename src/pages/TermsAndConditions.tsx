import { Scale } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const termsSections = [
    {
        title: '1. Acceptance of Terms',
        points: [
            'By accessing or using CyberVault, you agree to be bound by these Terms & Conditions.',
            'If you do not agree with these terms, you must stop using the service.',
        ],
    },
    {
        title: '2. Account Responsibilities',
        points: [
            'You are responsible for maintaining confidentiality of your login credentials.',
            'You are responsible for all activities performed through your account.',
            'You must provide accurate information and keep your account details updated.',
        ],
    },
    {
        title: '3. Acceptable Use',
        points: [
            'You agree not to use CyberVault for unlawful, abusive, or harmful purposes.',
            'You must not attempt unauthorized access, reverse engineering, or service disruption.',
            'You are solely responsible for files and content you upload, share, or store.',
        ],
    },
    {
        title: '4. Security and Availability',
        points: [
            'CyberVault applies reasonable security controls, but no system is fully risk-free.',
            'Service availability may be interrupted for maintenance, upgrades, or force majeure events.',
        ],
    },
    {
        title: '5. Intellectual Property',
        points: [
            'CyberVault and related branding, software, and content are protected by applicable laws.',
            'You retain ownership of your uploaded content, subject to rights needed to operate the service.',
        ],
    },
    {
        title: '6. Limitation of Liability',
        points: [
            'To the maximum extent permitted by law, CyberVault is not liable for indirect or consequential damages.',
            'Use of the service is at your own risk and provided on an as-available basis.',
        ],
    },
    {
        title: '7. Changes to Terms',
        points: [
            'We may update these Terms & Conditions from time to time.',
            'Continued use after updates means you accept the revised terms.',
        ],
    },
    {
        title: '8. Contact',
        points: [
            'For legal or policy questions, contact: support@cybervault.com',
        ],
    },
];

export default function TermsAndConditions() {
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
                        <Scale className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Legal</span>
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold font-heading mb-4 ${textPrimary}`}>
                        Terms & Conditions
                    </h1>
                    <p className={textMuted}>
                        Last updated: April 3, 2026
                    </p>
                </div>

                <div className="glass-card p-6 md:p-8 space-y-8">
                    <p className={`${textBody} leading-relaxed`}>
                        These Terms & Conditions govern your use of CyberVault products and services. Please read them carefully before using the platform.
                    </p>

                    {termsSections.map((section) => (
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
                    By creating an account or using CyberVault, you agree to these Terms & Conditions.
                </p>
            </div>
        </div>
    );
}
