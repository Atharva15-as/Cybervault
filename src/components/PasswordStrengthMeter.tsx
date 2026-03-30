import { useTheme } from '../context/ThemeContext';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

interface PasswordStrengthMeterProps {
    password: string;
}

function calculateStrength(password: string): { score: number; label: string; color: string; icon: React.ElementType } {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated chars penalty
    if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters penalty

    // Normalize to 0-4
    const normalized = Math.max(0, Math.min(4, Math.round(score * 4 / 7)));

    const levels = [
        { label: 'Very Weak', color: 'red', icon: ShieldX },
        { label: 'Weak', color: 'orange', icon: ShieldAlert },
        { label: 'Fair', color: 'yellow', icon: Shield },
        { label: 'Strong', color: 'blue', icon: ShieldCheck },
        { label: 'Very Strong', color: 'green', icon: ShieldCheck },
    ];

    return { score: normalized, ...levels[normalized] };
}

const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    red: { bar: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
    orange: { bar: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    blue: { bar: 'bg-primary-500', text: 'text-primary-500', bg: 'bg-primary-500/10' },
    green: { bar: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/10' },
};

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!password) return null;

    const strength = calculateStrength(password);
    const colors = colorMap[strength.color];
    const Icon = strength.icon;

    return (
        <div className="mt-2 mb-1">
            {/* Strength Bars */}
            <div className="flex gap-1 mb-2">
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength.score - 1
                            ? colors.bar
                            : isDark ? 'bg-dark-700' : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            {/* Label */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>
                        {strength.label}
                    </span>
                </div>
                {strength.score < 3 && (
                    <span className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-dark-400'}`}>
                        {strength.score < 2 ? 'Add numbers & symbols' : 'Almost there!'}
                    </span>
                )}
            </div>
        </div>
    );
}
