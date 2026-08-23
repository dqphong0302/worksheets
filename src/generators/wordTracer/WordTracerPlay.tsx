import React, { useState, useRef, useEffect } from 'react';
import { PlayModeWrapper } from '../../components/play/PlayModeWrapper';
import { CompletionPopup } from '../../components/play/CompletionPopup';

interface WordTracerPlayProps {
    title: string;
    words: string[];
    font: string;
    fontSize: number;
    onClose: () => void;
}

export const WordTracerPlay: React.FC<WordTracerPlayProps> = ({
    title,
    words,
    font,
    fontSize,
    onClose,
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
    const [showAnswer, setShowAnswer] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    const currentWord = words[currentWordIndex];
    const canvasWidth = 500;
    const canvasHeight = 150;

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvasWidth * 2;
        canvas.height = canvasHeight * 2;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        contextRef.current = ctx;

        drawGuideText();
    }, [currentWordIndex, font]);

    const drawGuideText = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw guide text (light gray)
        ctx.font = `${fontSize * 3}px ${font}`;
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentWord, canvasWidth / 2, canvasHeight / 2);

        // Draw baseline
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, canvasHeight / 2 + fontSize);
        ctx.lineTo(canvasWidth - 20, canvasHeight / 2 + fontSize);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reset for drawing
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const ctx = contextRef.current;
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;

        const ctx = contextRef.current;
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
            };
        }

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const clearCanvas = () => {
        drawGuideText();
    };

    const markComplete = () => {
        setCompletedWords(prev => new Set([...prev, currentWordIndex]));

        if (currentWordIndex < words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            setTimeout(() => setShowCompletion(true), 300);
        }
    };

    const goToWord = (index: number) => {
        setCurrentWordIndex(index);
    };

    const handleReset = () => {
        setCurrentWordIndex(0);
        setCompletedWords(new Set());
        setShowAnswer(false);
        setShowCompletion(false);
        drawGuideText();
    };

    const handleShowAnswer = () => {
        if (!showAnswer) {
            setCompletedWords(new Set(words.map((_, i) => i)));
        } else {
            handleReset();
        }
        setShowAnswer(!showAnswer);
    };

    return (
        <PlayModeWrapper
            title={title}
            onClose={onClose}
            onReset={handleReset}
            onShowAnswer={handleShowAnswer}
            score={{ current: completedWords.size, total: words.length }}
        >
            <div className="flex flex-col items-center gap-6">
                {/* Progress */}
                <div className="text-white text-lg">
                    Từ <span className="font-bold text-2xl">{currentWordIndex + 1}</span> / {words.length}
                </div>

                {/* Canvas Area */}
                <div
                    className="rounded-2xl p-4"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="rounded-xl cursor-crosshair"
                        style={{
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            touchAction: 'none',
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />

                    <div className="flex gap-3 mt-4 justify-center">
                        <button
                            onClick={clearCanvas}
                            className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                            style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                            }}
                        >
                            🗑️ Xóa
                        </button>

                        <button
                            onClick={markComplete}
                            className="px-6 py-2 rounded-lg font-bold text-white transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            }}
                        >
                            ✓ Tiếp theo
                        </button>
                    </div>
                </div>

                {/* Word Navigation */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {words.map((word, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToWord(idx)}
                            className="px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105"
                            style={{
                                background: completedWords.has(idx)
                                    ? 'rgba(34, 197, 94, 0.4)'
                                    : idx === currentWordIndex
                                        ? 'rgba(99, 102, 241, 0.8)'
                                        : 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                border: idx === currentWordIndex ? '2px solid white' : 'none',
                            }}
                        >
                            {completedWords.has(idx) ? '✓ ' : ''}{word}
                        </button>
                    ))}
                </div>

                {/* Instructions */}
                <div className="text-white text-sm opacity-70 text-center">
                    <p>✏️ Dùng chuột hoặc ngón tay để viết theo mẫu</p>
                    <p>📱 Hỗ trợ màn hình cảm ứng</p>
                </div>
            </div>

            <CompletionPopup
                show={showCompletion}
                title="🎉 Giỏi lắm!"
                message="Bạn đã tập viết xong tất cả từ!"
                score={{ current: completedWords.size, total: words.length }}
                onPlayAgain={handleReset}
                onClose={() => setShowCompletion(false)}
            />
        </PlayModeWrapper>
    );
};
