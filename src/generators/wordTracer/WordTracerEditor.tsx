import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { WordTracerConfig, ExportFormat } from '../../types';
import { WordTracerPlay } from './WordTracerPlay';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { exportPreviewToDOCX } from '../../services/exportService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getDefaultWordTracerConfig(): WordTracerConfig {
    return {
        title: 'Handwriting Practice',
        paperSize: 'a4',
        showAnswerKey: false,
        fontSize: 48,
        font: 'Comic Sans MS',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        text: 'Aa Bb Cc\nHello World\n1 2 3 4 5',
        style: 'dotted',
        lineHeight: 2.5,
        showGuideLines: true,
        repetitions: 1,
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): WordTracerConfig {
    const saved = getEditorState<WordTracerConfig>('wordTracer');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultWordTracerConfig(), ...config };
    }
    return getDefaultWordTracerConfig();
}

interface WordTracerEditorProps {
    onHome: () => void;
}

export const WordTracerEditor: React.FC<WordTracerEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<WordTracerConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('wordTracer', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const text = topic.words.map(w => w.word).join('\n');
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Tập Viết' : 'Handwriting'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            text,
        });
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

    const lines = config.text.split('\n').filter(line => line.trim());

    const getTextStyle = (): React.CSSProperties => {
        switch (config.style) {
            case 'dotted':
                return {
                    color: 'transparent',
                    textShadow: '0 0 0 #ccc',
                    WebkitTextStroke: '1px #999',
                    backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                };
            case 'faded':
                return {
                    color: '#ddd',
                };
            case 'outline':
                return {
                    color: 'transparent',
                    WebkitTextStroke: '1px #888',
                };
            default:
                return {};
        }
    };

    if (playMode) {
        const words = config.text.split('\n').filter(line => line.trim());
        return (
            <WordTracerPlay
                title={config.title}
                words={words}
                font={config.font}
                fontSize={config.fontSize}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="wordTracer"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.wordTracer.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultWordTracerConfig())}
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

                    <Textarea
                        label={t('tracer.text')}
                        value={config.text}
                        onChange={e => setConfig({ ...config, text: e.target.value })}
                        placeholder="Enter text to trace, one line per row"
                        rows={6}
                    />

                    <Select
                        label={t('tracer.style')}
                        value={config.style}
                        onChange={e => setConfig({ ...config, style: e.target.value as WordTracerConfig['style'] })}
                        options={[
                            { value: 'dotted', label: t('tracer.dotted') },
                            { value: 'faded', label: t('tracer.faded') },
                            { value: 'outline', label: t('tracer.outline') },
                        ]}
                    />

                    <NumberInput
                        label={t('editor.fontSize')}
                        value={config.fontSize}
                        min={24}
                        max={72}
                        onChange={e => setConfig({ ...config, fontSize: parseInt(e.target.value) || 48 })}
                    />

                    <NumberInput
                        label={t('tracer.lineHeight')}
                        value={config.lineHeight}
                        min={1.5}
                        max={4}
                        step={0.5}
                        onChange={e => setConfig({ ...config, lineHeight: parseFloat(e.target.value) || 2.5 })}
                    />

                    <NumberInput
                        label={t('tracer.repetitions')}
                        value={config.repetitions}
                        min={1}
                        max={5}
                        onChange={e => setConfig({ ...config, repetitions: parseInt(e.target.value) || 1 })}
                    />

                    <Checkbox
                        label={t('tracer.showGuideLines')}
                        checked={config.showGuideLines}
                        onChange={e => setConfig({ ...config, showGuideLines: e.target.checked })}
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
                        <div style={{ fontFamily: config.font }}>
                            <h1 style={{ textAlign: 'center', marginBottom: '0.5em', fontSize: '24px' }}>
                                {config.title}
                            </h1>

                            <p style={{ textAlign: 'center', marginBottom: '1em', fontSize: '14px', color: '#666' }}>
                                Trace the letters carefully.
                            </p>

                            {/* Tracer lines */}
                            <div style={{ marginTop: '1em' }}>
                                {lines.map((line, lineIdx) => (
                                    <React.Fragment key={lineIdx}>
                                        {Array.from({ length: config.repetitions }).map((_, repIdx) => (
                                            <div key={repIdx} style={{
                                                position: 'relative',
                                                marginBottom: config.showGuideLines ? '0.5em' : '0.25em',
                                            }}>
                                                {/* Guide lines */}
                                                {config.showGuideLines && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: `${config.fontSize * config.lineHeight}px`,
                                                        borderBottom: '2px solid #333',
                                                        pointerEvents: 'none',
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: 0,
                                                            right: 0,
                                                            borderTop: '1px dashed #ccc',
                                                        }} />
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '25%',
                                                            left: 0,
                                                            right: 0,
                                                            borderTop: '1px dotted #eee',
                                                        }} />
                                                    </div>
                                                )}

                                                {/* Traceable text */}
                                                <div style={{
                                                    fontSize: `${config.fontSize}px`,
                                                    lineHeight: config.lineHeight,
                                                    fontFamily: config.font,
                                                    letterSpacing: '0.05em',
                                                    ...getTextStyle(),
                                                }}>
                                                    {line}
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </PaperPreview>
                </div>
            }
        />
        </>
    );
};
