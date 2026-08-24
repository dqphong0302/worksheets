import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Select, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { SudokuConfig, SudokuSize, SudokuTheme, SudokuDifficulty, ExportFormat } from '../../types';
import { generateSudoku, getDefaultSudokuConfig } from './sudokuGenerator';
import { SudokuPlay } from './SudokuPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { TemplateModal } from '../../components/template/TemplateModal';

function getInitialConfig(): SudokuConfig {
    const saved = getEditorState<SudokuConfig>('sudoku');
    if (saved) {
        const { lastModified, ...config } = saved as SudokuConfig & { lastModified?: string };
        return { ...getDefaultSudokuConfig(), ...config };
    }
    return getDefaultSudokuConfig();
}

interface SudokuEditorProps {
    onHome: () => void;
}

export const SudokuEditor: React.FC<SudokuEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
    const [playMode, setPlayMode] = useState(false);
    const [regenerateKey, setRegenerateKey] = useState(0);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateModalMode, setTemplateModalMode] = useState<'save' | 'load'>('save');

    const {
        state: config,
        setState: setConfig,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
    } = useUndoRedo<SudokuConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('sudoku', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateSudoku(config), [config, regenerateKey]);

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: `Sudoku Puzzle (${config.size}x${config.size}) - ${config.difficulty.toUpperCase()}`,
                sections: result.puzzles.map((p, idx) => ({
                    type: 'grid' as const,
                    content: p.initialGrid.map(row =>
                        row.map(val => (val ? p.symbolMap[val - 1] || `${val}` : ' '))
                    )
                }))
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    if (playMode && result.puzzles[0]) {
        return (
            <SudokuPlay
                title={config.title}
                puzzle={result.puzzles[0]}
                size={config.size}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    const boxRows = config.size === 4 ? 2 : config.size === 6 ? 2 : 3;
    const boxCols = config.size === 4 ? 2 : config.size === 6 ? 3 : 3;

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="sudoku"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.sudoku.name', 'Sudoku Trí Tuệ')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultSudokuConfig())}
                        onSaveTemplate={() => {
                            setTemplateModalMode('save');
                            setTemplateModalOpen(true);
                        }}
                        onLoadTemplate={() => {
                            setTemplateModalMode('load');
                            setTemplateModalOpen(true);
                        }}
                        onExport={handleExport}
                        onHome={onHome}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        previewRef={previewRef}
                        paperSize={config.paperSize}
                        filename={config.title.replace(/\s+/g, '_')}
                    />
                }
                sidebar={
                    <div className="animate-fadeIn space-y-4">
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setPlayMode(true)}
                            style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                fontSize: '1.1rem',
                                padding: '0.85rem',
                                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                            }}
                        >
                            🎮 {i18n.language === 'vi' ? 'Chơi Sudoku Online / Play Sudoku' : 'Play Sudoku'}
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setRegenerateKey(k => k + 1)}
                        >
                            🎲 {i18n.language === 'vi' ? 'Sinh đề Sudoku ngẫu nhiên mới' : 'Regenerate Puzzle'}
                        </Button>

                    <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">
                        ⚙️ {t('editor.config')}
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label={i18n.language === 'vi' ? 'Cỡ lưới Sudoku' : 'Grid Size'}
                            value={config.size.toString()}
                            options={[
                                { value: '4', label: '4 x 4 (Mầm non & Lớp 1)' },
                                { value: '6', label: '6 x 6 (Lớp 2 - Lớp 4)' },
                                { value: '9', label: '9 x 9 (Chuẩn quốc tế)' },
                            ]}
                            onChange={e => setConfig({ ...config, size: parseInt(e.target.value) as SudokuSize })}
                        />

                        <Select
                            label={i18n.language === 'vi' ? 'Chủ đề biểu tượng' : 'Theme'}
                            value={config.theme}
                            options={[
                                { value: 'animals', label: 'Động vật (🐱, 🐶, 🐰...)' },
                                { value: 'fruits', label: 'Trái cây (🍎, 🍌, 🍊...)' },
                                { value: 'shapes', label: 'Hình học (▲, ■, ●...)' },
                                { value: 'numbers', label: 'Con số truyền thống (1, 2, 3...)' },
                            ]}
                            onChange={e => setConfig({ ...config, theme: e.target.value as SudokuTheme })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label={i18n.language === 'vi' ? 'Độ khó' : 'Difficulty'}
                            value={config.difficulty}
                            options={[
                                { value: 'easy', label: 'Dễ (Nhiều gợi ý)' },
                                { value: 'medium', label: 'Vừa (Cân bằng)' },
                                { value: 'hard', label: 'Khó (Thử thách)' },
                            ]}
                            onChange={e => setConfig({ ...config, difficulty: e.target.value as SudokuDifficulty })}
                        />

                        <Select
                            label={i18n.language === 'vi' ? 'Số bảng trên 1 trang' : 'Puzzles/page'}
                            value={config.puzzlesPerPage.toString()}
                            options={[
                                { value: '1', label: '1 bảng lớn' },
                                { value: '2', label: '2 bảng vừa' },
                            ]}
                            onChange={e => setConfig({ ...config, puzzlesPerPage: parseInt(e.target.value) as 1 | 2 })}
                        />
                    </div>

                    <Checkbox
                        label={t('editor.showAnswerKey')}
                        checked={config.showAnswerKey}
                        onChange={e => setConfig({ ...config, showAnswerKey: e.target.checked })}
                    />
                </div>
            }
            preview={
                <div className="animate-slideUp relative">
                    <ZoomControl
                        zoom={config.zoom}
                        onZoomChange={zoom => setConfig({ ...config, zoom })}
                    />
                    <PaperPreview ref={previewRef} paperSize={config.paperSize} scale={config.zoom}>
                        <div style={{ fontFamily: config.font, fontSize: config.fontSize }}>
                            {config.studentInfo.showStudentInfo && (
                                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-300 text-xs">
                                    <span>Họ và tên / Name: _______________________</span>
                                    <span>Lớp / Class: ________</span>
                                    <span>Ngày / Date: ________</span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h1 style={{ fontSize: '1.6em', fontWeight: 800, color: '#0f172a', marginBottom: '0.2em' }}>
                                    {config.title}
                                </h1>
                                <p style={{ fontSize: '0.85em', color: '#64748b' }}>
                                    🧩 {i18n.language === 'vi'
                                        ? `Điền các ${config.theme === 'numbers' ? 'con số' : 'hình ảnh'} sao cho mỗi hàng, mỗi cột và mỗi ô khối không bị lặp lại.`
                                        : 'Fill in the grid so that every row, column, and block contains each symbol without duplicates.'}
                                </p>
                            </div>

                            {/* Printable Sudoku Tables */}
                            <div className={`grid ${config.puzzlesPerPage === 2 ? 'grid-cols-2 gap-6' : 'grid-cols-1 gap-6 max-w-sm mx-auto'} my-6`}>
                                {result.puzzles.map((puzzle, pIdx) => (
                                    <div key={pIdx} className="flex flex-col items-center">
                                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase">
                                            Bảng Sudoku #{pIdx + 1}
                                        </div>
                                        <table
                                            style={{
                                                borderCollapse: 'collapse',
                                                border: '3px solid #0f172a',
                                                width: '100%',
                                                maxWidth: config.size === 4 ? '260px' : '320px',
                                                tableLayout: 'fixed',
                                            }}
                                        >
                                            <tbody>
                                                {puzzle.initialGrid.map((row, r) => (
                                                    <tr key={r}>
                                                        {row.map((val, c) => {
                                                            const isRightEdge = (c + 1) % boxCols === 0 && c < config.size - 1;
                                                            const isBottomEdge = (r + 1) % boxRows === 0 && r < config.size - 1;
                                                            const symbol = val ? puzzle.symbolMap[val - 1] || `${val}` : '';

                                                            return (
                                                                <td
                                                                    key={c}
                                                                    style={{
                                                                        height: config.size === 4 ? '58px' : config.size === 6 ? '46px' : '36px',
                                                                        borderRight: isRightEdge ? '2.5px solid #0f172a' : '1px solid #cbd5e1',
                                                                        borderBottom: isBottomEdge ? '2.5px solid #0f172a' : '1px solid #cbd5e1',
                                                                        textAlign: 'center',
                                                                        fontSize: config.size === 4 ? '24px' : config.size === 6 ? '18px' : '14px',
                                                                        fontWeight: val ? 800 : 400,
                                                                        backgroundColor: val ? '#f8fafc' : '#ffffff',
                                                                        color: '#0f172a',
                                                                    }}
                                                                >
                                                                    {symbol}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            {/* Answer Key */}
                            {config.showAnswerKey && (
                                <div className="mt-8 pt-4 border-t border-dashed border-slate-300">
                                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                                        Đáp án (Answer Key):
                                    </div>
                                    <div className="flex gap-6 justify-center">
                                        {result.puzzles.map((p, idx) => (
                                            <div key={idx} className="text-[10px] font-mono">
                                                {p.solutionGrid.map((r, ri) => (
                                                    <div key={ri}>
                                                        {r.map(v => p.symbolMap[v - 1] || v).join(' ')}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PaperPreview>
                </div>
            }
        />
        </>
    );
};
