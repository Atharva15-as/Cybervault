import { useState } from 'react';
import { Mail, Send, MessageSquare, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Contact() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
    const textSubtle = isDark ? 'text-gray-500' : 'text-gray-500';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate form submission
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 1500);
    };

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email',
            value: 'support@cybervault.com',
            description: 'Send us an email anytime',
        },
        {
            icon: MessageSquare,
            title: 'Live Chat',
            value: 'Available 24/7',
            description: 'Chat with our support team',
        },
        {
            icon: Clock,
            title: 'Response Time',
            value: 'Within 24 hours',
            description: 'We respond quickly',
        },
    ];

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                        <Mail className="h-4 w-4 text-primary-500" />
                        <span className="text-sm text-primary-500 font-medium">Get in Touch</span>
                    </div>
                    <h1 className={`section-title ${textPrimary}`}>
                        Contact
                        <span className="gradient-text"> Us</span>
                    </h1>
                    <p className={`section-subtitle mt-4 ${textMuted}`}>
                        Have questions about CyberVault? We're here to help.
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {contactInfo.map((info) => (
                        <div key={info.title} className="glass-card p-6 text-center card-hover">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/20 mb-4">
                                <info.icon className="h-6 w-6 text-primary-500" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-1 ${textPrimary}`}>{info.title}</h3>
                            <p className="text-primary-500 font-medium mb-1">{info.value}</p>
                            <p className={`text-sm ${textSubtle}`}>{info.description}</p>
                        </div>
                    ))}
                </div>

                {/* Contact Form */}
                <div className="glass-card p-8 md:p-12">
                    {submitted ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                                <Send className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className={`text-2xl font-bold mb-3 ${textPrimary}`}>Message Sent!</h3>
                            <p className={`${textMuted} mb-6`}>
                                Thank you for contacting us. We'll get back to you within 24 hours.
                            </p>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({ name: '', email: '', message: '' });
                                }}
                                className="btn-secondary"
                            >
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label htmlFor="name" className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com"
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="message" className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="How can we help you?"
                                    className="input-field resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary w-full md:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Additional Info */}
                <div className="mt-12 text-center">
                    <p className={`${textSubtle} text-sm`}>
                        For security-related inquiries, please email us at{' '}
                        <a href="mailto:security@cybervault.com" className="text-primary-500 hover:underline">
                            security@cybervault.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
