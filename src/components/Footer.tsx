import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';

const footerLinks = {
    product: [
        { name: 'Features', path: '/features' },
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Vault Workspace', path: '/workspace' },
    ],
    legal: [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms & Conditions', path: '/terms' },
    ],
};

const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:support@cybervault.com', label: 'Email' },
];

export default function Footer() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors: Dark mode = light text, Light mode = dark text
    const textPrimary = isDark ? 'text-dark-200' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textSubtle = isDark ? 'text-dark-500' : 'text-[#94A3B8]';

    return (
        <footer className={`pt-16 pb-8 border-t transition-colors duration-300 ${isDark
            ? 'bg-[#0b1220] border-[#334155]/50'
            : 'bg-[#F2FAF6] border-[#CBD5E1]'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <Logo className="w-6 h-6" shieldClassName="text-white" lockClassName="text-white/90" />
                            </div>
                            <span className="text-xl font-bold font-heading">
                                <span className={textPrimary}>Cyber</span>
                                <span className="text-primary-500">Vault</span>
                            </span>
                        </Link>
                        <p className={`mb-6 max-w-sm ${textMuted}`}>
                            Secure your files with military-grade encryption. CyberVault provides end-to-end encrypted storage and sharing for your sensitive data.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark
                                        ? 'bg-[#1E293B] text-dark-400 hover:text-primary-400 hover:bg-[#334155]'
                                        : 'bg-[#E4F3EC] text-[#64748B] hover:text-primary-600 hover:bg-[#d0eadd]'
                                        }`}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className={`font-semibold mb-4 ${textPrimary}`}>Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className={`hover:text-primary-500 transition-colors ${textMuted}`}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className={`font-semibold mb-4 ${textPrimary}`}>Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className={`hover:text-primary-500 transition-colors ${textMuted}`}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'border-[#334155]/50' : 'border-[#CBD5E1]'
                    }`}>
                    <p className={`text-sm ${textSubtle}`}>
                        © {new Date().getFullYear()} CyberVault. All rights reserved.
                    </p>
                    <p className={`text-sm ${textSubtle}`}>
                        Secured with 🛡️ AES-256 & RSA-2048 Encryption
                    </p>
                </div>
            </div>
        </footer>
    );
}
