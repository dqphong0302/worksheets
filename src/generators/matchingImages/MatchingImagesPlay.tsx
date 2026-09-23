import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { MatchingImageItem } from '../../types';

interface MatchingImagesPlayProps {
    title: string;
    leftItems: MatchingImageItem[];
    rightItems: MatchingImageItem[];
    leftHasImages: boolean;
    rightHasImages: boolean;
    onClose: () => void;
}

interface Card {
    id: string;
    pairIndex: number;
    side: 'left' | 'right';
    content: string;
    imageData?: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export const MatchingImagesPlay: React.FC<MatchingImagesPlayProps> = ({
    title,
    leftItems,
    rightItems,
    leftHasImages,
    rightHasImages,
    onClose,
}) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
    const [moves, setMoves] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Initialize shuffled cards
    const initializeCards = useCallback(() => {
        const allCards: Card[] = [];

        // Add left items as cards
        leftItems.forEach((item, idx) => {
            allCards.push({
                id: `left-${idx}`,
                pairIndex: idx,
                side: 'left',
                content: item.text,
                imageData: leftHasImages ? item.imageData : undefined,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Add right items as cards
        rightItems.forEach((item, idx) => {
            allCards.push({
                id: `right-${idx}`,
                pairIndex: idx,
                side: 'right',
                content: item.text,
                imageData: rightHasImages ? item.imageData : undefined,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle cards
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlippedCards([]);
        setMatchedPairs(new Set());
        setMoves(0);
        setShowCompletion(false);
    }, [leftItems, rightItems, leftHasImages, rightHasImages]);

    useEffect(() => {
        initializeCards();
    }, [initializeCards]);

    // Check for completion
    useEffect(() => {
        if (matchedPairs.size === leftItems.length && leftItems.length > 0 && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [matchedPairs.size, leftItems.length, showAnswer]);

    const handleCardClick = (cardId: string) => {
        if (isChecking) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        // Update card to show as flipped
        setCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));

        if (newFlipped.length === 2) {
            setIsChecking(true);
            setMoves(m => m + 1);

            const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!);

            // Check if they match (same pairIndex, different sides)
            if (first.pairIndex === second.pairIndex && first.side !== second.side) {
                // Match found!
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === first.id || c.id === second.id
                            ? { ...c, isMatched: true }
                            : c
                    ));
                    setMatchedPairs(prev => new Set([...prev, first.pairIndex]));
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 500);
            } else {
                // No match - flip back
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === first.id || c.id === second.id
                            ? { ...c, isFlipped: false }
                            : c
                    ));
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    };

    const handleReset = () => {
        initializeCards();
        setShowAnswer(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            setCards(prev => prev.map(c => ({ ...c, isFlipped: true, isMatched: true })));
            setMatchedPairs(new Set(leftItems.map((_, i) => i)));
        } else {
            initializeCards();
        }
        setShowAnswer(!showAnswer);
    };

    // Calculate grid columns based on card count
    const gridCols = Math.min(6, Math.ceil(Math.sqrt(cards.length)));
    const cardSize = Math.max(80, Math.min(100, 500 / gridCols));

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: matchedPairs.size, total: leftItems.length }}
        >
            <div className="flex flex-col items-center gap-6">
                {/* Stats */}
                <div className="flex gap-6 text-white">
                    <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        Moves: <span className="font-bold">{moves}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        Pairs: <span className="font-bold">{matchedPairs.size}/{leftItems.length}</span>
                    </div>
                </div>

                {/* Card Grid */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${gridCols}, ${cardSize}px)`,
                            gap: '12px',
                        }}
                    >
                        {cards.map(card => (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className="cursor-pointer transition-all duration-300"
                                style={{
                                    width: cardSize,
                                    height: cardSize,
                                    perspective: '1000px',
                                }}
                            >
                                <div
                                    className="relative w-full h-full transition-transform duration-500"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    }}
                                >
                                    {/* Back (hidden) */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center rounded-xl font-bold text-3xl"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            background: card.isMatched
                                                ? '#2f7a4f'
                                                : '#1d4f91',
                                            color: 'white',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                        }}
                                    ></div>

                                    {/* Front (content) */}
                                    <div
                                        className="absolute inset-0 flex flex-col items-center justify-center rounded-xl p-2"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            background: card.isMatched
                                                ? '#dcfce7'
                                                : 'white',
                                            border: card.isMatched
                                                ? '3px solid #22c55e'
                                                : '2px solid #e8e2da',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        {card.imageData ? (
                                            <img
                                                src={card.imageData}
                                                alt={card.content}
                                                style={{
                                                    width: '70%',
                                                    height: '70%',
                                                    objectFit: 'contain',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                        ) : (
                                            <span
                                                className="text-center font-semibold"
                                                style={{
                                                    fontSize: Math.max(10, cardSize / 8),
                                                    color: '#243044',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {card.content}
                                            </span>
                                        )}
                                        <span
                                            className="text-xs mt-1 px-1 rounded"
                                            style={{
                                                background: card.side === 'left' ? '#dbeafe' : '#fef3c7',
                                                color: card.side === 'left' ? '#1d4f91' : '#92400e',
                                            }}
                                        >
                                            {card.side === 'left' ? 'A' : 'B'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="text-white text-sm opacity-70 text-center">
                    <p>Lật 2 thẻ để tìm cặp phù hợp (A ↔ B)</p>
                    <p>Cặp đúng sẽ giữ nguyên, cặp sai sẽ úp lại</p>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Xuất sắc!"
                message={`Bạn đã hoàn thành với ${moves} lượt!`}
                score={{ current: matchedPairs.size, total: leftItems.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
