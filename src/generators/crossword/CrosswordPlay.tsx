import React, { useState, useCallback, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { CrosswordResult, CrosswordPlacement } from '../../types';

interface CrosswordPlayProps {
    title: string;
    result: CrosswordResult;
    onClose: () => void;
}

interface CellState {
    row: number;
    col: number;
    userLetter: string;
    correctLetter: string;
    isCorrect: boolean | null;
}

export const CrosswordPlay: React.FC<CrosswordPlayProps> = ({
    title,
    result,
    onClose,
}) => {
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [direction, setDirection] = useState<'across' | 'down'>('across');
    const [userInput, setUserInput] = useState<Map<string, string>>(new Map());
    const [showAnswer, setShowAnswer] = useState(false);
    const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
    const [showCompletion, setShowCompletion] = useState(false);

    // Get current clue based on selected cell
    const getCurrentClue = useCallback((): CrosswordPlacement | null => {
        if (!selectedCell) return null;

        const clues = direction === 'across' ? result.acrossClues : result.downClues;
        for (const clue of clues) {
            for (let i = 0; i < clue.word.length; i++) {
                const r = clue.row + (clue.direction === 'down' ? i : 0);
                const c = clue.col + (clue.direction === 'across' ? i : 0);
                if (r === selectedCell.row && c === selectedCell.col) {
                    return clue;
                }
            }
        }
        return null;
    }, [selectedCell, direction, result]);

    // Check if a word is complete
    const checkWordComplete = useCallback((placement: CrosswordPlacement): boolean => {
        for (let i = 0; i < placement.word.length; i++) {
            const r = placement.row + (placement.direction === 'down' ? i : 0);
            const c = placement.col + (placement.direction === 'across' ? i : 0);
            const key = `${r}-${c}`;
            const userLetter = userInput.get(key) || '';
            if (userLetter.toUpperCase() !== placement.word[i].toUpperCase()) {
                return false;
            }
        }
        return true;
    }, [userInput]);

    // Update completed words when input changes
    useEffect(() => {
        const newCompleted = new Set<string>();
        [...result.acrossClues, ...result.downClues].forEach(placement => {
            if (checkWordComplete(placement)) {
                newCompleted.add(`${placement.direction}-${placement.number}`);
            }
        });
        setCompletedWords(newCompleted);

        // Check for game completion
        const totalWords = result.acrossClues.length + result.downClues.length;
        if (newCompleted.size === totalWords && totalWords > 0 && !showAnswer) {
            setTimeout(() => setShowCompletion(true), 500);
        }
    }, [userInput, result, checkWordComplete, showAnswer]);

    const handleCellClick = (row: number, col: number) => {
        const cell = result.grid[row]?.[col];
        if (!cell || cell.isBlack) return;

        // Check which clues this cell belongs to
        const hasAcross = result.acrossClues.some(clue => {
            for (let i = 0; i < clue.word.length; i++) {
                if (clue.row === row && clue.col + i === col) return true;
            }
            return false;
        });

        const hasDown = result.downClues.some(clue => {
            for (let i = 0; i < clue.word.length; i++) {
                if (clue.row + i === row && clue.col === col) return true;
            }
            return false;
        });

        if (selectedCell?.row === row && selectedCell?.col === col) {
            // Toggle direction on same cell (only if both directions available)
            if (hasAcross && hasDown) {
                setDirection(d => d === 'across' ? 'down' : 'across');
            }
        } else {
            setSelectedCell({ row, col });

            // Auto-set direction based on what's available
            if (hasDown && !hasAcross) {
                setDirection('down');
            } else if (hasAcross && !hasDown) {
                setDirection('across');
            }
            // If both available, keep current direction
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const key = `${row}-${col}`;

        // Helper function to find next valid cell
        const findNextCell = (startRow: number, startCol: number, dir: 'across' | 'down'): { row: number; col: number } | null => {
            let r = dir === 'down' ? startRow + 1 : startRow;
            let c = dir === 'across' ? startCol + 1 : startCol;

            // Keep moving until we find a valid cell or hit boundary
            while (r >= 0 && r < result.grid.length && c >= 0 && c < result.grid[0].length) {
                const cell = result.grid[r]?.[c];
                if (cell && !cell.isBlack && cell.letter) {
                    return { row: r, col: c };
                }
                // Move to next
                if (dir === 'down') r++;
                else c++;
            }
            return null;
        };

        // Helper function to find previous valid cell
        const findPrevCell = (startRow: number, startCol: number, dir: 'across' | 'down'): { row: number; col: number } | null => {
            let r = dir === 'down' ? startRow - 1 : startRow;
            let c = dir === 'across' ? startCol - 1 : startCol;

            while (r >= 0 && c >= 0) {
                const cell = result.grid[r]?.[c];
                if (cell && !cell.isBlack && cell.letter) {
                    return { row: r, col: c };
                }
                if (dir === 'down') r--;
                else c--;
            }
            return null;
        };

        if (e.key.match(/^[a-zA-Z]$/)) {
            // Letter input
            setUserInput(prev => new Map(prev).set(key, e.key.toUpperCase()));

            // Move to next cell in current direction, skipping black cells
            const nextCell = findNextCell(row, col, direction);
            if (nextCell) {
                setSelectedCell(nextCell);
            }
        } else if (e.key === 'Backspace') {
            if (userInput.get(key)) {
                setUserInput(prev => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                });
            } else {
                // Move to previous cell, skipping black cells
                const prevCell = findPrevCell(row, col, direction);
                if (prevCell) {
                    setSelectedCell(prevCell);
                }
            }
        } else if (e.key === 'ArrowRight') {
            const next = findNextCell(row, col - 1, 'across'); // -1 because findNextCell adds 1
            if (next && next.col > col) setSelectedCell(next);
        } else if (e.key === 'ArrowLeft') {
            const prev = findPrevCell(row, col + 1, 'across');
            if (prev && prev.col < col) setSelectedCell(prev);
        } else if (e.key === 'ArrowDown') {
            const next = findNextCell(row - 1, col, 'down');
            if (next && next.row > row) setSelectedCell(next);
        } else if (e.key === 'ArrowUp') {
            const prev = findPrevCell(row + 1, col, 'down');
            if (prev && prev.row < row) setSelectedCell(prev);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            setDirection(d => d === 'across' ? 'down' : 'across');
        }
    }, [selectedCell, direction, result.grid, userInput]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleReset = () => {
        setUserInput(new Map());
        setSelectedCell(null);
        setShowAnswer(false);
        setCompletedWords(new Set());
        setShowCompletion(false);
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            // Fill in all answers
            const answers = new Map<string, string>();
            result.grid.forEach((row, rowIdx) => {
                row.forEach((cell, colIdx) => {
                    if (!cell.isBlack && cell.letter) {
                        answers.set(`${rowIdx}-${colIdx}`, cell.letter);
                    }
                });
            });
            setUserInput(answers);
        } else {
            setUserInput(new Map());
        }
        setShowAnswer(!showAnswer);
    };

    const currentClue = getCurrentClue();
    const totalWords = result.acrossClues.length + result.downClues.length;
    const cellSize = 36;

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: completedWords.size, total: totalWords }}
            isComplete={completedWords.size === totalWords && totalWords > 0}
        >
            <div className="flex gap-8 items-start">
                {/* Crossword Grid */}
                <div
                    className="rounded-2xl p-4"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    <div className="grid" style={{ gap: '0px' }}>
                        {result.grid.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex">
                                {row.map((cell, colIdx) => {
                                    const key = `${rowIdx}-${colIdx}`;
                                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                                    const userLetter = userInput.get(key) || '';
                                    const isCorrect = userLetter && userLetter.toUpperCase() === cell.letter.toUpperCase();

                                    if (cell.isBlack && !cell.letter) {
                                        return (
                                            <div
                                                key={colIdx}
                                                style={{
                                                    width: cellSize,
                                                    height: cellSize,
                                                    background: '#e5e7eb',
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <div
                                            key={colIdx}
                                            className="relative cursor-pointer transition-all duration-150"
                                            style={{
                                                width: cellSize,
                                                height: cellSize,
                                                border: '1px solid #94a3b8',
                                                background: isSelected
                                                    ? '#fef08a'
                                                    : userLetter && isCorrect
                                                        ? '#bbf7d0'
                                                        : '#fff',
                                            }}
                                            onClick={() => handleCellClick(rowIdx, colIdx)}
                                        >
                                            {cell.number && (
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: 1,
                                                        left: 2,
                                                        fontSize: '9px',
                                                        fontWeight: 500,
                                                        color: '#64748b',
                                                    }}
                                                >
                                                    {cell.number}
                                                </span>
                                            )}
                                            <span
                                                className="absolute inset-0 flex items-center justify-center font-bold text-lg"
                                                style={{ color: '#1e293b' }}
                                            >
                                                {userLetter}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clues Panel */}
                <div className="flex flex-col gap-4" style={{ maxWidth: '350px' }}>
                    {/* Current Clue */}
                    {currentClue && (
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: 'rgba(254, 240, 138, 0.9)',
                                color: '#1e293b',
                            }}
                        >
                            <div className="text-sm font-semibold opacity-70 mb-1">
                                {currentClue.number} {currentClue.direction.toUpperCase()}
                            </div>
                            <div className="text-lg font-medium">{currentClue.clue}</div>
                        </div>
                    )}

                    {/* Clue Lists */}
                    <div className="flex gap-4">
                        <div
                            className="rounded-xl p-4 flex-1"
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(12px)',
                                maxHeight: '300px',
                                overflowY: 'auto',
                            }}
                        >
                            <h4 className="text-white font-bold mb-2">ACROSS</h4>
                            {result.acrossClues.map(clue => {
                                const isComplete = completedWords.has(`across-${clue.number}`);
                                return (
                                    <p
                                        key={clue.number}
                                        className="text-sm mb-1 cursor-pointer hover:opacity-80"
                                        style={{
                                            color: 'white',
                                            opacity: isComplete ? 0.5 : 1,
                                            textDecoration: isComplete ? 'line-through' : 'none',
                                        }}
                                        onClick={() => {
                                            setSelectedCell({ row: clue.row, col: clue.col });
                                            setDirection('across');
                                        }}
                                    >
                                        <strong>{clue.number}.</strong> {clue.clue}
                                    </p>
                                );
                            })}
                        </div>

                        <div
                            className="rounded-xl p-4 flex-1"
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(12px)',
                                maxHeight: '300px',
                                overflowY: 'auto',
                            }}
                        >
                            <h4 className="text-white font-bold mb-2">DOWN</h4>
                            {result.downClues.map(clue => {
                                const isComplete = completedWords.has(`down-${clue.number}`);
                                return (
                                    <p
                                        key={clue.number}
                                        className="text-sm mb-1 cursor-pointer hover:opacity-80"
                                        style={{
                                            color: 'white',
                                            opacity: isComplete ? 0.5 : 1,
                                            textDecoration: isComplete ? 'line-through' : 'none',
                                        }}
                                        onClick={() => {
                                            setSelectedCell({ row: clue.row, col: clue.col });
                                            setDirection('down');
                                        }}
                                    >
                                        <strong>{clue.number}.</strong> {clue.clue}
                                    </p>
                                );
                            })}
                        </div>
                    </div>

                    {/* Direction Indicator */}
                    <div
                        className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl cursor-pointer"
                        style={{
                            background: direction === 'down'
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                        onClick={() => setDirection(d => d === 'across' ? 'down' : 'across')}
                    >
                        <span className="text-2xl">{direction === 'down' ? '↓' : '→'}</span>
                        <span className="text-white font-bold">
                            {direction === 'down' ? 'DỌC (DOWN)' : 'NGANG (ACROSS)'}
                        </span>
                        <span className="text-white text-sm opacity-70">(click để đổi)</span>
                    </div>

                    {/* Instructions */}
                    <div className="text-white text-sm opacity-70">
                        <p>⌨️ Gõ chữ cái để điền. Dùng ← → ↑ ↓ để di chuyển.</p>
                        <p>🔄 Tab hoặc click 2 lần để đổi hướng.</p>
                    </div>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Hoàn hảo!"
                message="Bạn đã giải xong ô chữ!"
                score={{ current: completedWords.size, total: totalWords }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
