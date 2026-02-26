import { Shield, Lock } from 'lucide-react';

interface LogoProps {
    className?: string;
    shieldClassName?: string;
    lockClassName?: string;
}

export default function Logo({
    className = "w-10 h-10",
    shieldClassName = "text-primary-500",
    lockClassName = "text-primary-500"
}: LogoProps) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Shield className={`w-full h-full ${shieldClassName}`} />
            {/* Lock centered inside shield */}
            <Lock className={`absolute w-[40%] h-[40%] translate-y-[5%] ${lockClassName}`} />
        </div>
    );
}
