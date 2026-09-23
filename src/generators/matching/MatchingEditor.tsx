import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { parsePairs, validatePairs } from '../../utils/validation';
import { MatchingConfig, MatchingResult, ExportFormat } from '../../types';
import { MatchingPlay } from './MatchingPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateMatching(config: MatchingConfig): MatchingResult {
    const leftItems = config.pairs.map(p => p.left);
    const rightItems = config.pairs.map(p => p.right);

    const shuffledRight = config.shuffleRight ? shuffleArray(rightItems) : [...rightItems];

    // Create answer mapping (left index -> shuffled right index)
    const answers = leftItems.map((_, i) => {
        const originalRight = rightItems[i];
        return shuffledRight.indexOf(originalRight);
    });

    return { leftItems, rightItems, shuffledRight, answers };
}

function getDefaultMatchingConfig(): MatchingConfig {
    return {
        title: 'Matching Exercise',
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
        shuffleRight: true,
        connectorStyle: 'dots',
        pairs: [
            { left: 'Apple', right: 'Táo' },
            { left: 'Banana', right: 'Chuối' },
            { left: 'Orange', right: 'Cam' },
            { left: 'Grape', right: 'Nho' },
            { left: 'Mango', right: 'Xoài' },
        ],
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): MatchingConfig {
    const saved = getEditorState<MatchingConfig>('matching');
    if (saved) {
        const { lastModified, ...config } = saved;
        return { ...getDefaultMatchingConfig(), ...config };
    }
    return getDefaultMatchingConfig();
}

interface MatchingEditorProps {
    onHome: () => void;
}

export const MatchingEditor: React.FC<MatchingEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<MatchingConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('matching', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateMatching(config), [config]);

    const validation = useMemo(() => {
        return validatePairs(config.pairs, { minCount: 2 });
    }, [config.pairs]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const pairs = topic.words.map(w => ({
            left: w.word,
            right: (i18n.language === 'vi' ? w.pairRightVi : w.pairRightEn) || (i18n.language === 'vi' ? w.clueVi : w.clueEn),
        }));
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Nối Cặp Từ' : 'Matching Exercise'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            pairs,
        });
    };

    const handlePairsChange = (text: string) => {
        const pairs = parsePairs(text);
        setConfig({ ...config, pairs });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                sections: [
                    { type: 'paragraph', content: 'Draw a line to match the items on the left with the correct items on the right.' },
                    {
                        type: 'list', content: result.leftItems.map((left, i) =>
                            `${left}  ————  ${result.shuffledRight[i]}`
                        )
                    },
                    ...(config.showAnswerKey ? [
                        { type: 'paragraph' as const, content: '—— Answer Key ——' },
                        {
                            type: 'numberedList' as const, content: result.leftItems.map((left, i) =>
                                `${left} → ${result.rightItems[i]}`
                            )
                        },
                    ] : []),
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    const pairsText = config.pairs.map(p => `${p.left} | ${p.right}`).join('\n');

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="matching"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.matching.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultMatchingConfig())}
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
                            {t('editor.config')} (for print/export)
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

                        <Textarea
                            label={t('editor.pairs')}
                            value={pairsText}
                            onChange={e => handlePairsChange(e.target.value)}
                            placeholder={t('editor.pairsPlaceholder')}
                            rows={10}
                            error={validation.errors[0]}
                        />

                        <Checkbox
                            label="Shuffle right column"
                            checked={config.shuffleRight}
                            onChange={e => setConfig({ ...config, shuffleRight: e.target.checked })}
                        />

                        <Select
                            label="Connector Style"
                            value={config.connectorStyle}
                            onChange={e => setConfig({ ...config, connectorStyle: e.target.value as any })}
                            options={[
                                { value: 'dots', label: 'Dots' },
                                { value: 'lines', label: 'Lines' },
                                { value: 'numbers', label: 'Numbers' },
                            ]}
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
                                <h1 style={{ textAlign: 'center', marginBottom: '1em', fontSize: '1.4em' }}>
                                    {config.title}
                                </h1>

                                <p style={{ marginBottom: '1em' }}>
                                    Draw a line to match the items on the left with the correct items on the right.
                                </p>

                                {/* Matching columns */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    maxWidth: '400px',
                                    margin: '0 auto',
                                }}>
                                    {/* Left column */}
                                    <div>
                                        {result.leftItems.map((item, i) => (
                                            <div key={i} style={{
                                                padding: '0.5em 1em',
                                                marginBottom: '0.75em',
                                                border: '1px solid #333',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}>
                                                {config.connectorStyle === 'numbers' && (
                                                    <span style={{ marginRight: '0.5em', fontWeight: 600 }}>{i + 1}.</span>
                                                )}
                                                {item}
                                                {config.connectorStyle === 'dots' && (
                                                    <span style={{ marginLeft: '1em' }}>•</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Middle connector area */}
                                    <div style={{
                                        width: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {config.connectorStyle === 'lines' && (
                                            <div style={{
                                                width: '100%',
                                                borderTop: '1px dashed #ccc'
                                            }} />
                                        )}
                                    </div>

                                    {/* Right column */}
                                    <div>
                                        {result.shuffledRight.map((item, i) => (
                                            <div key={i} style={{
                                                padding: '0.5em 1em',
                                                marginBottom: '0.75em',
                                                border: '1px solid #333',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}>
                                                {config.connectorStyle === 'dots' && (
                                                    <span style={{ marginRight: '1em' }}>•</span>
                                                )}
                                                {config.connectorStyle === 'numbers' && (
                                                    <span style={{ marginRight: '0.5em', fontWeight: 600 }}>{String.fromCharCode(65 + i)}.</span>
                                                )}
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Answer key */}
                                {config.showAnswerKey && (
                                    <div style={{
                                        marginTop: '2em',
                                        padding: '1em',
                                        background: '#f5f5f5',
                                        borderRadius: '4px',
                                        pageBreakBefore: 'always',
                                    }}>
                                        <h3 style={{ marginBottom: '0.5em' }}>Answer Key</h3>
                                        {result.leftItems.map((left, i) => (
                                            <p key={i}>
                                                {config.connectorStyle === 'numbers'
                                                    ? `${i + 1} → ${String.fromCharCode(65 + result.answers[i])}`
                                                    : `${left} → ${result.rightItems[i]}`
                                                }
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </PaperPreview>
                    </div>
                }
            />

            {/* Play Mode */}
            {
                playMode && (
                    <MatchingPlay
                        title={config.title}
                        leftItems={result.leftItems}
                        rightItems={result.shuffledRight}
                        correctPairs={new Map(result.answers.map((r, i) => [i, r]))}
                        onClose={() => setPlayMode(false)}
                    />
                )
            }
        </>
    );
};
