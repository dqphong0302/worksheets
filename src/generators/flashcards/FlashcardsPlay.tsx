import React, { useState, useEffect, useMemo } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';
import { FlashcardItem } from '../../types';

type MiniGameMode = 'trainer' | 'pictureQuiz' | 'memoryMatch' | 'audioQuiz';

interface FlashcardsPlayProps {
    title: string;
    items: FlashcardItem[];
    onClose: () => void;
}

export const FlashcardsPlay: React.FC<FlashcardsPlayProps> = ({
    title,
    items,
    onClose,
}) => {
    const [gameMode, setGameMode] = useState<MiniGameMode>('trainer');
    const [showCompletion, setShowCompletion] = useState(false);
    const [score, setScore] = useState(0);

    // ==========================================
    // 1. GAME MODE: 3D FLASHCARD TRAINER
    // ==========================================
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
    const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());

    const currentCard = items[currentIndex];

    useEffect(() => {
        setIsFlipped(false);
        if (currentCard && gameMode === 'trainer') {
            soundFx.speakWord(currentCard.frontText);
        }
    }, [currentIndex, gameMode]);

    const handleTrainerFlip = () => {
        soundFx.playClick();
        setIsFlipped(prev => !prev);
    };

    const handleMarkMastered = () => {
        soundFx.playCorrect();
        if (!currentCard) return;
        setMasteredIds(prev => new Set(prev).add(currentCard.id));
        setReviewIds(prev => {
            const next = new Set(prev);
            next.delete(currentCard.id);
            return next;
        });
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            soundFx.playVictory();
            setScore(masteredIds.size + 1);
            setShowCompletion(true);
        }
    };

    const handleMarkReview = () => {
        soundFx.playIncorrect();
        if (!currentCard) return;
        setReviewIds(prev => new Set(prev).add(currentCard.id));
        setMasteredIds(prev => {
            const next = new Set(prev);
            next.delete(currentCard.id);
            return next;
        });
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            soundFx.playVictory();
            setScore(masteredIds.size);
            setShowCompletion(true);
        }
    };

    // ==========================================
    // 2. GAME MODE: PICTURE-WORD QUIZ
    // ==========================================
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const quizCurrentCard = items[quizIndex];

    const quizOptions = useMemo(() => {
        if (!quizCurrentCard || items.length === 0) return [];
        const options = [quizCurrentCard.frontText];
        const otherWords = items
            .filter(it => it.id !== quizCurrentCard.id)
            .map(it => it.frontText);
        
        // Shuffle other options
        const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
        for (const w of shuffledOthers) {
            if (options.length < 4) options.push(w);
        }
        return options.sort(() => Math.random() - 0.5);
    }, [quizIndex, items, quizCurrentCard]);

    const handleAnswerQuiz = (chosenWord: string) => {
        if (isAnswered || !quizCurrentCard) return;
        setSelectedOption(chosenWord);
        setIsAnswered(true);

        if (chosenWord === quizCurrentCard.frontText) {
            soundFx.playCorrect();
            soundFx.speakWord(chosenWord);
            setQuizScore(prev => prev + 10);
        } else {
            soundFx.playIncorrect();
        }

        setTimeout(() => {
            if (quizIndex < items.length - 1) {
                setQuizIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                soundFx.playVictory();
                setScore(quizScore + (chosenWord === quizCurrentCard.frontText ? 10 : 0));
                setShowCompletion(true);
            }
        }, 1200);
    };

    // ==========================================
    // 3. GAME MODE: MEMORY VISUAL MATCH
    // ==========================================
    interface MemoryCard {
        uid: string;
        cardId: string;
        type: 'image' | 'word';
        content: string; // imageUrl or word
        label?: string;
        isFlipped: boolean;
        isMatched: boolean;
    }

    const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [turns, setTurns] = useState(0);

    const initMemoryGame = () => {
        const pool = items.slice(0, 8); // Max 8 pairs = 16 cards
        const deck: MemoryCard[] = [];

        pool.forEach((it, idx) => {
            // Image card
            deck.push({
                uid: `img-${idx}`,
                cardId: it.id,
                type: 'image',
                content: it.imageUrl || it.iconOrEmoji || '✨',
                label: it.backText,
                isFlipped: false,
                isMatched: false,
            });
            // Word card
            deck.push({
                uid: `word-${idx}`,
                cardId: it.id,
                type: 'word',
                content: it.frontText,
                label: it.ipa,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle deck
        setMemoryCards(deck.sort(() => Math.random() - 0.5));
        setFlippedIndices([]);
        setTurns(0);
    };

    const handleFlipMemoryCard = (index: number) => {
        if (flippedIndices.length === 2) return;
        if (memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

        soundFx.playClick();
        const updated = [...memoryCards];
        updated[index].isFlipped = true;
        setMemoryCards(updated);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setTurns(prev => prev + 1);
            const first = updated[newFlipped[0]];
            const second = updated[newFlipped[1]];

            if (first.cardId === second.cardId) {
                // Match!
                soundFx.playCorrect();
                const matchedItem = items.find(it => it.id === first.cardId);
                if (matchedItem) soundFx.speakWord(matchedItem.frontText);

                setTimeout(() => {
                    setMemoryCards(prev =>
                        prev.map((c, i) =>
                            i === newFlipped[0] || i === newFlipped[1]
                                ? { ...c, isMatched: true }
                                : c
                        )
                    );
                    setFlippedIndices([]);

                    // Check victory
                    const allMatched = updated.every((c, i) =>
                        i === newFlipped[0] || i === newFlipped[1] ? true : c.isMatched
                    );
                    if (allMatched) {
                        soundFx.playVictory();
                        setScore(Math.max(100 - turns * 5, 20));
                        setShowCompletion(true);
                    }
                }, 600);
            } else {
                // Not match
                soundFx.playIncorrect();
                setTimeout(() => {
                    setMemoryCards(prev =>
                        prev.map((c, i) =>
                            i === newFlipped[0] || i === newFlipped[1]
                                ? { ...c, isFlipped: false }
                                : c
                        )
                    );
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    // ==========================================
    // 4. GAME MODE: AUDIO LISTENING CHALLENGE
    // ==========================================
    const [audioQuizIndex, setAudioQuizIndex] = useState(0);
    const [audioScore, setAudioScore] = useState(0);
    const [selectedAudioCardId, setSelectedAudioCardId] = useState<string | null>(null);

    const audioCurrentCard = items[audioQuizIndex];

    const audioOptions = useMemo(() => {
        if (!audioCurrentCard || items.length === 0) return [];
        const options = [audioCurrentCard];
        const others = items.filter(it => it.id !== audioCurrentCard.id).sort(() => Math.random() - 0.5);
        for (const it of others) {
            if (options.length < 4) options.push(it);
        }
        return options.sort(() => Math.random() - 0.5);
    }, [audioQuizIndex, items, audioCurrentCard]);

    useEffect(() => {
        if (gameMode === 'audioQuiz' && audioCurrentCard) {
            setTimeout(() => soundFx.speakWord(audioCurrentCard.frontText), 400);
        }
    }, [audioQuizIndex, gameMode]);

    useEffect(() => {
        if (gameMode === 'memoryMatch') {
            initMemoryGame();
        }
    }, [gameMode]);

    const handleSelectAudioOption = (opt: FlashcardItem) => {
        if (selectedAudioCardId || !audioCurrentCard) return;
        setSelectedAudioCardId(opt.id);

        if (opt.id === audioCurrentCard.id) {
            soundFx.playCorrect();
            setAudioScore(prev => prev + 15);
        } else {
            soundFx.playIncorrect();
        }

        setTimeout(() => {
            if (audioQuizIndex < items.length - 1) {
                setAudioQuizIndex(prev => prev + 1);
                setSelectedAudioCardId(null);
            } else {
                soundFx.playVictory();
                setScore(audioScore + (opt.id === audioCurrentCard.id ? 15 : 0));
                setShowCompletion(true);
            }
        }, 1200);
    };

    return (
        <PlayModeWrapper title={title} onClose={onClose}>
            <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center">
                {/* Mini-Game Navigation Bar */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl w-full max-w-xl shadow-inner">
                    <button
                        onClick={() => { soundFx.playClick(); setGameMode('trainer'); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gameMode === 'trainer' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'}`}
                    >
                        <span>🗂️</span>
                        <span>Thẻ 3D</span>
                    </button>
                    <button
                        onClick={() => { soundFx.playClick(); setGameMode('pictureQuiz'); setQuizIndex(0); setQuizScore(0); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gameMode === 'pictureQuiz' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'}`}
                    >
                        <span>🎯</span>
                        <span>Đoán Tranh</span>
                    </button>
                    <button
                        onClick={() => { soundFx.playClick(); setGameMode('memoryMatch'); initMemoryGame(); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gameMode === 'memoryMatch' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'}`}
                    >
                        <span>🧩</span>
                        <span>Lật Ghép Cặp</span>
                    </button>
                    <button
                        onClick={() => { soundFx.playClick(); setGameMode('audioQuiz'); setAudioQuizIndex(0); setAudioScore(0); }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gameMode === 'audioQuiz' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'}`}
                    >
                        <span>🎧</span>
                        <span>Nghe & Chọn</span>
                    </button>
                </div>

                {/* ======================================================== */}
                {/* 1. 3D FLASHCARD TRAINER VIEW */}
                {/* ======================================================== */}
                {gameMode === 'trainer' && currentCard && (
                    <div className="w-full flex flex-col items-center">
                        {/* Progress Bar */}
                        <div className="w-full max-w-md flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Thẻ {currentIndex + 1} / {items.length}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Đã thuộc: {masteredIds.size}</span>
                        </div>
                        <div className="w-full max-w-md h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                            />
                        </div>

                        {/* 3D Flip Card Container */}
                        <div
                            onClick={handleTrainerFlip}
                            className="cursor-pointer perspective-1000 w-full max-w-md h-96 relative group"
                        >
                            <div
                                className={`w-full h-full rounded-3xl p-6 transition-transform duration-500 transform-style-3d shadow-2xl flex flex-col items-center justify-between border-2 border-indigo-200 dark:border-indigo-800 ${isFlipped ? 'rotate-y-180 bg-gradient-to-br from-indigo-900 to-slate-900 text-white' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'}`}
                            >
                                {!isFlipped ? (
                                    /* Front Side: AI Image + Term + IPA */
                                    <>
                                        <div className="w-full flex justify-between items-center text-xs text-slate-400">
                                            <span className="badge badge-primary">{currentCard.partOfSpeech || 'Vocabulary'}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    soundFx.speakWord(currentCard.frontText);
                                                }}
                                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-lg"
                                                title="Phát âm tiếng Anh"
                                            >
                                                🔊
                                            </button>
                                        </div>

                                        {currentCard.imageUrl ? (
                                            <img
                                                src={currentCard.imageUrl}
                                                alt={currentCard.frontText}
                                                className="w-44 h-44 object-cover rounded-2xl shadow-md border border-slate-100 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="text-6xl my-4">{currentCard.iconOrEmoji || '✨'}</div>
                                        )}

                                        <div className="text-center">
                                            <h3 className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                                                {currentCard.frontText}
                                            </h3>
                                            {currentCard.ipa && (
                                                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">
                                                    {currentCard.ipa}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <span>👆 Bấm để xem nghĩa tiếng Việt</span>
                                        </div>
                                    </>
                                ) : (
                                    /* Back Side: Vietnamese Meaning + Example */
                                    <div className="transform-rotate-y-180 h-full w-full flex flex-col justify-between items-center text-center py-2">
                                        <div className="badge badge-indigo">Nghĩa tiếng Việt & Ví dụ</div>

                                        <div className="my-auto">
                                            <h3 className="text-3xl font-black text-emerald-400 mb-2">
                                                {currentCard.backText}
                                            </h3>
                                            {currentCard.exampleEn && (
                                                <div className="p-3 bg-white/10 rounded-2xl mt-4 text-xs italic text-slate-200">
                                                    "{currentCard.exampleEn}"
                                                </div>
                                            )}
                                            {currentCard.exampleVi && (
                                                <p className="text-xs text-slate-400 mt-1.5">
                                                    → {currentCard.exampleVi}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-xs text-indigo-300">
                                            Bấm lần nữa để lật lại mặt trước
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons: Review vs Mastered */}
                        <div className="flex gap-4 mt-6 w-full max-w-md">
                            <button
                                onClick={handleMarkReview}
                                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                            >
                                <span>🔄</span>
                                <span>Cần ôn lại</span>
                            </button>
                            <button
                                onClick={handleMarkMastered}
                                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                            >
                                <span>⭐</span>
                                <span>Đã thuộc</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ======================================================== */}
                {/* 2. PICTURE-WORD QUIZ VIEW */}
                {/* ======================================================== */}
                {gameMode === 'pictureQuiz' && quizCurrentCard && (
                    <div className="w-full max-w-md flex flex-col items-center animate-fadeIn">
                        <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500 mb-4">
                            <span>Câu {quizIndex + 1} / {items.length}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Điểm: {quizScore}</span>
                        </div>

                        {/* Picture Display */}
                        <div className="w-full h-56 bg-white dark:bg-slate-800 rounded-3xl p-3 shadow-xl border-2 border-indigo-100 dark:border-indigo-900 flex items-center justify-center mb-6 overflow-hidden">
                            {quizCurrentCard.imageUrl ? (
                                <img
                                    src={quizCurrentCard.imageUrl}
                                    alt="Quiz target"
                                    className="h-full w-full object-contain rounded-2xl"
                                />
                            ) : (
                                <span className="text-7xl">{quizCurrentCard.iconOrEmoji || '🖼️'}</span>
                            )}
                        </div>

                        <div className="text-center font-bold text-sm text-slate-700 dark:text-slate-200 mb-4">
                            Bức tranh minh họa cho từ tiếng Anh nào?
                        </div>

                        {/* 4 Choices */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {quizOptions.map((optWord, idx) => {
                                const isCorrect = optWord === quizCurrentCard.frontText;
                                const isChosen = selectedOption === optWord;
                                let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-indigo-500';

                                if (isAnswered) {
                                    if (isCorrect) btnStyle = 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg';
                                    else if (isChosen) btnStyle = 'bg-rose-500 text-white border-rose-500 animate-shake';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerQuiz(optWord)}
                                        disabled={isAnswered}
                                        className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-base shadow-sm transition-all text-center ${btnStyle}`}
                                    >
                                        {optWord}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ======================================================== */}
                {/* 3. MEMORY VISUAL MATCH VIEW */}
                {/* ======================================================== */}
                {gameMode === 'memoryMatch' && (
                    <div className="w-full max-w-lg flex flex-col items-center animate-fadeIn">
                        <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500 mb-4">
                            <span>Lật ghép cặp Tranh - Từ</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Số lượt: {turns}</span>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-4 gap-3 w-full">
                            {memoryCards.map((card, idx) => (
                                <button
                                    key={card.uid}
                                    onClick={() => handleFlipMemoryCard(idx)}
                                    disabled={card.isMatched || card.isFlipped}
                                    className={`aspect-square rounded-2xl p-2 border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-md ${card.isMatched ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-500 opacity-60' : card.isFlipped ? 'bg-white dark:bg-slate-800 border-indigo-500 scale-105' : 'bg-gradient-to-br from-indigo-500 to-sky-600 border-transparent text-white hover:scale-105'}`}
                                >
                                    {card.isFlipped || card.isMatched ? (
                                        card.type === 'image' ? (
                                            card.content.startsWith('http') ? (
                                                <img src={card.content} alt="Card" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <span className="text-3xl">{card.content}</span>
                                            )
                                        ) : (
                                            <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400 text-center leading-tight">
                                                {card.content}
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-2xl font-black opacity-80">❓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ======================================================== */}
                {/* 4. AUDIO LISTENING CHALLENGE VIEW */}
                {/* ======================================================== */}
                {gameMode === 'audioQuiz' && audioCurrentCard && (
                    <div className="w-full max-w-md flex flex-col items-center animate-fadeIn">
                        <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500 mb-4">
                            <span>Luyện nghe {audioQuizIndex + 1} / {items.length}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Điểm: {audioScore}</span>
                        </div>

                        {/* Big Speaker Play Button */}
                        <div className="mb-6 text-center">
                            <button
                                onClick={() => soundFx.speakWord(audioCurrentCard.frontText)}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-4xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform mx-auto mb-2"
                            >
                                🔊
                            </button>
                            <span className="text-xs text-slate-500 font-medium">Bấm vào loa để nghe lại âm thanh</span>
                        </div>

                        {/* 4 Picture Choices */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {audioOptions.map((opt) => {
                                const isCorrect = opt.id === audioCurrentCard.id;
                                const isChosen = selectedAudioCardId === opt.id;
                                let borderStyle = 'border-slate-200 dark:border-slate-700 hover:border-indigo-500';

                                if (selectedAudioCardId) {
                                    if (isCorrect) borderStyle = 'border-emerald-500 ring-4 ring-emerald-400/30 scale-105';
                                    else if (isChosen) borderStyle = 'border-rose-500 ring-4 ring-rose-400/30';
                                }

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelectAudioOption(opt)}
                                        disabled={!!selectedAudioCardId}
                                        className={`aspect-square bg-white dark:bg-slate-800 rounded-2xl p-2 border-2 shadow-md flex flex-col items-center justify-center transition-all ${borderStyle}`}
                                    >
                                        {opt.imageUrl ? (
                                            <img src={opt.imageUrl} alt={opt.frontText} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <span className="text-5xl">{opt.iconOrEmoji || '🖼️'}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Victory / Completion Modal */}
            <CompletionPopup
                show={showCompletion}
                score={{ current: score, total: Math.max(score, items.length * 10) }}
                title="🏆 Chiến Thắng Mini-Game!"
                message="Bạn đã hoàn thành xuất sắc thử thách từ vựng và hình ảnh!"
                onPlayAgain={() => {
                    setShowCompletion(false);
                    setCurrentIndex(0);
                    setMasteredIds(new Set());
                    setReviewIds(new Set());
                    setQuizIndex(0);
                    setQuizScore(0);
                    setAudioQuizIndex(0);
                    setAudioScore(0);
                    initMemoryGame();
                }}
                onClose={onClose}
            />
        </PlayModeWrapper>
    );
};
