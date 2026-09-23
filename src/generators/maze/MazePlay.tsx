import React, { useState, useEffect, useCallback } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';
import { soundFx } from '../../utils/sound';
import { MazeCell } from '../../types';

interface MazePlayProps {
    title: string;
    grid: MazeCell[][];
    start: { r: number; c: number };
    goal: { r: number; c: number };
    startEmoji: string;
    goalEmoji: string;
    checkpointWord?: string;
    onClose: () => void;
}

export const MazePlay: React.FC<MazePlayProps> = ({
    title,
    grid,
    start,
    goal,
    startEmoji = '🐭',
    goalEmoji = '🧀',
    checkpointWord,
    onClose,
}) => {
    const [playerPos, setPlayerPos] = useState(start);
    const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
    const [visitedPath, setVisitedPath] = useState<Record<string, boolean>>({ [`${start.r},${start.c}`]: true });
    const [showCompletion, setShowCompletion] = useState(false);

    const height = grid.length;
    const width = grid[0]?.length || 0;
    const isAtGoal = playerPos.r === goal.r && playerPos.c === goal.c;

    const movePlayer = useCallback((dr: number, dc: number) => {
        if (isAtGoal) return;
        const curr = grid[playerPos.r][playerPos.c];

        // Check walls
        if (dr === -1 && curr.top) return;
        if (dr === 1 && curr.bottom) return;
        if (dc === 1 && curr.right) return;
        if (dc === -1 && curr.left) return;

        const nextR = playerPos.r + dr;
        const nextC = playerPos.c + dc;

        if (nextR >= 0 && nextR < height && nextC >= 0 && nextC < width) {
            soundFx.playClick();
            setPlayerPos({ r: nextR, c: nextC });
            setVisitedPath(prev => ({ ...prev, [`${nextR},${nextC}`]: true }));

            // Collect letter if cell has one
            const targetCell = grid[nextR][nextC];
            if (targetCell.checkpointLetter && !collectedLetters.includes(targetCell.checkpointLetter)) {
                soundFx.playCorrect();
                setCollectedLetters(prev => [...prev, targetCell.checkpointLetter!]);
            }
        }
    }, [playerPos, grid, height, width, isAtGoal, collectedLetters]);

    // Keyboard listener for Arrow keys and WASD
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                movePlayer(-1, 0);
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                movePlayer(1, 0);
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                movePlayer(0, -1);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                movePlayer(0, 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer]);

    useEffect(() => {
        if (isAtGoal) {
            soundFx.playVictory();
            const timer = setTimeout(() => setShowCompletion(true), 400);
            return () => clearTimeout(timer);
        }
    }, [isAtGoal]);

    const handleReset = () => {
        soundFx.playClick();
        setPlayerPos(start);
        setCollectedLetters([]);
        setVisitedPath({ [`${start.r},${start.c}`]: true });
        setShowCompletion(false);
    };

    const cellSize = Math.min(36, Math.floor(480 / Math.max(width, height)));

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
        >
            <div className="flex flex-col items-center gap-5 max-w-2xl w-full">
                {/* Header info */}
                {checkpointWord && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-white text-sm">
                        <span className="font-bold text-brand">Từ cần thu thập:</span>
                        <div className="flex gap-1">
                            {checkpointWord.split('').map((char, i) => {
                                const found = collectedLetters.includes(char);
                                return (
                                    <span
                                        key={i}
                                        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${found ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-ink-subtle'}`}
                                    >
                                        {char}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Interactive SVG / Canvas Maze */}
                <div
                    className="p-4 sm:p-6 rounded-3xl border shadow-2xl bg-slate-900 border-slate-700 flex items-center justify-center overflow-hidden"
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                            gap: '0',
                            backgroundColor: '#1c1917',
                            border: '3px solid #38bdf8',
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }}
                    >
                        {grid.map((row, r) =>
                            row.map((cell, c) => {
                                const isPlayer = playerPos.r === r && playerPos.c === c;
                                const isStart = start.r === r && start.c === c;
                                const isGoal = goal.r === r && goal.c === c;
                                const visited = visitedPath[`${r},${c}`];

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        style={{
                                            width: `${cellSize}px`,
                                            height: `${cellSize}px`,
                                            borderTop: cell.top ? '2.5px solid #9a9086' : '2.5px solid transparent',
                                            borderRight: cell.right ? '2.5px solid #9a9086' : '2.5px solid transparent',
                                            borderBottom: cell.bottom ? '2.5px solid #9a9086' : '2.5px solid transparent',
                                            borderLeft: cell.left ? '2.5px solid #9a9086' : '2.5px solid transparent',
                                            backgroundColor: isPlayer
                                                ? '#0284c7'
                                                : visited
                                                    ? 'rgba(56, 189, 248, 0.15)'
                                                    : '#1c1917',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: `${cellSize * 0.55}px`,
                                            position: 'relative',
                                        }}
                                    >
                                        {isPlayer ? (
                                            <span className="animate-bounce">{startEmoji}</span>
                                        ) : isGoal ? (
                                            <span>{goalEmoji}</span>
                                        ) : cell.checkpointLetter && !collectedLetters.includes(cell.checkpointLetter) ? (
                                            <span className="font-bold text-amber-400 text-xs">{cell.checkpointLetter}</span>
                                        ) : isStart ? (
                                            <span className="opacity-40">{startEmoji}</span>
                                        ) : null}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Mobile Touch D-Pad Controls */}
                <div className="flex flex-col items-center gap-1.5 sm:hidden">
                    <button
                        type="button"
                        onClick={() => movePlayer(-1, 0)}
                        className="w-14 h-12 rounded-xl bg-white/20 active:bg-white/40 text-white font-bold text-xl flex items-center justify-center"
                    >
                        ▲
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => movePlayer(0, -1)}
                            className="w-14 h-12 rounded-xl bg-white/20 active:bg-white/40 text-white font-bold text-xl flex items-center justify-center"
                        >
                            ◀
                        </button>
                        <button
                            type="button"
                            onClick={() => movePlayer(1, 0)}
                            className="w-14 h-12 rounded-xl bg-white/20 active:bg-white/40 text-white font-bold text-xl flex items-center justify-center"
                        >
                            ▼
                        </button>
                        <button
                            type="button"
                            onClick={() => movePlayer(0, 1)}
                            className="w-14 h-12 rounded-xl bg-white/20 active:bg-white/40 text-white font-bold text-xl flex items-center justify-center"
                        >
                            ▶
                        </button>
                    </div>
                </div>

                <p className="text-xs text-ink-subtle text-center hidden sm:block">
                    Dùng các phím mũi tên [↑, ↓, ←, →] hoặc [W, A, S, D] để điều khiển nhân vật qua mê cung
                </p>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 THOÁT KHỎI MÊ CUNG THÀNH CÔNG!"
                message={`Bạn đã vượt qua mê cung và thu thập đủ ${collectedLetters.length} chữ cái!`}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
