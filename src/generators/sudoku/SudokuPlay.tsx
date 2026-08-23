import React, { useState, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';
import { SudokuPuzzle, SudokuSize } from '../../types';

interface SudokuPlayProps {
    title: string;
    puzzle: SudokuPuzzle;
    size: SudokuSize;
    onClose: () => void;
}

export const SudokuPlay: React.FC<SudokuPlayProps> = ({
    title,
    puzzle,
    size,
    onClose,
}) => {
    const { initialGrid, solutionGrid, symbolMap } = puzzle;
    const [grid, setGrid] = useState<(number | null)[][]>(initialGrid.map(row => [...row]));
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [showCompletion, setShowCompletion] = useState(false);

    const boxRows = size === 4 ? 2 : size === 6 ? 2 : 3;
    const boxCols = size === 4 ? 2 : size === 6 ? 3 : 3;

    // Check if fully solved
    const checkIsSolved = (currentGrid: (number | null)[][]): boolean => {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (currentGrid[r][c] !== solutionGrid[r][c]) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleCellSelect = (r: number, c: number) => {
        if (initialGrid[r][c] !== null) {
            // Clue cell, can select to highlight
            soundFx.playClick();
            setSelectedCell({ r, c });
            return;
        }
        soundFx.playClick();
        setSelectedCell({ r, c });
    };

    const handleNumberInput = (num: number | null) => {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        if (initialGrid[r][c] !== null) return; // cannot overwrite clue cell

        soundFx.playClick();
        const next = grid.map((row, rowIdx) =>
            row.map((val, colIdx) => (rowIdx === r && colIdx === c ? num : val))
        );
        setGrid(next);

        if (num === solutionGrid[r][c]) {
            soundFx.playCorrect();
        } else if (num !== null) {
            soundFx.playIncorrect();
        }

        if (checkIsSolved(next)) {
            soundFx.playVictory();
            setTimeout(() => setShowCompletion(true), 400);
        }
    };

    const handleReset = () => {
        soundFx.playClick();
        setGrid(initialGrid.map(row => [...row]));
        setSelectedCell(null);
        setShowCompletion(false);
    };

    const handleHint = () => {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        if (initialGrid[r][c] !== null) return;
        const correctNum = solutionGrid[r][c];
        handleNumberInput(correctNum);
    };

    const selectedValue = selectedCell ? grid[selectedCell.r][selectedCell.c] : null;

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
        >
            <div className="flex flex-col items-center gap-6 max-w-xl w-full">
                {/* Sudoku Board Canvas */}
                <div
                    className="p-4 sm:p-6 rounded-3xl border shadow-2xl bg-white border-slate-200 flex flex-col items-center"
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                            border: '3px solid #0f172a',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            maxWidth: size === 4 ? '320px' : size === 6 ? '380px' : '440px',
                            width: '100%',
                        }}
                    >
                        {grid.map((row, r) =>
                            row.map((val, c) => {
                                const isInitial = initialGrid[r][c] !== null;
                                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                const isSameVal = selectedValue && val === selectedValue;
                                const isError = val !== null && val !== solutionGrid[r][c];

                                const borderRight = (c + 1) % boxCols === 0 && c < size - 1 ? '2.5px solid #0f172a' : '1px solid #cbd5e1';
                                const borderBottom = (r + 1) % boxRows === 0 && r < size - 1 ? '2.5px solid #0f172a' : '1px solid #cbd5e1';

                                const symbol = val ? symbolMap[val - 1] || `${val}` : '';

                                return (
                                    <button
                                        key={`${r}-${c}`}
                                        type="button"
                                        onClick={() => handleCellSelect(r, c)}
                                        style={{
                                            aspectRatio: '1/1',
                                            borderRight,
                                            borderBottom,
                                            backgroundColor: isSelected
                                                ? '#bae6fd'
                                                : isSameVal
                                                    ? '#e0f2fe'
                                                    : isInitial
                                                        ? '#f8fafc'
                                                        : '#ffffff',
                                            color: isError ? '#ef4444' : isInitial ? '#0f172a' : '#0284c7',
                                            fontWeight: isInitial ? 800 : 700,
                                            fontSize: size === 4 ? '26px' : size === 6 ? '20px' : '17px',
                                        }}
                                        className="flex items-center justify-center transition-all cursor-pointer select-none"
                                    >
                                        {symbol}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Keypad for Symbols / Numbers */}
                <div className="w-full p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col items-center gap-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Array.from({ length: size }, (_, i) => i + 1).map(num => {
                            const symbol = symbolMap[num - 1] || `${num}`;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleNumberInput(num)}
                                    className="w-12 h-12 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xl shadow-lg shadow-sky-500/30 flex items-center justify-center transition-all"
                                >
                                    {symbol}
                                </button>
                            );
                        })}

                        {/* Erase button */}
                        <button
                            type="button"
                            onClick={() => handleNumberInput(null)}
                            className="px-4 h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-sm shadow-md flex items-center justify-center transition-all"
                            title="Xóa ô đã chọn"
                        >
                            ⌫ Xóa
                        </button>

                        {/* Hint button */}
                        <button
                            type="button"
                            onClick={handleHint}
                            className="px-4 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md flex items-center justify-center transition-all"
                            title="Gợi ý số đúng cho ô đang chọn"
                        >
                            💡 Gợi ý
                        </button>
                    </div>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 XUẤT SẮC! BẠN ĐÃ GIẢI XONG SUDOKU!"
                message={`Bạn đã điền chính xác toàn bộ bảng Sudoku!`}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
