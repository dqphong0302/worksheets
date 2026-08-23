import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Modal, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { parseWords, validateWords } from '../../utils/validation';
import { WordSearchConfig, ExportFormat } from '../../types';
import { generateWordSearch, getDefaultWordSearchConfig } from './wordSearchGenerator';
import { WordSearchPlay } from './WordSearchPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveTemplate, getAllTemplates, deleteTemplate, saveEditorState, getEditorState } from '../../services/storageService';
import { v4 as uuidv4 } from 'uuid';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

// Get initial config from localStorage or use default
function getInitialConfig(): WordSearchConfig {
    const saved = getEditorState<WordSearchConfig>('wordSearch');
    if (saved) {
        const { lastModified, ...config } = saved;
        return { ...getDefaultWordSearchConfig(), ...config };
    }
    return getDefaultWordSearchConfig();
}

interface WordSearchEditorProps {
    onHome: () => void;
}

export const WordSearchEditor: React.FC<WordSearchEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
    const answerRef = useRef<HTMLDivElement>(null);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateModalMode, setTemplateModalMode] = useState<'save' | 'load'>('save');
    const [showAnswerPreview, setShowAnswerPreview] = useState(false);
    const [playMode, setPlayMode] = useState(false);

    const {
        state: config,
        setState: setConfig,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
    } = useUndoRedo<WordSearchConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('wordSearch', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    // Generate puzzle
    const result = useMemo(() => generateWordSearch(config), [config]);

    // Validation
    const validation = useMemo(() => {
        return validateWords(config.words, { minCount: 2, maxLength: config.gridSize });
    }, [config.words, config.gridSize]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const words = topic.words.map(w => w.word);
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Tìm Từ' : 'Word Search'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            words,
        });
    };

    const handleWordsChange = (text: string) => {
        const words = parseWords(text);
        setConfig({ ...config, words });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: config.subtitle,
                sections: [
                    { type: 'grid', content: result.grid },
                    { type: 'paragraph', content: 'Find these words:' },
                    { type: 'list', content: result.placements.map(p => p.word) },
                ],
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="wordSearch"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.wordSearch.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultWordSearchConfig())}
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
                            ⚙️ {t('editor.config')} (for print/export)
                        </h3>

                        <Input
                            label={t('editor.title')}
                            value={config.title}
                            onChange={e => setConfig({ ...config, title: e.target.value })}
                        />

                        <Input
                            label={t('editor.subtitle')}
                            value={config.subtitle || ''}
                            onChange={e => setConfig({ ...config, subtitle: e.target.value })}
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

                        <Select
                            label={t('editor.worksheetLanguage')}
                            value={config.worksheetLanguage || 'en'}
                            onChange={e => setConfig({ ...config, worksheetLanguage: e.target.value as any })}
                            options={[
                                { value: 'en', label: t('worksheetLang.english') },
                                { value: 'vi', label: t('worksheetLang.vietnamese') },
                            ]}
                        />

                        <Textarea
                            label={t('editor.words')}
                            value={config.words.join('\n')}
                            onChange={e => handleWordsChange(e.target.value)}
                            placeholder={t('editor.wordsPlaceholder')}
                            rows={8}
                            error={validation.errors[0]}
                        />

                        <NumberInput
                            label={t('editor.gridSize')}
                            value={config.gridSize}
                            min={8}
                            max={20}
                            onChange={e => setConfig({ ...config, gridSize: parseInt(e.target.value) || 12 })}
                        />

                        <div className="flex flex-col gap-sm mb-md">
                            <Checkbox
                                label={t('editor.allowDiagonal')}
                                checked={config.allowDiagonal}
                                onChange={e => setConfig({ ...config, allowDiagonal: e.target.checked })}
                            />
                            <Checkbox
                                label={t('editor.allowReverse')}
                                checked={config.allowReverse}
                                onChange={e => setConfig({ ...config, allowReverse: e.target.checked })}
                            />
                            <Checkbox
                                label={t('editor.uppercase')}
                                checked={config.uppercase}
                                onChange={e => setConfig({ ...config, uppercase: e.target.checked })}
                            />
                            <Checkbox
                                label={t('editor.showAnswerKey')}
                                checked={config.showAnswerKey}
                                onChange={e => setConfig({ ...config, showAnswerKey: e.target.checked })}
                            />
                        </div>

                        {config.showAnswerKey && (
                            <Button
                                variant="secondary"
                                className="w-full mb-md"
                                onClick={() => setShowAnswerPreview(!showAnswerPreview)}
                            >
                                {showAnswerPreview ? 'Show Puzzle' : 'Show Answer Key'}
                            </Button>
                        )}

                        {/* Page Settings */}
                        <div style={{
                            marginTop: 'var(--space-lg)',
                            paddingTop: 'var(--space-lg)',
                            borderTop: '1px solid var(--color-border)',
                        }}>
                            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                                📄 {t('editor.paperSettings')}
                            </h4>

                            {/* Border style */}
                            <Select
                                label={t('editor.borderStyle')}
                                value={config.borderStyle}
                                onChange={e => setConfig({ ...config, borderStyle: e.target.value as any })}
                                options={[
                                    { value: 'none', label: t('borders.none') },
                                    { value: 'simple', label: t('borders.simple') },
                                    { value: 'double', label: t('borders.double') },
                                    { value: 'dotted', label: t('borders.dotted') },
                                    { value: 'decorative', label: t('borders.decorative') },
                                    { value: 'elegant', label: t('borders.elegant') },
                                ]}
                            />

                            {/* Student info section */}
                            <div className="form-group">
                                <Checkbox
                                    label={t('editor.showStudentInfo')}
                                    checked={config.studentInfo.showStudentInfo}
                                    onChange={e => setConfig({
                                        ...config,
                                        studentInfo: { ...config.studentInfo, showStudentInfo: e.target.checked }
                                    })}
                                />

                                {config.studentInfo.showStudentInfo && (
                                    <div style={{
                                        marginLeft: 'var(--space-lg)',
                                        marginTop: 'var(--space-sm)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--space-xs)',
                                    }}>
                                        <Checkbox
                                            label={t('studentInfo.name')}
                                            checked={config.studentInfo.showName}
                                            onChange={e => setConfig({
                                                ...config,
                                                studentInfo: { ...config.studentInfo, showName: e.target.checked }
                                            })}
                                        />
                                        <Checkbox
                                            label={t('studentInfo.class')}
                                            checked={config.studentInfo.showClass}
                                            onChange={e => setConfig({
                                                ...config,
                                                studentInfo: { ...config.studentInfo, showClass: e.target.checked }
                                            })}
                                        />
                                        <Checkbox
                                            label={t('studentInfo.date')}
                                            checked={config.studentInfo.showDate}
                                            onChange={e => setConfig({
                                                ...config,
                                                studentInfo: { ...config.studentInfo, showDate: e.target.checked }
                                            })}
                                        />
                                        <Checkbox
                                            label={t('studentInfo.score')}
                                            checked={config.studentInfo.showScore}
                                            onChange={e => setConfig({
                                                ...config,
                                                studentInfo: { ...config.studentInfo, showScore: e.target.checked }
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                }
                preview={
                    <div className="animate-slideUp" style={{ position: 'relative' }}>
                        <ZoomControl
                            zoom={config.zoom}
                            onZoomChange={zoom => setConfig({ ...config, zoom })}
                        />
                        {!showAnswerPreview ? (
                            <PaperPreview ref={previewRef} paperSize={config.paperSize} scale={config.zoom}>
                                {/* Border decoration */}
                                {config.borderStyle !== 'none' && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: config.borderStyle === 'double' ? '6mm' : '8mm',
                                        border: config.borderStyle === 'simple' ? '2px solid #333' :
                                            config.borderStyle === 'dotted' ? '3px dotted #666' :
                                                config.borderStyle === 'decorative' ? '4px solid #6366f1' :
                                                    config.borderStyle === 'double' ? '2px solid #333' :
                                                        '1px solid #333',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                                {config.borderStyle === 'double' && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: '10mm',
                                        border: '1px solid #333',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                                <div style={{ fontFamily: config.font, fontSize: config.fontSize }}>
                                    {/* Student Info */}
                                    {config.studentInfo.showStudentInfo && (
                                        <div style={{
                                            marginBottom: '1em',
                                            fontSize: '0.9em',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.5em 2em',
                                        }}>
                                            {config.studentInfo.showName && (
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                                                    <span style={{ fontWeight: 500 }}>{config.worksheetLanguage === 'vi' ? 'Họ tên:' : 'Name:'}</span>
                                                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                                                </div>
                                            )}
                                            {config.studentInfo.showClass && (
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                                                    <span style={{ fontWeight: 500 }}>{config.worksheetLanguage === 'vi' ? 'Lớp:' : 'Class:'}</span>
                                                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                                                </div>
                                            )}
                                            {config.studentInfo.showDate && (
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                                                    <span style={{ fontWeight: 500 }}>{config.worksheetLanguage === 'vi' ? 'Ngày:' : 'Date:'}</span>
                                                    <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.2em' }} />
                                                </div>
                                            )}
                                            {config.studentInfo.showScore && (
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5em' }}>
                                                    <span style={{ fontWeight: 500 }}>{config.worksheetLanguage === 'vi' ? 'Điểm:' : 'Score:'}</span>
                                                    <span style={{
                                                        width: '50px',
                                                        height: '30px',
                                                        border: '1px solid #333',
                                                        borderRadius: '4px',
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <h1 style={{ textAlign: 'center', marginBottom: '0.5em', fontSize: '1.5em' }}>
                                        {config.title}
                                    </h1>
                                    {config.subtitle && (
                                        <p style={{ textAlign: 'center', marginBottom: '1em', color: '#666' }}>
                                            {config.subtitle}
                                        </p>
                                    )}

                                    {/* Grid */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5em' }}>
                                        <table style={{ borderCollapse: 'collapse' }}>
                                            <tbody>
                                                {result.grid.map((row, i) => (
                                                    <tr key={i}>
                                                        {row.map((cell, j) => (
                                                            <td
                                                                key={j}
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    textAlign: 'center',
                                                                    border: '1px solid #ddd',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Word List */}
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.5em' }}>Find these words:</p>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: '0.25em',
                                            fontSize: '0.9em'
                                        }}>
                                            {result.placements.map((p, i) => (
                                                <span key={i}>• {p.word}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </PaperPreview>
                        ) : (
                            <PaperPreview ref={answerRef} paperSize={config.paperSize} scale={0.55}>
                                <div style={{ fontFamily: config.font, fontSize: config.fontSize }}>
                                    <h1 style={{ textAlign: 'center', marginBottom: '0.5em', fontSize: '1.5em' }}>
                                        {config.title} - Answer Key
                                    </h1>

                                    {/* Grid with highlights */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5em' }}>
                                        <table style={{ borderCollapse: 'collapse' }}>
                                            <tbody>
                                                {result.grid.map((row, rowIdx) => (
                                                    <tr key={rowIdx}>
                                                        {row.map((cell, colIdx) => {
                                                            // Check if this cell is part of a word
                                                            const isPartOfWord = result.placements.some(p => {
                                                                for (let i = 0; i < p.word.length; i++) {
                                                                    const r = p.startRow + i * p.direction.row;
                                                                    const c = p.startCol + i * p.direction.col;
                                                                    if (r === rowIdx && c === colIdx) return true;
                                                                }
                                                                return false;
                                                            });

                                                            return (
                                                                <td
                                                                    key={colIdx}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        textAlign: 'center',
                                                                        border: '1px solid #ddd',
                                                                        fontWeight: 500,
                                                                        background: isPartOfWord ? '#fef08a' : 'transparent',
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

                                    {/* Word positions */}
                                    <div style={{ fontSize: '0.85em' }}>
                                        {result.placements.map((p, i) => (
                                            <p key={i}>
                                                <strong>{p.word}</strong>: Row {p.startRow + 1}, Col {p.startCol + 1}
                                                {p.direction.row === 0 && p.direction.col === 1 && ' → Right'}
                                                {p.direction.row === 1 && p.direction.col === 0 && ' ↓ Down'}
                                                {p.direction.row === 1 && p.direction.col === 1 && ' ↘ Diagonal'}
                                                {p.direction.row === -1 && p.direction.col === 1 && ' ↗ Diagonal'}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </PaperPreview>
                        )}
                    </div>
                }
            />

            {/* Play Mode Overlay */}
            {
                playMode && (
                    <WordSearchPlay
                        title={config.title}
                        result={result}
                        words={config.words}
                        onClose={() => setPlayMode(false)}
                    />
                )
            }
        </>
    );
};
