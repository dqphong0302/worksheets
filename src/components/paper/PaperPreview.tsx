import React from 'react';
import { PaperSize, BorderStyle } from '../../types';

interface PaperPreviewProps {
    paperSize: PaperSize;
    scale?: number;
    borderStyle?: BorderStyle;
    children: React.ReactNode;
    className?: string;
    id?: string;
}

export const PaperPreview = React.forwardRef<HTMLDivElement, PaperPreviewProps>(
    ({ paperSize, scale = 0.6, borderStyle = 'none', children, className = '', id }, ref) => {
        const paperClass = paperSize === 'a4' ? 'paper-a4' : 'paper-letter';
        // Base unscaled dimensions in pixels (96 DPI)
        const unscaledWidth = paperSize === 'a4' ? 794 : 816; // 210mm vs 8.5in
        const unscaledHeight = paperSize === 'a4' ? 1123 : 1056; // 297mm vs 11in

        const getBorderStyle = (): React.CSSProperties => {
            switch (borderStyle) {
                case 'simple':
                    return {
                        border: '2px solid #334155',
                        borderRadius: '4px',
                        padding: '16mm',
                    };
                case 'double':
                    return {
                        border: '4px double #0f172a',
                        borderRadius: '4px',
                        padding: '16mm',
                    };
                case 'dotted':
                    return {
                        border: '3px dashed #64748b',
                        borderRadius: '8px',
                        padding: '16mm',
                    };
                case 'decorative':
                    return {
                        border: '3px solid #0284c7',
                        outline: '2px dashed #38bdf8',
                        outlineOffset: '-8px',
                        padding: '16mm',
                    };
                case 'elegant':
                    return {
                        border: '2px solid #475569',
                        boxShadow: 'inset 0 0 0 4px #ffffff, inset 0 0 0 6px #475569',
                        padding: '16mm',
                    };
                case 'none':
                default:
                    return {
                        padding: '16mm',
                    };
            }
        };

        return (
            <div
                className="paper-scale-wrapper"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    width: '100%',
                    margin: '0 auto',
                    paddingBottom: '2rem',
                }}
            >
                <div
                    ref={ref}
                    id={id}
                    className={`paper paper-preview ${paperClass} ${className}`}
                    style={{
                        zoom: scale,
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        margin: '0 auto',
                    }}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            ...getBorderStyle(),
                            boxSizing: 'border-box',
                            minHeight: '100%',
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    }
);

PaperPreview.displayName = 'PaperPreview';
