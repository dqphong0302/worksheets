import React, { useState, useCallback, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';

interface MathProblem {
    num1: number;
    num2: number;
    operator: '+' | '-' | '×' | '÷';
    answer: number;
}

interface MathWorksheetPlayProps {
    title: string;
    problems: MathProblem[];
    onClose: () => void;
}

export const MathWorksheetPlay: React.FC<MathWorksheetPlayProps> = ({
    title,
    problems,
    onClose,
}) => {
    const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
    const [checkedProblems, setCheckedProblems] = useState<Set<number>>(new Set());
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // Check for completion
    useEffect(() => {
        const score = getScore();
        if (score === problems.length && checkedProblems.size === problems.length && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [checkedProblems, problems.length, showAnswer]);

    const isCorrect = (idx: number): boolean | null => {
        if (!checkedProblems.has(idx)) return null;
        const answer = parseFloat(userAnswers.get(idx) || '');
        return answer === problems[idx].answer;
    };

    const getScore = (): number => {
        let score = 0;
        checkedProblems.forEach(idx => {
            const answer = parseFloat(userAnswers.get(idx) || '');
            if (answer === problems[idx].answer) score++;
        });
        return score;
    };

    const handleInputChange = (idx: number, value: string) => {
        setUserAnswers(prev => new Map(prev).set(idx, value));
    };

    const handleCheck = (idx: number) => {
        setCheckedProblems(prev => new Set(prev).add(idx));
    };

    const handleCheckAll = () => {
        setCheckedProblems(new Set(problems.map((_, i) => i)));
    };

    const handleReset = () => {
        setUserAnswers(new Map());
        setCheckedProblems(new Set());
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            const answers = new Map<number, string>();
            problems.forEach((p, i) => answers.set(i, p.answer.toString()));
            setUserAnswers(answers);
            setCheckedProblems(new Set(problems.map((_, i) => i)));
        } else {
            setUserAnswers(new Map());
            setCheckedProblems(new Set());
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: getScore(), total: problems.length }}
        >
            <div
                className="rounded-2xl p-8"
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    }}
                >
                    {problems.map((problem, idx) => {
                        const correct = isCorrect(idx);

                        return (
                            <div
                                key={idx}
                                className="flex flex-col items-center p-4 rounded-xl transition-all duration-200"
                                style={{
                                    background: correct === null
                                        ? '#faf8f5'
                                        : correct
                                            ? '#dcfce7'
                                            : '#fef2f2',
                                    border: `2px solid ${correct === null
                                        ? '#e8e2da'
                                        : correct
                                            ? '#22c55e'
                                            : '#ef4444'
                                        }`,
                                }}
                            >
                                <div className="text-3xl font-bold mb-3" style={{ color: '#243044' }}>
                                    <span>{problem.num1}</span>
                                    <span className="mx-2" style={{ color: '#1d4f91' }}>{problem.operator}</span>
                                    <span>{problem.num2}</span>
                                    <span className="mx-2">=</span>
                                </div>

                                <input
                                    type="number"
                                    value={userAnswers.get(idx) || ''}
                                    onChange={e => handleInputChange(idx, e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleCheck(idx);
                                    }}
                                    className="w-20 h-12 text-center text-2xl font-bold rounded-lg"
                                    style={{
                                        border: '2px solid #e8e2da',
                                        outline: 'none',
                                    }}
                                    placeholder="?"
                                />

                                {correct !== null && (
                                    <div className="mt-2 text-2xl">
                                        {correct ? '✅' : '❌'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleCheckAll}
                        className="px-8 py-3 rounded-xl text-lg font-bold transition-all duration-200 hover:scale-105"
                        style={{
                            background: '#1d4f91',
                            color: 'white',
                        }}
                    >
                        Check All
                    </button>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Giỏi lắm!"
                message="Bạn đã giải xong tất cả bài toán!"
                score={{ current: getScore(), total: problems.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
