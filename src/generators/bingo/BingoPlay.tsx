import React, { useState, useEffect, useMemo } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';
import { BingoGridSize } from '../../types';

interface BingoPlayProps {
    title: string;
    words: string[];
    gridSize: BingoGridSize;
    hasFreeSpace: boolean;
    freeSpaceText: string;
    onClose: () => void;
}

export const BingoPlay: React.FC<BingoPlayProps> = ({
    title,
    words,
    gridSize,
    hasFreeSpace,
    freeSpaceText,
    onClose,
}) => {
    const [mode, setMode] = useState<'player' | 'caller'>('player');

    // === PLAYER CARD STATE ===
    const initialGrid = useMemo(() => {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        const grid: { text: string; marked: boolean }[][] = [];
        const mid = Math.floor(gridSize / 2);
        let idx = 0;

        for (let r = 0; r < gridSize; r++) {
            const row: { text: string; marked: boolean }[] = [];
            for (let c = 0; c < gridSize; c++) {
                if (hasFreeSpace && gridSize % 2 === 1 && r === mid && c === mid) {
                    row.push({ text: freeSpaceText || '★ FREE', marked: true });
                } else {
                    row.push({ text: shuffled[idx] || `Item ${idx + 1}`, marked: false });
                    idx++;
                }
            }
            grid.push(row);
        }
        return grid;
    }, [words, gridSize, hasFreeSpace, freeSpaceText]);

    const [playerGrid, setPlayerGrid] = useState(initialGrid);
    const [hasBingo, setHasBingo] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // === CALLER MACHINE STATE ===
    const [remainingPool, setRemainingPool] = useState<string[]>([...words]);
    const [calledHistory, setCalledHistory] = useState<string[]>([]);
    const [currentCalled, setCurrentCalled] = useState<string | null>(null);

    // Check if player has BINGO line
    const checkBingo = (grid: { text: string; marked: boolean }[][]): boolean => {
        const size = grid.length;
        // Check rows
        for (let r = 0; r < size; r++) {
            if (grid[r].every(cell => cell.marked)) return true;
        }
        // Check cols
        for (let c = 0; c < size; c++) {
            let colComplete = true;
            for (let r = 0; r < size; r++) {
                if (!grid[r][c].marked) {
                    colComplete = false;
                    break;
                }
            }
            if (colComplete) return true;
        }
        // Check diagonal 1
        let diag1 = true;
        for (let i = 0; i < size; i++) {
            if (!grid[i][i].marked) {
                diag1 = false;
                break;
            }
        }
        if (diag1) return true;

        // Check diagonal 2
        let diag2 = true;
        for (let i = 0; i < size; i++) {
            if (!grid[i][size - 1 - i].marked) {
                diag2 = false;
                break;
            }
        }
        if (diag2) return true;

        return false;
    };

    const handleCellClick = (r: number, c: number) => {
        soundFx.playClick();
        const next = playerGrid.map((row, rowIdx) =>
            row.map((cell, colIdx) =>
                rowIdx === r && colIdx === c ? { ...cell, marked: !cell.marked } : cell
            )
        );
        setPlayerGrid(next);

        const won = checkBingo(next);
        if (won && !hasBingo) {
            setHasBingo(true);
            soundFx.playVictory();
            setTimeout(() => setShowCompletion(true), 400);
        }
    };

    const handleCallNext = () => {
        if (remainingPool.length === 0) return;
        soundFx.playClick();
        const randIdx = Math.floor(Math.random() * remainingPool.length);
        const item = remainingPool[randIdx];

        const nextPool = remainingPool.filter((_, i) => i !== randIdx);
        setRemainingPool(nextPool);
        setCalledHistory(prev => [item, ...prev]);
        setCurrentCalled(item);

        // Speak announced word
        soundFx.speakWord(item);
    };

    const handleReset = () => {
        soundFx.playClick();
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        const mid = Math.floor(gridSize / 2);
        let idx = 0;

        const newGrid: { text: string; marked: boolean }[][] = [];
        for (let r = 0; r < gridSize; r++) {
            const row: { text: string; marked: boolean }[] = [];
            for (let c = 0; c < gridSize; c++) {
                if (hasFreeSpace && gridSize % 2 === 1 && r === mid && c === mid) {
                    row.push({ text: freeSpaceText || '★ FREE', marked: true });
                } else {
                    row.push({ text: shuffled[idx] || `Item ${idx + 1}`, marked: false });
                    idx++;
                }
            }
            newGrid.push(row);
        }
        setPlayerGrid(newGrid);
        setHasBingo(false);
        setShowCompletion(false);

        // Caller reset
        setRemainingPool([...words]);
        setCalledHistory([]);
        setCurrentCalled(null);
    };

    const markedCount = playerGrid.flat().filter(c => c.marked).length;
    const totalCells = gridSize * gridSize;

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            score={mode === 'player' ? { current: markedCount, total: totalCells } : undefined}
        >
            <div className="flex flex-col items-center gap-5 max-w-2xl w-full">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => { soundFx.playClick(); setMode('player'); }}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'player' ? 'bg-brand text-on-brand shadow-lg ' : 'text-ink-subtle hover:text-white'}`}
                    >
                        Thẻ Người Chơi / Player Card
                    </button>
                    <button
                        type="button"
                        onClick={() => { soundFx.playClick(); setMode('caller'); }}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'caller' ? 'bg-brand text-on-brand shadow-lg ' : 'text-ink-subtle hover:text-white'}`}
                    >
                        Máy Quay Số Giáo Viên / Caller Machine
                    </button>
                </div>

                {mode === 'player' ? (
                    /* Player Interactive Bingo Card */
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div
                            className="p-6 rounded-3xl w-full max-w-lg border shadow-2xl"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(56, 189, 248, 0.3)',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-line">
                                <span className="font-bold text-ink tracking-wider">
                                    B • I • N • G • O
                                </span>
                                <span className="text-xs font-bold text-brand bg-brand-soft px-2.5 py-1 rounded-full border border-brand-line">
                                    Đã đánh dấu: {markedCount}/{totalCells}
                                </span>
                            </div>

                            {/* Bingo Grid */}
                            <div
                                className="grid gap-2.5"
                                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                            >
                                {playerGrid.map((row, r) =>
                                    row.map((cell, c) => (
                                        <button
                                            key={`${r}-${c}`}
                                            type="button"
                                            onClick={() => handleCellClick(r, c)}
                                            className={`aspect-square p-2 rounded-2xl flex flex-col items-center justify-center text-center font-bold transition-all transform hover:scale-105 cursor-pointer relative overflow-hidden border ${cell.marked
                                                ? ' from-emerald-400 to-teal-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                                                : 'bg-surface-subtle hover:bg-surface-subtle text-ink border-line shadow-sm'
                                                }`}
                                        >
                                            {cell.marked && (
                                                <span className="absolute top-1 right-1 text-xs"></span>
                                            )}
                                            <span className="text-xs sm:text-sm line-clamp-3 leading-tight">
                                                {cell.text}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-ink-subtle text-center">
                            Bấm vào từng ô khi giáo viên đọc từ. Tạo thành 1 hàng ngang, dọc hoặc chéo để BINGO!
                        </p>
                    </div>
                ) : (
                    /* Caller Machine View */
                    <div className="flex flex-col items-center gap-5 w-full">
                        <div
                            className="p-8 rounded-3xl w-full max-w-lg border text-center shadow-2xl"
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderColor: 'rgba(29, 79, 145, 0.3)',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                                Máy Gọi Từ Bốc Thăm (Caller Machine)
                            </span>

                            {/* Main Draw Display */}
                            <div className="my-6 min-h-[120px] flex flex-col items-center justify-center p-6 rounded-2xl bg-brand border-2 border-brand-line">
                                {currentCalled ? (
                                    <>
                                        <span className="text-3xl sm:text-4xl font-bold text-brand mb-2">
                                            {currentCalled}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => soundFx.speakWord(currentCalled)}
                                            className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-soft hover:bg-indigo-300 text-brand flex items-center gap-1 transition-colors"
                                        >
                                            Phát âm lại
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-ink-subtle text-sm font-medium">
                                        Bấm nút bên dưới để bốc từ ngẫu nhiên
                                    </span>
                                )}
                            </div>

                            {/* Call Button */}
                            <button
                                type="button"
                                onClick={handleCallNext}
                                disabled={remainingPool.length === 0}
                                className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                style={{
                                    background: '#1d4f91',
                                    boxShadow: '0 10px 25px rgba(29, 79, 145, 0.4)',
                                }}
                            >
                                {remainingPool.length > 0 ? `Bốc Từ Tiếp Theo (${remainingPool.length} từ còn lại)` : 'Đã Hết Bộ Từ!'}
                            </button>
                        </div>

                        {/* Called History Board */}
                        {calledHistory.length > 0 && (
                            <div className="w-full max-w-lg p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                                <h4 className="text-xs font-bold text-ink-subtle uppercase tracking-wider mb-3">
                                    Danh Sách Từ Đã Gọi ({calledHistory.length})
                                </h4>
                                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                                    {calledHistory.map((item, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        >
                                            {idx + 1}. {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 BINGO! BẠN ĐÃ CHIẾN THẮNG!"
                message={`Chúc mừng bạn đã hoàn thành đường BINGO trên thẻ!`}
                score={{ current: markedCount, total: totalCells }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
