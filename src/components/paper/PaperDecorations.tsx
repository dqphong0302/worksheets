import React from 'react';
import { StudentInfo, BorderStyle } from '../../types';

// Border SVG patterns
const BorderPatterns: Record<BorderStyle, React.ReactNode> = {
    none: null,
    simple: (
        <div style={{
            position: 'absolute',
            inset: '8mm',
            border: '2px solid #333',
            pointerEvents: 'none',
        }} />
    ),
    double: (
        <>
            <div style={{
                position: 'absolute',
                inset: '6mm',
                border: '2px solid #333',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                inset: '10mm',
                border: '1px solid #333',
                pointerEvents: 'none',
            }} />
        </>
    ),
    dotted: (
        <div style={{
            position: 'absolute',
            inset: '8mm',
            border: '3px dotted #666',
            pointerEvents: 'none',
        }} />
    ),
    decorative: (
        <div style={{
            position: 'absolute',
            inset: '6mm',
            border: '4px solid transparent',
            borderImage: 'repeating-linear-gradient(45deg, #1d4f91, #1d4f91 10px, #7fb0ee 10px, #7fb0ee 20px) 4',
            pointerEvents: 'none',
        }} />
    ),
    elegant: (
        <>
            <div style={{
                position: 'absolute',
                inset: '8mm',
                border: '1px solid #333',
                pointerEvents: 'none',
            }} />
            {/* Corner decorations */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
                const isTop = corner.includes('top');
                const isLeft = corner.includes('left');
                return (
                    <div key={corner} style={{
                        position: 'absolute',
                        [isTop ? 'top' : 'bottom']: '6mm',
                        [isLeft ? 'left' : 'right']: '6mm',
                        width: '12mm',
                        height: '12mm',
                        borderTop: isTop ? '3px double #333' : 'none',
                        borderBottom: !isTop ? '3px double #333' : 'none',
                        borderLeft: isLeft ? '3px double #333' : 'none',
                        borderRight: !isLeft ? '3px double #333' : 'none',
                        pointerEvents: 'none',
                    }} />
                );
            })}
        </>
    ),
};

interface StudentInfoBlockProps {
    studentInfo: StudentInfo;
}

export const StudentInfoBlock: React.FC<StudentInfoBlockProps> = ({ studentInfo }) => {
    if (!studentInfo.showStudentInfo) return null;

    return (
        <div style={{
            marginBottom: '1em',
            fontSize: '0.9em',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5em 2em',
        }}>
            {studentInfo.showName && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                    <span style={{ fontWeight: 500 }}>Họ tên:</span>
                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                </div>
            )}
            {studentInfo.showClass && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                    <span style={{ fontWeight: 500 }}>Lớp:</span>
                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                </div>
            )}
            {studentInfo.showDate && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                    <span style={{ fontWeight: 500 }}>Ngày:</span>
                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                </div>
            )}
            {studentInfo.showScore && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                    <span style={{ fontWeight: 500 }}>Điểm:</span>
                    <span style={{
                        width: '50px',
                        height: '30px',
                        border: '1px solid #333',
                        borderRadius: '4px',
                    }} />
                </div>
            )}
        </div>
    );
};

interface BorderDecoratorProps {
    borderStyle: BorderStyle;
}

export const BorderDecorator: React.FC<BorderDecoratorProps> = ({ borderStyle }) => {
    if (borderStyle === 'none') return null;
    return <>{BorderPatterns[borderStyle]}</>;
};
