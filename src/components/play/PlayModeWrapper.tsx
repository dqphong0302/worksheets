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
                background: 'radial-gradient(ellipse 90% 70% at 50% 20%, #1e293b 0%, #0b0f19 100%)',
            }}
        >
            {/* Top Play Bar */}
            <header
                className="flex items-center justify-between px-6 py-3.5"
                style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎮</span>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                        <span className="text-xs text-sky-400 font-medium">Chế độ chơi tương tác trực tiếp</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {score && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                            <span className="text-xl">🏆</span>
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
                        {soundEnabled ? '🔊' : '🔇'}
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
                        <span>🏠</span>
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
                    >
                        ✕
                    </button>
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
                    background: 'rgba(15, 23, 42, 0.85)',
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
                        🔄 Chơi lại từ đầu
                    </button>
                )}

                {onShowAnswer && (
                    <button
                        type="button"
                        onClick={handleShowAnswer}
                        className={`btn ${showingAnswer ? 'btn-primary' : 'btn-secondary'} !py-2 !px-4 text-sm`}
                    >
                        👁️ {showingAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
                    </button>
                )}
            </footer>
        </div>
    );
};
