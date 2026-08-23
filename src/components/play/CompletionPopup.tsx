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
                    background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    boxShadow: '0 25px 60px -10px rgba(56, 189, 248, 0.4)',
                    animation: 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Trophy / Star */}
                <div className="text-7xl mb-3 animate-bounce">
                    🏆
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
                    {title || defaultTitle}
                </h2>

                {/* Message */}
                <p className="text-slate-300 text-sm mb-5">
                    {message || defaultMessage}
                </p>

                {/* Score badge */}
                {score && (
                    <div className="mb-5 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-3xl font-black text-emerald-400">
                            {score.current}
                        </span>
                        <span className="text-emerald-500 text-lg">/</span>
                        <span className="text-xl font-bold text-slate-300">
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
                        >
                            ⭐
                        </span>
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
                        🔄 {i18n.language === 'vi' ? 'Chơi lại' : 'Play Again'}
                    </button>
                    <button
                        onClick={() => {
                            soundFx.playClick();
                            onClose();
                        }}
                        className="btn btn-secondary flex-1 !py-3"
                    >
                        ✕ {i18n.language === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
