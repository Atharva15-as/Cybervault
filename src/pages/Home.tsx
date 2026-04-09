import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Upload, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import ParticleNetwork from '../components/ParticleNetwork';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Home() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    const textPrimary = isDark ? 'text-dark-200' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textSubtle = isDark ? 'text-dark-500' : 'text-[#94A3B8]';

    const handleUploadEntry = () => {
        if (!user) {
            navigate('/login', {
                state: {
                    action: 'upload',
                    from: { pathname: '/workspace' },
                },
            });
            return;
        }
        addToast({
            type: 'info',
            title: 'Upload Your File',
            message: 'Continue in the workspace to upload and encrypt your file.',
        });
        navigate('/workspace');
    };

    return (
        <div className="pt-20">
            <section className="min-h-[90vh] flex items-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
                <div className="absolute inset-0 z-0"><ParticleNetwork /></div>
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6 animate-fade-in">
                                <Shield className="h-4 w-4 text-primary-500" />
                                <span className="text-sm text-primary-500 font-medium">End-to-End Encrypted</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading mb-6 animate-slide-up">
                                <span className={textPrimary}>CyberVault -</span><br />
                                <span className="gradient-text">Secure Your Files</span><br />
                                <span className={textPrimary}>with End-to-End Encryption</span>
                            </h1>

                            <p className={`text-lg lg:text-xl mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up animation-delay-150 ${textMuted}`}>
                                Store, encrypt, and share files with military-grade security.
                                Powered by AES-256 encryption - because your privacy matters.
                            </p>

                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8 animate-slide-up animation-delay-300">
                                <Link to="/converter" className="btn-primary">
                                    Converter
                                </Link>
                                <Link to="/features" className="btn-secondary">
                                    See All Features
                                </Link>
                            </div>

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

                        <div className="relative animate-fade-in animation-delay-300 lg:mt-24">
                            <div className={`glass-card p-8 border-2 border-dashed relative overflow-hidden ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="btn-primary inline-flex"
                                        onClick={handleUploadEntry}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload File
                                    </button>
                                    <p className={`text-base font-medium mt-3 ${textMuted}`}>
                                        Upload your confidential files for secure encryption.
                                    </p>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="py-0 relative z-10 -mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card p-8 md:p-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            {[
                                { value: 'AES-256', label: 'Encryption Standard' },
                                { value: 'RSA-2048', label: 'Key Exchange' },
                                { value: 'SHA-256', label: 'Integrity Check' },
                                { value: 'TLS 1.3', label: 'Transport Security' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center justify-center p-4">
                                    <p className="text-2xl md:text-3xl font-bold text-primary-500 mb-2 font-heading">{stat.value}</p>
                                    <p className={`text-sm ${textMuted}`}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <section className={`py-24 px-4 sm:px-6 lg:px-8 ${isDark ? '' : 'bg-[#E4F3EC]'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${textPrimary}`}>
                                Built for Security,<br />
                                <span className="gradient-text">Designed for Simplicity</span>
                            </h2>
                            <p className={`text-lg mb-8 ${textMuted}`}>
                                CyberVault combines enterprise-grade security with an intuitive
                                interface, making secure file sharing accessible to everyone.
                            </p>
                            <div className={`p-6 rounded-2xl border mb-8 ${isDark ? 'bg-[#1E293B]/50 border-dark-600' : 'bg-white border-gray-200'} shadow-sm`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-primary-500" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${textPrimary}`}>File Protection</h3>
                                </div>
                                <p className={textMuted}>
                                    Every file you upload is immediately secured with AES-256 encryption, whether it is a PDF, image, dataset, or archive. Your files remain completely protected at rest and during transit.
                                </p>
                            </div>
                            <Link to="/features" className="btn-primary">
                                Explore More Features
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="glass-card p-8">
                                <div className="space-y-4">
                                    {['archive.zip', 'data.csv', 'photo.png'].map((file, i) => (
                                        <div key={file} className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-[#1E293B]/50 border-[#334155]/50' : 'bg-[#F9FEFC] border-[#CBD5E1]'}`} style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                <Lock className="h-5 w-5 text-primary-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${textPrimary}`}>{file}</p>
                                                <p className={`text-sm ${textSubtle}`}>Encrypted - Secure</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">Protected</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
