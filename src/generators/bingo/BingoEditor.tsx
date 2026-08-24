import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { BingoConfig, BingoGridSize, ExportFormat } from '../../types';
import { generateBingo, getDefaultBingoConfig } from './bingoGenerator';
import { BingoPlay } from './BingoPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getInitialConfig(): BingoConfig {
    const saved = getEditorState<BingoConfig>('bingo');
    if (saved) {
        const { lastModified, ...config } = saved as BingoConfig & { lastModified?: string };
        return { ...getDefaultBingoConfig(), ...config };
    }
    return getDefaultBingoConfig();
}

interface BingoEditorProps {
    onHome: () => void;
}

export const BingoEditor: React.FC<BingoEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
    const [playMode, setPlayMode] = useState(false);
    const [activePreviewCard, setActivePreviewCard] = useState(0);
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
    } = useUndoRedo<BingoConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('bingo', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateBingo(config), [config]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const words = topic.words.map(w => `${w.word} ${w.emoji || ''}`.trim());
        setConfig({
            ...config,
            title: `Bingo - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            words,
        });
    };

    const handleWordsChange = (text: string) => {
        const words = text
            .split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0);
        setConfig({ ...config, words });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: `Classroom Bingo Cards (${config.gridSize}x${config.gridSize}) - Total ${config.cardCount} Unique Cards`,
                sections: [
                    {
                        type: 'paragraph',
                        content: `Teacher's Master Caller Word List (${result.callerList.length} items):`
                    },
                    {
                        type: 'list',
                        content: result.callerList
                    },
                    ...result.cards.map((card, idx) => ({
                        type: 'grid' as const,
                        content: card.grid
                    }))
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    if (playMode) {
        return (
            <BingoPlay
                title={config.title}
                words={config.words}
                gridSize={config.gridSize}
                hasFreeSpace={config.hasFreeSpace}
                freeSpaceText={config.freeSpaceText}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    const currentCard = result.cards[activePreviewCard] || result.cards[0];

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="bingo"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.bingo.name', 'Bingo Lớp Học')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultBingoConfig())}
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
                        {/* Play Mode Button */}
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
                            🎮 {i18n.language === 'vi' ? 'Chơi Tương Tác / Play Bingo' : 'Play Bingo Now'}
                        </Button>

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

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
                            label={i18n.language === 'vi' ? 'Kích thước lưới' : 'Grid Size'}
                            value={config.gridSize.toString()}
                            options={[
                                { value: '3', label: '3 x 3 (9 ô)' },
                                { value: '4', label: '4 x 4 (16 ô)' },
                                { value: '5', label: '5 x 5 (25 ô - Chuẩn)' },
                            ]}
                            onChange={e => setConfig({ ...config, gridSize: parseInt(e.target.value) as BingoGridSize })}
                        />

                        <NumberInput
                            label={i18n.language === 'vi' ? 'Số thẻ cần in' : 'Cards count'}
                            value={config.cardCount}
                            min={1}
                            max={30}
                            onChange={e => setConfig({ ...config, cardCount: parseInt(e.target.value) || 1 })}
                        />
                    </div>

                    <Checkbox
                        label={i18n.language === 'vi' ? 'Có ô miễn phí ở giữa (Free Space)' : 'Free space in center'}
                        checked={config.hasFreeSpace}
                        onChange={e => setConfig({ ...config, hasFreeSpace: e.target.checked })}
                    />

                    {config.hasFreeSpace && (
                        <Input
                            label={i18n.language === 'vi' ? 'Chữ trong ô miễn phí' : 'Free space label'}
                            value={config.freeSpaceText}
                            onChange={e => setConfig({ ...config, freeSpaceText: e.target.value })}
                        />
                    )}

                    <Textarea
                        label={`${i18n.language === 'vi' ? 'Bộ từ vựng / thuật ngữ' : 'Word pool'} (${config.words.length} từ)`}
                        value={config.words.join('\n')}
                        onChange={e => handleWordsChange(e.target.value)}
                        placeholder="Mỗi dòng một từ hoặc emoji (VD: Apple 🍎)"
                        rows={8}
                    />
                </div>
            }
            preview={
                <div className="animate-slideUp relative">
                    <ZoomControl
                        zoom={config.zoom}
                        onZoomChange={zoom => setConfig({ ...config, zoom })}
                    />

                    {/* Card Switcher for preview */}
                    {result.cards.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mb-4 no-print">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {i18n.language === 'vi' ? 'Xem trước thẻ số:' : 'Preview Card #:'}
                            </span>
                            <div className="flex gap-1 max-w-md overflow-x-auto p-1">
                                {result.cards.map((c, i) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActivePreviewCard(i)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${activePreviewCard === i
                                            ? 'bg-sky-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <PaperPreview ref={previewRef} paperSize={config.paperSize} scale={config.zoom}>
                        <div style={{ fontFamily: config.font, fontSize: config.fontSize }}>
                            {/* Student Header */}
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
                                    🎯 {i18n.language === 'vi'
                                        ? `Thẻ Bingo #${activePreviewCard + 1} • Đánh dấu các ô khi nghe gọi từ`
                                        : `Bingo Card #${activePreviewCard + 1} • Mark the cells as words are called`}
                                </p>
                            </div>

                            {/* Bingo Table */}
                            {currentCard && (
                                <div className="flex justify-center my-6">
                                    <table
                                        style={{
                                            borderCollapse: 'collapse',
                                            width: '100%',
                                            maxWidth: '520px',
                                            tableLayout: 'fixed',
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                {'BINGO'.slice(0, config.gridSize).split('').map((letter, idx) => (
                                                    <th
                                                        key={idx}
                                                        style={{
                                                            padding: '10px 4px',
                                                            backgroundColor: '#0284c7',
                                                            color: '#ffffff',
                                                            fontSize: '1.2em',
                                                            fontWeight: 800,
                                                            border: '2px solid #0369a1',
                                                            textAlign: 'center',
                                                            letterSpacing: '2px',
                                                        }}
                                                    >
                                                        {letter}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentCard.grid.map((row, r) => (
                                                <tr key={r}>
                                                    {row.map((cell, c) => {
                                                        const isCenterFree = config.hasFreeSpace && config.gridSize % 2 === 1 && r === Math.floor(config.gridSize / 2) && c === Math.floor(config.gridSize / 2);
                                                        return (
                                                            <td
                                                                key={c}
                                                                style={{
                                                                    height: config.gridSize === 3 ? '95px' : config.gridSize === 4 ? '75px' : '62px',
                                                                    border: '2px solid #cbd5e1',
                                                                    textAlign: 'center',
                                                                    padding: '6px',
                                                                    backgroundColor: isCenterFree ? '#fef3c7' : '#ffffff',
                                                                    color: isCenterFree ? '#b45309' : '#0f172a',
                                                                    fontWeight: isCenterFree ? 800 : 600,
                                                                    fontSize: isCenterFree ? '1.05em' : '0.88em',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                {cell}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Instructions Footer */}
                            <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-xs text-slate-500">
                                ✂️ {i18n.language === 'vi'
                                    ? `Tạo tự động bởi Worksheet Generator Pro • Có ${result.cards.length} thẻ ngẫu nhiên cho cả lớp`
                                    : `Generated by Worksheet Generator Pro • ${result.cards.length} unique cards generated`}
                            </div>
                        </div>
                    </PaperPreview>
                </div>
            }
        />
        </>
    );
};
