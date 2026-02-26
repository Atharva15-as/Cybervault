import { useState, useEffect } from 'react';

interface DetectionRingProps {
    detections: number;
    total: number;
    threatScore: number;
    verdict: 'clean' | 'suspicious' | 'malicious';
    size?: number;
    animated?: boolean;
}

export default function DetectionRing({ detections, total, threatScore, verdict, size = 220, animated = true }: DetectionRingProps) {
    const [animatedDetections, setAnimatedDetections] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        if (!animated) {
            setAnimatedDetections(detections);
            setAnimatedScore(threatScore);
            return;
        }
        let frame = 0;
        const totalFrames = 60;
        const interval = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedDetections(Math.round(detections * eased));
            setAnimatedScore(Math.round(threatScore * eased));
            if (frame >= totalFrames) clearInterval(interval);
        }, 25);
        return () => clearInterval(interval);
    }, [detections, threatScore, animated]);

    const center = size / 2;
    const strokeWidth = 12;
    const radius = center - strokeWidth - 8;
    const circumference = 2 * Math.PI * radius;
    const detectionRatio = total > 0 ? animatedDetections / total : 0;
    const dashOffset = circumference * (1 - detectionRatio);

    const colors = {
        clean: { ring: '#39ff14', glow: 'rgba(57,255,20,0.4)', bg: 'rgba(57,255,20,0.05)' },
        suspicious: { ring: '#ffe600', glow: 'rgba(255,230,0,0.4)', bg: 'rgba(255,230,0,0.05)' },
        malicious: { ring: '#ff3344', glow: 'rgba(255,51,68,0.4)', bg: 'rgba(255,51,68,0.05)' },
    };
    const c = colors[verdict];

    const innerRadius = radius - 20;
    const segments = 72;
    const segmentAngle = (2 * Math.PI) / segments;

    return (
        <div className="detection-ring" style={{ width: size, height: size, position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <filter id="ringGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={c.ring} />
                        <stop offset="100%" stopColor={verdict === 'malicious' ? '#ff00e5' : verdict === 'suspicious' ? '#ff6b00' : '#00fff5'} />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(30,30,58,0.8)" strokeWidth={strokeWidth} />

                {/* Inner tick segments */}
                {Array.from({ length: segments }).map((_, i) => {
                    const angle = i * segmentAngle - Math.PI / 2;
                    const isDetected = i < Math.round(segments * detectionRatio);
                    const x1 = center + (innerRadius - 4) * Math.cos(angle);
                    const y1 = center + (innerRadius - 4) * Math.sin(angle);
                    const x2 = center + (innerRadius + 6) * Math.cos(angle);
                    const y2 = center + (innerRadius + 6) * Math.sin(angle);
                    return (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={isDetected ? c.ring : 'rgba(40,40,70,0.6)'}
                            strokeWidth={1.5} strokeLinecap="round"
                            opacity={isDetected ? 0.9 : 0.3}
                        />
                    );
                })}

                {/* Main detection arc */}
                <circle cx={center} cy={center} r={radius} fill="none"
                    stroke="url(#ringGrad)" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={dashOffset}
                    strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
                    filter="url(#ringGlow)"
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />

                {/* Center background */}
                <circle cx={center} cy={center} r={innerRadius - 10} fill={c.bg} />

                {/* Detection count */}
                <text x={center} y={center - 18} textAnchor="middle" fill={c.ring}
                    fontSize="36" fontWeight="800" fontFamily="'Inter', sans-serif">
                    {animatedDetections}
                </text>
                <text x={center} y={center + 2} textAnchor="middle" fill="rgba(200,200,224,0.5)"
                    fontSize="12" fontFamily="'Inter', sans-serif">
                    /{total} engines
                </text>

                {/* Threat score */}
                <text x={center} y={center + 26} textAnchor="middle" fill={c.ring}
                    fontSize="11" fontWeight="600" fontFamily="'Inter', sans-serif"
                    letterSpacing="2">
                    SCORE: {animatedScore}
                </text>

                {/* Verdict label */}
                <text x={center} y={center + 46} textAnchor="middle" fill={c.ring}
                    fontSize="10" fontWeight="700" fontFamily="'Inter', sans-serif"
                    letterSpacing="3" textDecoration="none"
                    opacity={0.8}>
                    {verdict.toUpperCase()}
                </text>
            </svg>
        </div>
    );
}
