import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundFx } from '../../utils/sound';

interface PlayModeWrapperProps {
    title: string;
    onClose: () => void;
    onReset?: () => void;
    onShowAnswer?: () => void;
    score?: { current: number; total: number };
    showTimer?: boolean;
    isComplete?: boolean;
    children: React.ReactNode;
}

export const PlayModeWrapper: React.FC<PlayModeWrapperProps> = ({
    title,
    onClose,
    onReset,
    onShowAnswer,
    score,
    showTimer = true,
    isComplete = false,
    children,
}) => {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(0);
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(soundFx.isSoundEnabled());

    useEffect(() => {
        if (isComplete) return;

        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isComplete]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShowAnswer = () => {
        soundFx.playClick();
        setShowingAnswer(!showingAnswer);
        onShowAnswer?.();
    };

    const toggleSound = () => {
        const next = soundFx.toggleSound();
        setSoundEnabled(next);
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex flex-col overflow-hidden"
            style={{
                background: '#151d2b',
            }}
        >
            {/* Top Play Bar */}
            <header
                className="flex items-center justify-between px-6 py-3.5"
                style={{
                    background: 'rgba(28, 25, 23, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl"></span>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                        <span className="text-xs text-brand font-medium">Chế độ chơi tương tác trực tiếp</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {score && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                            <span className="text-xl"><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>
                            <div className="text-white text-sm font-bold">
                                {score.current} / {score.total}
                            </div>
                        </div>
                    )}

                    {showTimer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                            <span className="text-lg">⏱️</span>
                            <div className="text-white text-sm font-mono font-bold">
                                {formatTime(seconds)}
                            </div>
                        </div>
                    )}

                    {/* Sound Toggle */}
                    <button
                        type="button"
                        onClick={toggleSound}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-base transition-colors"
                        title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                    >
                        {soundEnabled ? <svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6M19.4 18.4a9 9 0 0 0 0-12.7"/></svg> : <svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>}
                    </button>

                    {/* Home Link */}
                    <button
                        type="button"
                        onClick={() => {
                            soundFx.playClick();
                            navigate('/');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors hidden sm:flex items-center gap-1.5"
                    >
                        <span></span>
                        <span>Trang chủ</span>
                    </button>

                    {/* Close / Return to Editor */}
                    <button
                        type="button"
                        onClick={() => {
                            soundFx.playClick();
                            onClose();
                        }}
                        className="w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 flex items-center justify-center font-bold text-lg transition-colors border border-red-500/30"
                        title="Đóng (quay lại chỉnh sửa)"
                    ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                </div>
            </header>

            {/* Game Canvas / Content */}
            <main className="flex-1 flex items-start justify-center p-4 sm:p-6 overflow-auto">
                {children}
            </main>

            {/* Bottom Controls Bar */}
            <footer
                className="flex items-center justify-center gap-3 px-6 py-3"
                style={{
                    background: 'rgba(28, 25, 23, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {onReset && (
                    <button
                        type="button"
                        onClick={() => {
                            soundFx.playClick();
                            setSeconds(0);
                            onReset();
                        }}
                        className="btn btn-secondary !py-2 !px-4 text-sm"
                    >
                        Chơi lại từ đầu
                    </button>
                )}

                {onShowAnswer && (
                    <button
                        type="button"
                        onClick={handleShowAnswer}
                        className={`btn ${showingAnswer ? 'btn-primary' : 'btn-secondary'} !py-2 !px-4 text-sm`}
                    >
                        {showingAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
                    </button>
                )}
            </footer>
        </div>
    );
};
