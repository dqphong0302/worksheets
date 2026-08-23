import React, { useState, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';

interface CryptogramPlayProps {
    title: string;
    secretMessage: string;
    keyMap: Record<string, string>;
    revealedHints: Record<string, boolean>;
    onClose: () => void;
}

export const CryptogramPlay: React.FC<CryptogramPlayProps> = ({
    title,
    secretMessage,
    keyMap,
    revealedHints,
    onClose,
}) => {
    const cleanMsg = secretMessage.toUpperCase();
    const [userGuesses, setUserGuesses] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        Object.keys(revealedHints).forEach(letter => {
            initial[letter] = letter;
        });
        return initial;
    });

    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // Split words
    const words = cleanMsg.split(' ');

    // Total letters to solve
    const distinctLetters = Array.from(new Set(cleanMsg.replace(/[^A-Z]/g, '').split('')));
    const solvedLettersCount = distinctLetters.filter(l => (userGuesses[l] || '').toUpperCase() === l).length;
    const isComplete = solvedLettersCount === distinctLetters.length && distinctLetters.length > 0;

    useEffect(() => {
        if (isComplete && !showAnswer) {
            soundFx.playVictory();
            const timer = setTimeout(() => setShowCompletion(true), 400);
            return () => clearTimeout(timer);
        }
    }, [isComplete, showAnswer]);

    const handleKeyInput = (char: string) => {
        if (!selectedLetter) return;
        soundFx.playClick();
        const upper = char.toUpperCase();
        setUserGuesses(prev => ({
            ...prev,
            [selectedLetter]: upper,
        }));

        if (upper === selectedLetter) {
            soundFx.playCorrect();
        }

        // Auto move to next unsolved letter
        const unsolved = distinctLetters.filter(l => (userGuesses[l] || '') !== l && l !== selectedLetter);
        if (unsolved.length > 0) {
            setSelectedLetter(unsolved[0]);
        }
    };

    const handleReset = () => {
        soundFx.playClick();
        const initial: Record<string, string> = {};
        Object.keys(revealedHints).forEach(letter => {
            initial[letter] = letter;
        });
        setUserGuesses(initial);
        setSelectedLetter(null);
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        soundFx.playClick();
        if (!showAnswer) {
            const full: Record<string, string> = {};
            distinctLetters.forEach(l => {
                full[l] = l;
            });
            setUserGuesses(full);
        } else {
            handleReset();
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: solvedLettersCount, total: distinctLetters.length }}
        >
            <div className="flex flex-col items-center gap-6 max-w-3xl w-full">
                {/* Score and Progress */}
                <div className="w-full flex items-center justify-between text-white text-xs font-bold px-2">
                    <span className="text-sky-300">Đã giải mã: {solvedLettersCount}/{distinctLetters.length} chữ cái</span>
                    <span>Bấm vào ô ký hiệu rồi gõ chữ cái để giải mã</span>
                </div>

                {/* Encoded Message Board */}
                <div
                    className="w-full p-6 sm:p-8 rounded-3xl border shadow-2xl flex flex-wrap gap-x-8 gap-y-6 justify-center items-center"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {words.map((word, wordIdx) => (
                        <div key={wordIdx} className="flex gap-2 items-end">
                            {word.split('').map((char, charIdx) => {
                                const isLetter = /[A-Z]/.test(char);
                                if (!isLetter) {
                                    return (
                                        <div key={charIdx} className="text-2xl font-bold text-slate-700 pb-4">
                                            {char}
                                        </div>
                                    );
                                }

                                const symbol = keyMap[char] || char;
                                const guess = userGuesses[char] || '';
                                const isSelected = selectedLetter === char;
                                const isCorrect = guess === char;

                                return (
                                    <div
                                        key={charIdx}
                                        onClick={() => {
                                            soundFx.playClick();
                                            setSelectedLetter(char);
                                        }}
                                        className="flex flex-col items-center cursor-pointer group select-none"
                                    >
                                        {/* Letter Guess Slot */}
                                        <div
                                            className={`w-9 h-11 rounded-xl flex items-center justify-center font-bold text-xl border-2 transition-all ${isSelected
                                                ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-md shadow-sky-500/30 scale-105'
                                                : isCorrect
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                                    : guess
                                                        ? 'border-amber-400 bg-amber-50 text-amber-900'
                                                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                                                }`}
                                        >
                                            {guess || ''}
                                        </div>

                                        {/* Cipher Symbol Underneath */}
                                        <div className="text-xs font-mono font-bold text-slate-500 mt-1">
                                            {symbol}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* On-screen Alphabet Keypad for Touch / Mouse */}
                <div className="w-full p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                            const isUsed = Object.values(userGuesses).includes(letter);
                            return (
                                <button
                                    key={letter}
                                    type="button"
                                    onClick={() => handleKeyInput(letter)}
                                    className={`w-8 h-10 rounded-xl font-bold text-sm transition-all transform hover:scale-110 active:scale-95 ${isUsed
                                        ? 'bg-slate-700 text-slate-400 opacity-60'
                                        : 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-sm'
                                        }`}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 GIẢI MÃ THÀNH CÔNG!"
                message={`Bạn đã giải mã hoàn toàn mật thư bí mật!`}
                score={{ current: solvedLettersCount, total: distinctLetters.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
