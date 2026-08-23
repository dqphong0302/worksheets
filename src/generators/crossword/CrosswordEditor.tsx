import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { parseCrosswordEntries, validateCrosswordEntries } from '../../utils/validation';
import { CrosswordConfig, ExportFormat } from '../../types';
import { generateCrossword, getDefaultCrosswordConfig } from './crosswordGenerator';
import { CrosswordPlay } from './CrosswordPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

// Get initial config from localStorage or use default
function getInitialConfig(): CrosswordConfig {
    const saved = getEditorState<CrosswordConfig>('crossword');
    if (saved) {
        const { lastModified, ...config } = saved;
        return { ...getDefaultCrosswordConfig(), ...config };
    }
    return getDefaultCrosswordConfig();
}

interface CrosswordEditorProps {
    onHome: () => void;
}

export const CrosswordEditor: React.FC<CrosswordEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
    const [showAnswerPreview, setShowAnswerPreview] = useState(false);
    const [playMode, setPlayMode] = useState(false);
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
    } = useUndoRedo<CrosswordConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('crossword', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateCrossword(config), [config]);

    const validation = useMemo(() => {
        return validateCrosswordEntries(config.words, { minCount: 2, maxWordLength: config.gridSize });
    }, [config.words, config.gridSize]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const words = topic.words.map(w => ({
            word: w.word,
            clue: i18n.language === 'vi' ? w.clueVi : w.clueEn,
        }));
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Ô Chữ' : 'Crossword'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            words,
        });
    };

    const handleEntriesChange = (text: string) => {
        const entries = parseCrosswordEntries(text);
        setConfig({ ...config, words: entries });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            const gridContent = result.grid.map(row =>
                row.map(cell => cell.isBlack || cell.letter === '' ? '■' : (showAnswerPreview ? cell.letter : ' '))
            );
            await exportToDOCX({
                title: config.title,
                sections: [
                    { type: 'grid', content: gridContent },
                    { type: 'paragraph', content: 'ACROSS' },
                    { type: 'numberedList', content: result.acrossClues.map(c => `${c.number}. ${c.clue}`) },
                    { type: 'paragraph', content: 'DOWN' },
                    { type: 'numberedList', content: result.downClues.map(c => `${c.number}. ${c.clue}`) },
                ],
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    const entriesText = config.words.map(w => `${w.word} | ${w.clue}`).join('\n');

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="crossword"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.crossword.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultCrosswordConfig())}
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
                    <div className="animate-fadeIn">
                        {/* Play Mode Button */}
                        <Button
                            variant="primary"
                            className="w-full mb-lg"
                            onClick={() => setPlayMode(true)}
                            style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                fontSize: '1.2rem',
                                padding: '1rem',
                                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                            }}
                        >
                            🎮 Chơi Ngay / Play Now
                        </Button>

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

                        <h3 className="mb-md" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            ⚙️ {t('editor.config')}
                        </h3>

                        <Input
                            label={t('editor.title')}
                            value={config.title}
                            onChange={e => setConfig({ ...config, title: e.target.value })}
                        />

                        <Select
                            label={t('editor.paperSize')}
                            value={config.paperSize}
                            onChange={e => setConfig({ ...config, paperSize: e.target.value as any })}
                            options={[
                                { value: 'a4', label: 'A4' },
                                { value: 'letter', label: 'Letter' },
                            ]}
                        />

                        {/* Word/Clue pairs - 2 columns */}
                        <div className="form-group">
                            <label className="label">{t('editor.clues')}</label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr',
                                gap: '8px',
                                marginBottom: '8px',
                            }}>
                                <span className="text-xs text-muted font-medium">Từ vựng</span>
                                <span className="text-xs text-muted font-medium">Gợi ý</span>
                            </div>
                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                            }}>
                                {config.words.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 2fr auto',
                                            gap: '6px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={entry.word}
                                            onChange={e => {
                                                const newWords = [...config.words];
                                                newWords[idx] = { ...entry, word: e.target.value.toUpperCase() };
                                                setConfig({ ...config, words: newWords });
                                            }}
                                            placeholder="WORD"
                                            className="input"
                                            style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 600 }}
                                        />
                                        <input
                                            type="text"
                                            value={entry.clue}
                                            onChange={e => {
                                                const newWords = [...config.words];
                                                newWords[idx] = { ...entry, clue: e.target.value };
                                                setConfig({ ...config, words: newWords });
                                            }}
                                            placeholder="Clue description..."
                                            className="input"
                                            style={{ padding: '8px 10px', fontSize: '13px' }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newWords = config.words.filter((_, i) => i !== idx);
                                                setConfig({ ...config, words: newWords });
                                            }}
                                            className="btn btn-ghost"
                                            style={{ padding: '6px', minWidth: 'auto' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full mt-sm"
                                onClick={() => {
                                    setConfig({
                                        ...config,
                                        words: [...config.words, { word: '', clue: '' }]
                                    });
                                }}
                            >
                                + Thêm từ
                            </Button>
                            {validation.errors[0] && (
                                <p className="text-xs mt-sm" style={{ color: 'var(--color-danger)' }}>
                                    {validation.errors[0]}
                                </p>
                            )}
                        </div>

                        <NumberInput
                            label={t('editor.gridSize')}
                            value={config.gridSize}
                            min={10}
                            max={20}
                            onChange={e => setConfig({ ...config, gridSize: parseInt(e.target.value) || 15 })}
                        />

                        <Checkbox
                            label={t('editor.showAnswerKey')}
                            checked={config.showAnswerKey}
                            onChange={e => setConfig({ ...config, showAnswerKey: e.target.checked })}
                        />

                        {config.showAnswerKey && (
                            <Button
                                variant="secondary"
                                className="w-full mt-md"
                                onClick={() => setShowAnswerPreview(!showAnswerPreview)}
                            >
                                {showAnswerPreview ? 'Show Puzzle' : 'Show Answer Key'}
                            </Button>
                        )}

                        <div className="mt-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <p>Words placed: {result.placements.length} / {config.words.length}</p>
                        </div>
                    </div>
                }
                preview={
                    <div className="animate-slideUp" style={{ position: 'relative' }}>
                        <ZoomControl
                            zoom={config.zoom}
                            onZoomChange={zoom => setConfig({ ...config, zoom })}
                        />
                        <PaperPreview ref={previewRef} paperSize={config.paperSize} scale={config.zoom}>
                            <div style={{ fontFamily: config.font, fontSize: config.fontSize }}>
                                <h1 style={{ textAlign: 'center', marginBottom: '0.5em', fontSize: '1.4em' }}>
                                    {config.title} {showAnswerPreview && '- Answer Key'}
                                </h1>

                                {/* Grid */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1em' }}>
                                    <table style={{ borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {result.grid.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    {row.map((cell, colIdx) => (
                                                        <td
                                                            key={colIdx}
                                                            style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                textAlign: 'center',
                                                                border: cell.isBlack && cell.letter === '' ? '1px solid #d1d5db' : '1px solid #333',
                                                                background: cell.isBlack && cell.letter === '' ? '#e5e7eb' : '#fff',
                                                                position: 'relative',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {cell.number && (
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    top: 1,
                                                                    left: 2,
                                                                    fontSize: '8px',
                                                                    fontWeight: 400,
                                                                }}>
                                                                    {cell.number}
                                                                </span>
                                                            )}
                                                            {showAnswerPreview && cell.letter}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Clues */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em', fontSize: '0.8em' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.5em' }}>ACROSS</h3>
                                        {result.acrossClues.map(clue => (
                                            <p key={clue.number} style={{ marginBottom: '0.25em' }}>
                                                <strong>{clue.number}.</strong> {clue.clue}
                                            </p>
                                        ))}
                                    </div>
                                    <div>
                                        <h3 style={{ marginBottom: '0.5em' }}>DOWN</h3>
                                        {result.downClues.map(clue => (
                                            <p key={clue.number} style={{ marginBottom: '0.25em' }}>
                                                <strong>{clue.number}.</strong> {clue.clue}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </PaperPreview>
                    </div>
                }
            />

            {/* Play Mode Overlay */}
            {
                playMode && (
                    <CrosswordPlay
                        title={config.title}
                        result={result}
                        onClose={() => setPlayMode(false)}
                    />
                )
            }
        </>
    );
};
