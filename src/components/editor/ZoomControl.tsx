import React, { useEffect, useRef } from 'react';

interface ZoomControlProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, onZoomChange }) => {
    const controlRef = useRef<HTMLDivElement>(null);

    // Handle wheel zoom on the preview area (works without Ctrl now)
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            // Allow zoom with Ctrl/Meta key OR when hovering on editor-preview
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                onZoomChange(Math.max(0.3, Math.min(1.5, zoom + delta)));
            }
        };

        // Listen on preview container
        const preview = document.querySelector('.editor-preview');
        if (preview) {
            preview.addEventListener('wheel', handleWheel as EventListener, { passive: false });
        }

        return () => {
            if (preview) {
                preview.removeEventListener('wheel', handleWheel as EventListener);
            }
        };
    }, [zoom, onZoomChange]);

    // Handle wheel on the zoom control itself (no modifier key needed)
    useEffect(() => {
        const control = controlRef.current;
        if (!control) return;

        const handleControlWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            onZoomChange(Math.max(0.3, Math.min(1.5, zoom + delta)));
        };

        control.addEventListener('wheel', handleControlWheel, { passive: false });
        return () => control.removeEventListener('wheel', handleControlWheel);
    }, [zoom, onZoomChange]);

    return (
        <div
            ref={controlRef}
            className="glass-strong flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-floating"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '32px',
                zIndex: 100,
                cursor: 'ns-resize',
            }}
            title="Scroll to zoom"
        >
            <button
                onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-medium transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                }}
            >
                −
            </button>

            <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={zoom}
                onChange={e => onZoomChange(parseFloat(e.target.value))}
                className="w-28 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                    accentColor: 'oklch(58% 0.18 280)',
                    background: 'var(--bg-tertiary)',
                }}
            />

            <span
                className="text-sm font-semibold min-w-[48px] text-center"
                style={{ color: 'var(--text-primary)' }}
            >
                {Math.round(zoom * 100)}%
            </span>

            <button
                onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-medium transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                }}
            >
                +
            </button>

            <span
                className="text-xs ml-2"
                style={{ color: 'var(--text-muted)' }}
                title="Cuộn chuột trên thanh này để zoom"
            >
                🖱️
            </span>
        </div>
    );
};
