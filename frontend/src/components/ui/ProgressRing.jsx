const ProgressRing = ({
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    color = 'var(--primary)',
    bgColor = '#E0E0E0',
    label,
    showValue = true,
    displayValue // New prop for localized text
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(value / max, 1);
    const offset = circumference - percent * circumference;

    return (
        <div className="stat-card">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    className="progress-ring"
                    width={size}
                    height={size}
                >
                    {/* Background circle */}
                    <circle
                        stroke={bgColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress circle */}
                    <circle
                        className="progress-ring-circle"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        style={{
                            strokeDasharray: `${circumference} ${circumference}`,
                            strokeDashoffset: offset
                        }}
                    />
                </svg>
                {showValue && (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ transform: 'rotate(0deg)' }}
                    >
                        <span className="stat-value" style={{ fontSize: size / 3.5 }}>
                            {displayValue !== undefined ? displayValue : value}
                        </span>
                    </div>
                )}
            </div>
            {label && <span className="stat-label mt-1">{label}</span>}
        </div>
    );
};

export default ProgressRing;
