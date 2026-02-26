import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);
    const [displayLocation, setDisplayLocation] = useState(location);

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setIsVisible(false);
            const timeout = setTimeout(() => {
                setDisplayLocation(location);
                setIsVisible(true);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [location, displayLocation]);

    return (
        <div
            className={`transition-all duration-300 ease-out ${isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
        >
            {children}
        </div>
    );
}
