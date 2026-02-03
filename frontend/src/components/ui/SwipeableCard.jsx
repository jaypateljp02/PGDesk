import { useState, useRef } from 'react';

/**
 * SwipeableCard - A component that supports swipe gestures for mobile
 * 
 * Usage:
 * <SwipeableCard
 *   onSwipeLeft={() => console.log('Swiped left')}
 *   onSwipeRight={() => console.log('Swiped right')}
 *   leftAction={{ icon: <Trash />, color: 'red', label: 'Delete' }}
 *   rightAction={{ icon: <Check />, color: 'green', label: 'Done' }}
 * >
 *   <YourContent />
 * </SwipeableCard>
 */
const SwipeableCard = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftAction,
    rightAction,
    threshold = 80
}) => {
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const handleTouchStart = (e) => {
        startXRef.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        currentXRef.current = e.touches[0].clientX;
        const diff = currentXRef.current - startXRef.current;

        // Limit swipe distance
        const limitedDiff = Math.max(-150, Math.min(150, diff));
        setTranslateX(limitedDiff);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        if (translateX < -threshold && onSwipeLeft) {
            onSwipeLeft();
        } else if (translateX > threshold && onSwipeRight) {
            onSwipeRight();
        }

        // Reset position with animation
        setTranslateX(0);
    };

    const showLeftAction = translateX < -30 && leftAction;
    const showRightAction = translateX > 30 && rightAction;

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Left action (shown when swiping right) */}
            {rightAction && (
                <div
                    className="absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity"
                    style={{
                        backgroundColor: rightAction.color || 'var(--success)',
                        opacity: showRightAction ? 1 : 0,
                        width: Math.abs(translateX)
                    }}
                >
                    <div className="text-white flex flex-col items-center gap-1">
                        {rightAction.icon}
                        <span className="text-xs">{rightAction.label}</span>
                    </div>
                </div>
            )}

            {/* Right action (shown when swiping left) */}
            {leftAction && (
                <div
                    className="absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity"
                    style={{
                        backgroundColor: leftAction.color || 'var(--error)',
                        opacity: showLeftAction ? 1 : 0,
                        width: Math.abs(translateX)
                    }}
                >
                    <div className="text-white flex flex-col items-center gap-1">
                        {leftAction.icon}
                        <span className="text-xs">{leftAction.label}</span>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                }}
                className="bg-white relative z-10"
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeableCard;
