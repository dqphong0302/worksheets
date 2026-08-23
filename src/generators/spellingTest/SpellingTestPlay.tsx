import React, { useState, useEffect, useRef } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';

interface SpellingTestPlayProps {
    title: string;
    words: string[];
    onClose: () => void;
}

export const SpellingTestPlay: React.FC<SpellingTestPlayProps> = ({
    title,
    words,
    onClose,
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [results, setResults] = useState<Array<{ word: string; userAnswer: string; isCorrect: boolean }>>([]);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentWord = words[currentWordIndex] || '';
    const isComplete = results.length === words.length && words.length > 0;

    // Detect language of word for TTS (Vietnamese vs English)
    const isVietnameseWord = (word: string) => {
        return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(word);
    };

    const speakCurrentWord = () => {
        if (!currentWord) return;
        const lang = isVietnameseWord(currentWord) ? 'vi-VN' : 'en-US';
        soundFx.speakWord(currentWord, lang);
    };

    // Auto pronounce and focus input on question change
    useEffect(() => {
        inputRef.current?.focus();
        if (currentWord && !isComplete) {
            const timer = setTimeout(() => {
                speakCurrentWord();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentWordIndex, isComplete]);

    // Show completion popup with victory sound
    useEffect(() => {
        if (isComplete && !showAnswer) {
            soundFx.playVictory();
            const timer = setTimeout(() => setShowCompletion(true), 500);
            return () => clearTimeout(timer);
        }
    }, [isComplete, showAnswer]);

    const getScore = () => {
        return results.filter(r => r.isCorrect).length;
    };

    const handleSubmit = () => {
        if (!userInput.trim()) return;

        const isCorrect = userInput.trim().toLowerCase() === currentWord.trim().toLowerCase();

        if (isCorrect) {
            soundFx.playCorrect();
        } else {
            soundFx.playIncorrect();
        }

        setResults(prev => [...prev, {
            word: currentWord,
            userAnswer: userInput.trim(),
            isCorrect,
        }]);

        setUserInput('');
        setShowHint(false);

        if (currentWordIndex < words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleReset = () => {
        soundFx.playClick();
        setCurrentWordIndex(0);
        setUserInput('');
        setResults([]);
        setShowHint(false);
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        soundFx.playClick();
        if (!showAnswer) {
            const allResults = words.map(word => ({
                word,
                userAnswer: word,
                isCorrect: true,
            }));
            setResults(allResults);
        } else {
            handleReset();
        }
        setShowAnswer(!showAnswer);
    };

    // Generate hint (show first letter and blanks)
    const getHint = () => {
        if (!currentWord) return '';
        return currentWord[0] + ' ' + '_ '.repeat(Math.max(0, currentWord.length - 1));
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: getScore(), total: words.length }}
        >
            <div className="flex flex-col items-center gap-6" style={{ maxWidth: '600px', width: '100%' }}>
                {!isComplete ? (
                    <>
                        {/* Progress */}
                        <div className="text-white text-lg font-medium">
                            Từ <span className="font-bold text-2xl text-sky-300">{currentWordIndex + 1}</span> / {words.length}
                        </div>

                        {/* Word Display & Audio card */}
                        <div
                            className="rounded-3xl p-8 w-full"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                                textAlign: 'center',
                            }}
                        >
                            {/* Pronounce Button */}
                            <button
                                type="button"
                                onClick={speakCurrentWord}
                                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                                style={{
                                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                                    color: '#ffffff',
                                    boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
                                }}
                                title="Bấm để nghe phát âm / Click to listen"
                            >
                                🔊
                            </button>

                            <div className="text-sm font-semibold text-slate-500 mb-4">
                                Bấm biểu tượng 🔊 để nghe phát âm từ
                            </div>

                            {showHint ? (
                                <div className="text-2xl font-mono tracking-widest mb-4 py-2 px-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                                    💡 Gợi ý: {getHint()}
                                </div>
                            ) : null}

                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-6 py-4 text-2xl text-center rounded-2xl font-semibold text-slate-800"
                                style={{
                                    border: '2px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    outline: 'none',
                                }}
                                placeholder="Gõ từ bạn nghe được..."
                                autoComplete="off"
                                autoCapitalize="off"
                            />

                            <div className="flex gap-3 mt-6 justify-center flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                        soundFx.playClick();
                                        setShowHint(!showHint);
                                    }}
                                    className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105"
                                    style={{
                                        background: showHint ? '#fef3c7' : '#f1f5f9',
                                        color: showHint ? '#92400e' : '#64748b',
                                    }}
                                >
                                    💡 {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                        boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                                    }}
                                >
                                    Kiểm tra ➤
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Results */
                    <div
                        className="rounded-3xl p-8 w-full"
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                            maxHeight: '60vh',
                            overflowY: 'auto',
                        }}
                    >
                        <h3 className="text-2xl font-bold mb-4 text-center text-slate-800">📊 Kết quả chính tả</h3>
                        <div className="flex flex-col gap-2.5">
                            {results.map((result, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                                    style={{
                                        background: result.isCorrect ? '#dcfce7' : '#fef2f2',
                                        border: `1px solid ${result.isCorrect ? '#22c55e' : '#ef4444'}`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{result.isCorrect ? '✅' : '❌'}</span>
                                        <span className="font-bold text-slate-600">{idx + 1}.</span>
                                        <span
                                            className="font-medium text-lg"
                                            style={{
                                                textDecoration: result.isCorrect ? 'none' : 'line-through',
                                                color: result.isCorrect ? '#166534' : '#dc2626',
                                            }}
                                        >
                                            {result.userAnswer || '(Trống)'}
                                        </span>
                                        {!result.isCorrect && (
                                            <span className="text-emerald-700 font-bold text-lg">
                                                → {result.word}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const lang = isVietnameseWord(result.word) ? 'vi-VN' : 'en-US';
                                            soundFx.speakWord(result.word, lang);
                                        }}
                                        className="text-lg p-1.5 rounded-lg hover:bg-black/5"
                                        title="Nghe lại"
                                    >
                                        🔊
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Progress bullets */}
                {!isComplete && results.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {results.map((result, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{
                                    background: result.isCorrect ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                                    color: 'white',
                                }}
                            >
                                {result.isCorrect ? '✓' : '✗'} Từ {idx + 1}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Chúc Mừng Bạn Đã Hoàn Thành!"
                message={`Bạn đã đạt ${getScore()}/${words.length} từ đúng!`}
                score={{ current: getScore(), total: words.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
