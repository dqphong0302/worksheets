import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';

interface FindIdenticalItem {
    id: string;
    imageData?: string;
    imageUrl?: string;
    label?: string;
}

interface FindIdenticalPlayProps {
    title: string;
    items: FindIdenticalItem[];
    gridSize?: number; // 4x4, 6x6, etc
    onClose: () => void;
}

interface Card {
    id: string;
    itemId: string;
    imageData?: string;
    imageUrl?: string;
    label?: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export const FindIdenticalPlay: React.FC<FindIdenticalPlayProps> = ({
    title,
    items,
    gridSize = 4,
    onClose,
}) => {
    // Create pairs of cards
    const initialCards = useMemo(() => {
        const cards: Card[] = [];
        items.forEach((item, idx) => {
            // Create two cards for each item (pair)
            cards.push({
                id: `${item.id}-a`,
                itemId: item.id,
                imageData: item.imageData,
                imageUrl: item.imageUrl,
                label: item.label,
                isFlipped: false,
                isMatched: false,
            });
            cards.push({
                id: `${item.id}-b`,
                itemId: item.id,
                imageData: item.imageData,
                imageUrl: item.imageUrl,
                label: item.label,
                isFlipped: false,
                isMatched: false,
            });
        });
        // Shuffle cards
        return cards.sort(() => Math.random() - 0.5);
    }, [items]);

    const [cards, setCards] = useState<Card[]>(initialCards);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [moves, setMoves] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const matchedCount = cards.filter(c => c.isMatched).length / 2;
    const totalPairs = items.length;

    // Check for matches
    useEffect(() => {
        if (selectedCards.length === 2) {
            setIsChecking(true);
            const [first, second] = selectedCards;
            const firstCard = cards.find(c => c.id === first);
            const secondCard = cards.find(c => c.id === second);

            if (firstCard && secondCard && firstCard.itemId === secondCard.itemId) {
                // Match found!
                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isMatched: true }
                            : card
                    ));
                    setSelectedCards([]);
                    setIsChecking(false);
                }, 600);
            } else {
                // No match - flip back
                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isFlipped: false }
                            : card
                    ));
                    setSelectedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
            setMoves(m => m + 1);
        }
    }, [selectedCards, cards]);

    // Check for completion
    useEffect(() => {
        if (matchedCount === totalPairs && totalPairs > 0) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [matchedCount, totalPairs]);

    const handleCardClick = useCallback((cardId: string) => {
        if (isChecking) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;
        if (selectedCards.length >= 2) return;

        setCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));
        setSelectedCards(prev => [...prev, cardId]);
    }, [cards, selectedCards, isChecking]);

    const handleReset = () => {
        const shuffled = [...initialCards].sort(() => Math.random() - 0.5).map(c => ({
            ...c,
            isFlipped: false,
            isMatched: false,
        }));
        setCards(shuffled);
        setSelectedCards([]);
        setMoves(0);
        setShowCompletion(false);
    };

    const cols = Math.ceil(Math.sqrt(cards.length));
    const cardSize = Math.min(120, (600 - (cols - 1) * 8) / cols);

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            score={{ current: matchedCount, total: totalPairs }}
        >
            <div className="flex flex-col items-center gap-6">
                {/* Moves counter */}
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl text-white" style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                    }}>
                        <span className="text-lg">🎯 Lượt: <strong>{moves}</strong></span>
                    </div>
                    <div className="px-4 py-2 rounded-xl text-white" style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                    }}>
                        <span className="text-lg">✅ Tìm thấy: <strong>{matchedCount}/{totalPairs}</strong></span>
                    </div>
                </div>

                {/* Card Grid */}
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${cols}, ${cardSize}px)`,
                    }}
                >
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="relative cursor-pointer transition-all duration-300"
                            style={{
                                width: cardSize,
                                height: cardSize,
                                perspective: '1000px',
                            }}
                            onClick={() => handleCardClick(card.id)}
                        >
                            <div
                                className="absolute inset-0 transition-transform duration-500"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0)',
                                }}
                            >
                                {/* Card Front (Hidden) */}
                                <div
                                    className="absolute inset-0 rounded-xl flex items-center justify-center text-4xl"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    ❓
                                </div>

                                {/* Card Back (Revealed) */}
                                <div
                                    className="absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        background: card.isMatched
                                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                            : 'white',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {(card.imageData || card.imageUrl) ? (
                                        <img
                                            src={card.imageData || card.imageUrl}
                                            alt={card.label || 'item'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-gray-800">
                                            {card.label || '?'}
                                        </span>
                                    )}
                                    {card.isMatched && (
                                        <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                                            <span className="text-4xl">✓</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <p className="text-white/70 text-center">
                    🖱️ Click vào các thẻ để lật. Tìm các cặp hình giống nhau!
                </p>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Tuyệt vời!"
                message={`Bạn đã tìm hết ${totalPairs} cặp hình trong ${moves} lượt!`}
                score={{ current: matchedCount, total: totalPairs }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
