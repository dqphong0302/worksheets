import React from 'react';
import { useTranslation } from 'react-i18next';
import { soundFx } from '../../utils/sound';

interface CompletionPopupProps {
    show: boolean;
    title?: string;
    message?: string;
    score?: { current: number; total: number };
    onPlayAgain: () => void;
    onClose: () => void;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({
    show,
    title,
    message,
    score,
    onPlayAgain,
    onClose,
}) => {
    const { i18n } = useTranslation();
    if (!show) return null;

    const percentage = score && score.total > 0 ? Math.round((score.current / score.total) * 100) : 100;
    const defaultTitle = i18n.language === 'vi' ? '🎉 Hoàn Thành Xuất Sắc!' : '🎉 Excellent Job!';
    const defaultMessage = i18n.language === 'vi' ? 'Bạn đã giải xong toàn bộ bài tập!' : 'You have completed the entire worksheet!';

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                animation: 'fade-in 0.25s ease-out',
            }}
        >
            <div
                className="rounded-3xl p-8 text-center max-w-sm w-full border"
                style={{
                    background: '#1c2636',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    boxShadow: '0 25px 60px -10px rgba(56, 189, 248, 0.4)',
                    animation: 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Trophy / Star */}
                <div className="text-7xl mb-3 animate-bounce"><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-2 text-white">
                    {title || defaultTitle}
                </h2>

                {/* Message */}
                <p className="text-ink-subtle text-sm mb-5">
                    {message || defaultMessage}
                </p>

                {/* Score badge */}
                {score && (
                    <div className="mb-5 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-3xl font-bold text-emerald-400">
                            {score.current}
                        </span>
                        <span className="text-emerald-500 text-lg">/</span>
                        <span className="text-xl font-bold text-ink-subtle">
                            {score.total}
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                            {percentage}%
                        </span>
                    </div>
                )}

                {/* Performance Stars */}
                <div className="flex justify-center gap-1.5 mb-6 text-3xl">
                    {[1, 2, 3].map(star => (
                        <span
                            key={star}
                            style={{
                                opacity: percentage >= star * 33 ? 1 : 0.25,
                                transform: percentage >= star * 33 ? 'scale(1.1)' : 'scale(0.9)',
                                transition: 'transform 0.3s ease',
                            }}
                        ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.5 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.02a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z"/></svg></span>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => {
                            soundFx.playClick();
                            onPlayAgain();
                        }}
                        className="btn btn-success flex-1 !py-3"
                    >
                        {i18n.language === 'vi' ? 'Chơi lại' : 'Play Again'}
                    </button>
                    <button
                        onClick={() => {
                            soundFx.playClick();
                            onClose();
                        }}
                        className="btn btn-secondary flex-1 !py-3"
                    >
                        {i18n.language === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
