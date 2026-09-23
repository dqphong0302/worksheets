import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { parseWords, validateWords } from '../../utils/validation';
import { SpellingTestConfig, ExportFormat } from '../../types';
import { SpellingTestPlay } from './SpellingTestPlay';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { exportPreviewToDOCX } from '../../services/exportService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getDefaultSpellingTestConfig(): SpellingTestConfig {
    return {
        title: 'Spelling Test',
        subtitle: 'Listen and write the words',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 14,
        font: 'Arial',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        words: ['beautiful', 'necessary', 'definitely', 'separate', 'occurrence', 'recommend', 'accommodate', 'embarrass'],
        columns: 2,
        lineStyle: 'solid',
        showNumbers: true,
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): SpellingTestConfig {
    const saved = getEditorState<SpellingTestConfig>('spellingTest');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultSpellingTestConfig(), ...config };
    }
    return getDefaultSpellingTestConfig();
}

interface SpellingTestEditorProps {
    onHome: () => void;
}

export const SpellingTestEditor: React.FC<SpellingTestEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
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
    } = useUndoRedo<SpellingTestConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('spellingTest', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const validation = validateWords(config.words, { minCount: 1 });

    const handleApplyPreset = (topic: PresetTopic) => {
        const words = topic.words.map(w => w.word);
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Bài Chính Tả' : 'Spelling Test'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            words,
        });
    };

    const handleWordsChange = (text: string) => {
        const words = parseWords(text);
        setConfig({ ...config, words });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx' && previewRef.current) {
            await exportPreviewToDOCX(
                previewRef.current,
                config.title.replace(/\s+/g, '_'),
                config.paperSize
            );
        }
    };

    const lineStyles: Record<string, string> = {
        solid: '1px solid #333',
        dashed: '1px dashed #666',
        dotted: '2px dotted #999',
    };

    const itemsPerColumn = Math.ceil(config.words.length / config.columns);

    if (playMode) {
        return (
            <SpellingTestPlay
                title={config.title}
                words={config.words.filter(w => w.trim())}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="spellingTest"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.spellingTest.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultSpellingTestConfig())}
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
                                background: '#2f7a4f',
                                fontSize: '1.2rem',
                                padding: '1rem',
                                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                            }}
                        >
                            Chơi Ngay / Play Now
                        </Button>

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

                        <h3 className="mb-4" style={{ fontSize: '0.85rem', color: '#6b625a' }}>
                            {t('editor.config')}
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

                    <Textarea
                        label={t('editor.words')}
                        value={config.words.join('\n')}
                        onChange={e => handleWordsChange(e.target.value)}
                        placeholder={t('editor.wordsPlaceholder')}
                        rows={8}
                        error={validation.errors[0]}
                    />

                    <NumberInput
                        label={t('spelling.columns')}
                        value={config.columns}
                        min={1}
                        max={3}
                        onChange={e => setConfig({ ...config, columns: parseInt(e.target.value) || 2 })}
                    />

                    <Select
                        label={t('spelling.lineStyle')}
                        value={config.lineStyle}
                        onChange={e => setConfig({ ...config, lineStyle: e.target.value as SpellingTestConfig['lineStyle'] })}
                        options={[
                            { value: 'solid', label: t('spelling.solid') },
                            { value: 'dashed', label: t('spelling.dashed') },
                            { value: 'dotted', label: t('spelling.dotted') },
                        ]}
                    />

                    <Checkbox
                        label={t('spelling.showNumbers')}
                        checked={config.showNumbers}
                        onChange={e => setConfig({ ...config, showNumbers: e.target.checked })}
                    />

                    <Checkbox
                        label={t('editor.showAnswerKey')}
                        checked={config.showAnswerKey}
                        onChange={e => setConfig({ ...config, showAnswerKey: e.target.checked })}
                    />
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
                            <h1 style={{ textAlign: 'center', marginBottom: '0.25em', fontSize: '1.4em' }}>
                                {config.title}
                            </h1>
                            {config.subtitle && (
                                <p style={{ textAlign: 'center', marginBottom: '1.5em', color: '#666' }}>
                                    {config.subtitle}
                                </p>
                            )}

                            <p style={{ marginBottom: '0.5em' }}>Name: _________________________ Date: _____________</p>

                            {/* Spelling lines */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                                gap: '0 2em',
                                marginTop: '1.5em',
                            }}>
                                {Array.from({ length: config.columns }).map((_, colIdx) => (
                                    <div key={colIdx}>
                                        {config.words.slice(colIdx * itemsPerColumn, (colIdx + 1) * itemsPerColumn).map((_, rowIdx) => {
                                            const actualIndex = colIdx * itemsPerColumn + rowIdx;
                                            return (
                                                <div key={rowIdx} style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    marginBottom: '1.5em',
                                                }}>
                                                    {config.showNumbers && (
                                                        <span style={{ width: '30px', fontWeight: 500 }}>
                                                            {actualIndex + 1}.
                                                        </span>
                                                    )}
                                                    <div style={{
                                                        flex: 1,
                                                        borderBottom: lineStyles[config.lineStyle],
                                                        minHeight: '24px',
                                                    }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Answer key (Teacher's copy) */}
                            {config.showAnswerKey && (
                                <div style={{
                                    marginTop: '3em',
                                    padding: '1em',
                                    background: '#f9f9f9',
                                    borderRadius: '4px',
                                    borderTop: '2px dashed #ccc',
                                }}>
                                    <h3 style={{ marginBottom: '0.5em' }}>Teacher's Answer Key</h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                                        gap: '0.25em 1em',
                                    }}>
                                        {config.words.map((word, i) => (
                                            <p key={i}>{config.showNumbers ? `${i + 1}. ` : ''}{word}</p>
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
