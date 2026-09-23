import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { WordSearchResult, WordSearchPlacement, WordSearchImageItem } from '../../types';

interface WordSearchImagesPlayProps {
    title: string;
    result: WordSearchResult;
    items: WordSearchImageItem[];
    onClose: () => void;
}

interface CellPosition {
    row: number;
    col: number;
}

export const WordSearchImagesPlay: React.FC<WordSearchImagesPlayProps> = ({
    title,
    result,
    items,
    onClose,
}) => {
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [selecting, setSelecting] = useState(false);
    const [startCell, setStartCell] = useState<CellPosition | null>(null);
    const [currentCell, setCurrentCell] = useState<CellPosition | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [highlightedCells, setHighlightedCells] = useState<Map<string, string>>(new Map());
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const words = items.map(item => item.word);

    // Show completion popup when all words found
    useEffect(() => {
        if (foundWords.size === words.length && words.length > 0 && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [foundWords.size, words.length, showAnswer]);

    // Get cells between two positions (must be in a line)
    const getCellsBetween = useCallback((start: CellPosition, end: CellPosition): CellPosition[] => {
        const cells: CellPosition[] = [];
        const rowDiff = end.row - start.row;
        const colDiff = end.col - start.col;

        const maxDiff = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
        if (maxDiff === 0) return [start];

        const rowStep = rowDiff !== 0 ? rowDiff / Math.abs(rowDiff) : 0;
        const colStep = colDiff !== 0 ? colDiff / Math.abs(colDiff) : 0;

        if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
            return [start];
        }

        for (let i = 0; i <= maxDiff; i++) {
            cells.push({
                row: start.row + rowStep * i,
                col: start.col + colStep * i,
            });
        }

        return cells;
    }, []);

    // Check if selected word matches any placement
    const checkWord = useCallback((cells: CellPosition[]): WordSearchPlacement | null => {
        const selected = cells.map(c => result.grid[c.row]?.[c.col] || '').join('');
        const reversed = selected.split('').reverse().join('');

        for (const placement of result.placements) {
            if (placement.word === selected || placement.word === reversed) {
                return placement;
            }
        }
        return null;
    }, [result]);

    const handleMouseDown = (row: number, col: number) => {
        setSelecting(true);
        setStartCell({ row, col });
        setCurrentCell({ row, col });
        setSelectedCells(new Set([`${row}-${col}`]));
    };

    const handleMouseMove = (row: number, col: number) => {
        if (!selecting || !startCell) return;

        setCurrentCell({ row, col });
        const cells = getCellsBetween(startCell, { row, col });
        setSelectedCells(new Set(cells.map(c => `${c.row}-${c.col}`)));
    };

    const handleMouseUp = () => {
        if (!selecting || !startCell || !currentCell) {
            setSelecting(false);
            setSelectedCells(new Set());
            return;
        }

        const cells = getCellsBetween(startCell, currentCell);
        const matchedPlacement = checkWord(cells);

        if (matchedPlacement && !foundWords.has(matchedPlacement.word)) {
            setFoundWords(prev => new Set([...prev, matchedPlacement.word]));

            const colors = ['#22c55e', '#1d4f91', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
            const colorIndex = foundWords.size % colors.length;
            const color = colors[colorIndex];

            setHighlightedCells(prev => {
                const next = new Map(prev);
                cells.forEach(c => next.set(`${c.row}-${c.col}`, color));
                return next;
            });
        }

        setSelecting(false);
        setStartCell(null);
        setCurrentCell(null);
        setSelectedCells(new Set());
    };

    const handleReset = () => {
        setFoundWords(new Set());
        setHighlightedCells(new Map());
        setShowAnswer(false);
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            const colors = ['#22c55e', '#1d4f91', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
            const newHighlights = new Map<string, string>();

            result.placements.forEach((placement, idx) => {
                const color = colors[idx % colors.length];
                for (let i = 0; i < placement.word.length; i++) {
                    const row = placement.startRow + placement.direction.row * i;
                    const col = placement.startCol + placement.direction.col * i;
                    newHighlights.set(`${row}-${col}`, color);
                }
            });

            setHighlightedCells(newHighlights);
            setFoundWords(new Set(words));
        } else {
            setHighlightedCells(new Map());
            setFoundWords(new Set());
        }
        setShowAnswer(!showAnswer);
    };

    const cellSize = Math.min(38, Math.floor(420 / result.grid.length));

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: foundWords.size, total: words.length }}
        >
            <div className="flex gap-8 items-start" style={{ maxHeight: '75vh', overflow: 'auto' }}>
                {/* Word Search Grid */}
                <div
                    ref={gridRef}
                    className="rounded-2xl p-3"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        flexShrink: 0,
                    }}
                    onMouseLeave={() => {
                        if (selecting) handleMouseUp();
                    }}
                >
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: `repeat(${result.grid[0]?.length || 10}, ${cellSize}px)`,
                            gap: '2px',
                            userSelect: 'none',
                        }}
                    >
                        {result.grid.map((row, rowIdx) =>
                            row.map((letter, colIdx) => {
                                const key = `${rowIdx}-${colIdx}`;
                                const isSelected = selectedCells.has(key);
                                const highlightColor = highlightedCells.get(key);

                                return (
                                    <div
                                        key={key}
                                        className="flex items-center justify-center cursor-pointer font-bold transition-all duration-150"
                                        style={{
                                            width: cellSize,
                                            height: cellSize,
                                            fontSize: cellSize * 0.5,
                                            borderRadius: '6px',
                                            background: highlightColor
                                                ? highlightColor
                                                : isSelected
                                                    ? 'rgba(29, 79, 145, 0.3)'
                                                    : '#f6f2ed',
                                            color: highlightColor ? 'white' : '#243044',
                                            border: isSelected ? '2px solid #1d4f91' : '2px solid transparent',
                                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                        onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                                        onMouseMove={() => handleMouseMove(rowIdx, colIdx)}
                                        onMouseUp={handleMouseUp}
                                    >
                                        {letter}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Image List */}
                <div
                    className="rounded-2xl p-4"
                    style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(12px)',
                        maxWidth: '250px',
                    }}
                >
                    <h3 className="text-lg font-bold text-white mb-4">Find these words</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {items.map((item, idx) => {
                            const isFound = foundWords.has(item.word);
                            return (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center p-2 rounded-lg transition-all duration-300"
                                    style={{
                                        background: isFound ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                                        opacity: isFound ? 0.7 : 1,
                                    }}
                                >
                                    {item.imageData ? (
                                        <img
                                            src={item.imageData}
                                            alt={item.word}
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                filter: isFound ? 'grayscale(50%)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '24px',
                                            }}
                                        ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg></div>
                                    )}
                                    <span
                                        className="text-xs font-medium text-white mt-1"
                                        style={{
                                            textDecoration: isFound ? 'line-through' : 'none',
                                        }}
                                    >
                                        {isFound && '✓ '}{item.word}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Tuyệt vời!"
                message="Bạn đã tìm hết tất cả từ!"
                score={{ current: foundWords.size, total: words.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
