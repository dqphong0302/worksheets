import React, { useState, useCallback, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';

interface MatchingPlayProps {
    title: string;
    leftItems: string[];
    rightItems: string[];
    correctPairs: Map<number, number>; // left index -> right index
    onClose: () => void;
}

export const MatchingPlay: React.FC<MatchingPlayProps> = ({
    title,
    leftItems,
    rightItems,
    correctPairs,
    onClose,
}) => {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [connections, setConnections] = useState<Map<number, number>>(new Map());
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // Check for completion
    useEffect(() => {
        const score = getScore();
        if (score === leftItems.length && connections.size === leftItems.length && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [connections, leftItems.length, showAnswer]);

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#84cc16'];

    const handleLeftClick = (idx: number) => {
        if (connections.has(idx)) {
            // Remove existing connection
            setConnections(prev => {
                const next = new Map(prev);
                next.delete(idx);
                return next;
            });
        } else {
            setSelectedLeft(idx);
        }
    };

    const handleRightClick = (idx: number) => {
        if (selectedLeft === null) return;

        // Check if this right item is already connected
        const existingLeft = [...connections.entries()].find(([_, r]) => r === idx)?.[0];
        if (existingLeft !== undefined) {
            setConnections(prev => {
                const next = new Map(prev);
                next.delete(existingLeft);
                return next;
            });
        }

        setConnections(prev => new Map(prev).set(selectedLeft, idx));
        setSelectedLeft(null);
    };

    const isCorrect = (leftIdx: number): boolean | null => {
        const rightIdx = connections.get(leftIdx);
        if (rightIdx === undefined) return null;
        return correctPairs.get(leftIdx) === rightIdx;
    };

    const getScore = (): number => {
        let score = 0;
        connections.forEach((rightIdx, leftIdx) => {
            if (correctPairs.get(leftIdx) === rightIdx) score++;
        });
        return score;
    };

    const handleReset = () => {
        setConnections(new Map());
        setSelectedLeft(null);
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            setConnections(new Map(correctPairs));
        } else {
            setConnections(new Map());
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: getScore(), total: leftItems.length }}
            isComplete={getScore() === leftItems.length && connections.size === leftItems.length}
        >
            <div className="flex gap-20 items-center">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    {leftItems.map((item, idx) => {
                        const isConnected = connections.has(idx);
                        const correct = isCorrect(idx);
                        const colorIdx = idx % colors.length;

                        return (
                            <div
                                key={idx}
                                className="px-6 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-3"
                                style={{
                                    background: isConnected
                                        ? correct
                                            ? colors[colorIdx]
                                            : '#ef4444'
                                        : selectedLeft === idx
                                            ? 'rgba(99, 102, 241, 0.8)'
                                            : 'rgba(255, 255, 255, 0.9)',
                                    color: isConnected || selectedLeft === idx ? 'white' : '#1e293b',
                                    minWidth: '150px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                }}
                                onClick={() => handleLeftClick(idx)}
                            >
                                <span className="text-lg font-bold opacity-50">{idx + 1}</span>
                                <span className="text-lg font-semibold">{item}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Connection Lines SVG */}
                <svg
                    width="100"
                    height={Math.max(leftItems.length, rightItems.length) * 70}
                    style={{ overflow: 'visible' }}
                >
                    {[...connections.entries()].map(([leftIdx, rightIdx]) => {
                        const colorIdx = leftIdx % colors.length;
                        const y1 = leftIdx * 70 + 35;
                        const y2 = rightIdx * 70 + 35;
                        const correct = correctPairs.get(leftIdx) === rightIdx;

                        return (
                            <line
                                key={`${leftIdx}-${rightIdx}`}
                                x1="0"
                                y1={y1}
                                x2="100"
                                y2={y2}
                                stroke={correct ? colors[colorIdx] : '#ef4444'}
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    {rightItems.map((item, idx) => {
                        const connectedFrom = [...connections.entries()].find(([_, r]) => r === idx)?.[0];
                        const isConnected = connectedFrom !== undefined;
                        const colorIdx = connectedFrom !== undefined ? connectedFrom % colors.length : 0;
                        const correct = connectedFrom !== undefined && correctPairs.get(connectedFrom) === idx;

                        return (
                            <div
                                key={idx}
                                className="px-6 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-3"
                                style={{
                                    background: isConnected
                                        ? correct
                                            ? colors[colorIdx]
                                            : '#ef4444'
                                        : 'rgba(255, 255, 255, 0.9)',
                                    color: isConnected ? 'white' : '#1e293b',
                                    minWidth: '150px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                }}
                                onClick={() => handleRightClick(idx)}
                            >
                                <span className="text-lg font-bold opacity-50">{String.fromCharCode(65 + idx)}</span>
                                <span className="text-lg font-semibold">{item}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Xuất sắc!"
                message="Bạn đã nối đúng tất cả các cặp!"
                score={{ current: getScore(), total: leftItems.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
