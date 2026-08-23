import React, { useState, useCallback, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';

interface WordScramblePlayProps {
    title: string;
    words: Array<{ original: string; scrambled: string; hint?: string }>;
    onClose: () => void;
}

export const WordScramblePlay: React.FC<WordScramblePlayProps> = ({
    title,
    words,
    onClose,
}) => {
    const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
    const [showAnswer, setShowAnswer] = useState(false);
    const [checkedWords, setCheckedWords] = useState<Set<number>>(new Set());
    const [showCompletion, setShowCompletion] = useState(false);

    // Check for completion
    useEffect(() => {
        const score = getScore();
        if (score === words.length && checkedWords.size === words.length && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [checkedWords, words.length, showAnswer]);

    const isCorrect = (idx: number): boolean | null => {
        if (!checkedWords.has(idx)) return null;
        const answer = userAnswers.get(idx) || '';
        return answer.toUpperCase().trim() === words[idx].original.toUpperCase();
    };

    const getScore = (): number => {
        let score = 0;
        checkedWords.forEach(idx => {
            const answer = userAnswers.get(idx) || '';
            if (answer.toUpperCase().trim() === words[idx].original.toUpperCase()) {
                score++;
            }
        });
        return score;
    };

    const handleInputChange = (idx: number, value: string) => {
        setUserAnswers(prev => new Map(prev).set(idx, value));
    };

    const handleCheck = (idx: number) => {
        setCheckedWords(prev => new Set(prev).add(idx));
    };

    const handleReset = () => {
        setUserAnswers(new Map());
        setCheckedWords(new Set());
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            const answers = new Map<number, string>();
            words.forEach((w, i) => answers.set(i, w.original));
            setUserAnswers(answers);
            setCheckedWords(new Set(words.map((_, i) => i)));
        } else {
            setUserAnswers(new Map());
            setCheckedWords(new Set());
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: getScore(), total: words.length }}
            isComplete={getScore() === words.length}
        >
            <div
                className="rounded-2xl p-6"
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '75vh',
                    overflowY: 'auto',
                }}
            >
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                    {words.map((word, idx) => {
                        const correct = isCorrect(idx);

                        return (
                            <div
                                key={idx}
                                className="rounded-xl p-4"
                                style={{
                                    background: correct === true ? '#dcfce7' : '#f8fafc',
                                    border: `2px solid ${correct === null ? '#e2e8f0' : correct ? '#22c55e' : '#ef4444'}`,
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xl font-bold text-gray-400">
                                        {idx + 1}
                                    </span>
                                    <div
                                        className="px-4 py-2 rounded-lg font-mono text-lg tracking-widest font-bold"
                                        style={{
                                            background: '#e0e7ff',
                                            color: '#6366f1',
                                        }}
                                    >
                                        {word.scrambled}
                                    </div>
                                    {word.hint && (
                                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>
                                            💡 {word.hint}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={userAnswers.get(idx) || ''}
                                        onChange={e => handleInputChange(idx, e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleCheck(idx);
                                        }}
                                        className="flex-1 min-w-0 px-4 py-2 rounded-lg text-lg font-semibold"
                                        style={{
                                            border: '2px solid #e2e8f0',
                                            background: 'white',
                                            outline: 'none',
                                        }}
                                        placeholder="Your answer..."
                                    />
                                    <button
                                        onClick={() => handleCheck(idx)}
                                        className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 whitespace-nowrap flex-shrink-0"
                                        style={{
                                            background: correct === true ? '#22c55e' : '#6366f1',
                                            color: 'white',
                                            minWidth: '80px',
                                        }}
                                    >
                                        {correct === true ? '✓' : 'Check'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Tuyệt vời!"
                message="Bạn đã giải đúng tất cả từ xáo!"
                score={{ current: getScore(), total: words.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
