// src/components/ui/Slider.tsx
import React, { useState, useRef, useEffect } from 'react';

interface SliderProps {
    min: number;
    max: number;
    step: number;
    value: number[];
    onValueChange: (value: number[]) => void;
    className?: string;
    disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({
    min,
    max,
    step,
    value,
    onValueChange,
    className = '',
    disabled = false
}) => {
    const [dragging, setDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const currentValue = value[0];
    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;

        const track = trackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);

        const newValue = min + Math.round((max - min) * percent / step) * step;
        onValueChange([newValue]);
    };

    const handleMouseDown = () => {
        if (disabled) return;
        setDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (!dragging || disabled) return;

            const track = trackRef.current;
            if (!track) return;

            const rect = track.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);

            const newValue = min + Math.round((max - min) * percent / step) * step;
            onValueChange([newValue]);
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, min, max, step, onValueChange, disabled]);

    return (
        <div
            className={`relative h-5 w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleTrackClick}
            ref={trackRef}
        >
            {/* Track background */}
            <div className="absolute inset-y-0 w-full my-2 rounded-full bg-gray-200"></div>

            {/* Active track */}
            <div
                className="absolute inset-y-0 my-2 rounded-full bg-indigo-500"
                style={{ width: `${percentage}%` }}
            ></div>

            {/* Thumb */}
            <div
                className="absolute top-0 -ml-1.5 h-5 w-5 rounded-full border-2 border-indigo-500 bg-white shadow"
                style={{ left: `${percentage}%` }}
                onMouseDown={handleMouseDown}
            ></div>
        </div>
    );
};

export default Slider;
