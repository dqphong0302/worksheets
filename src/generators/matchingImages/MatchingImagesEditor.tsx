import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { MatchingImagesConfig, MatchingImageItem, ExportFormat } from '../../types';
import { MatchingImagesPlay } from './MatchingImagesPlay';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { exportPreviewToDOCX } from '../../services/exportService';
import { TemplateModal } from '../../components/template/TemplateModal';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getDefaultConfig(): MatchingImagesConfig {
    return {
        title: 'Match Pictures with Words',
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
        leftItems: [
            { text: 'Apple', imageData: '' },
            { text: 'Banana', imageData: '' },
            { text: 'Orange', imageData: '' },
            { text: 'Grape', imageData: '' },
        ],
        rightItems: [
            { text: 'Táo', imageData: '' },
            { text: 'Chuối', imageData: '' },
            { text: 'Cam', imageData: '' },
            { text: 'Nho', imageData: '' },
        ],
        leftHasImages: true,
        rightHasImages: false,
        shuffleRight: true,
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): MatchingImagesConfig {
    const saved = getEditorState<MatchingImagesConfig>('matchingImages');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultConfig(), ...config };
    }
    return getDefaultConfig();
}

interface MatchingImagesEditorProps {
    onHome: () => void;
}

export const MatchingImagesEditor: React.FC<MatchingImagesEditorProps> = ({ onHome }) => {
    const { t } = useTranslation();
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
    } = useUndoRedo<MatchingImagesConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('matchingImages', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const shuffledRight = useMemo(() =>
        config.shuffleRight ? shuffleArray(config.rightItems) : config.rightItems,
        [config.rightItems, config.shuffleRight]
    );

    const handleAddPair = () => {
        setConfig({
            ...config,
            leftItems: [...config.leftItems, { text: '', imageData: '' }],
            rightItems: [...config.rightItems, { text: '', imageData: '' }],
        });
    };

    const handleRemovePair = (index: number) => {
        setConfig({
            ...config,
            leftItems: config.leftItems.filter((_, i) => i !== index),
            rightItems: config.rightItems.filter((_, i) => i !== index),
        });
    };

    const handleItemChange = (
        side: 'left' | 'right',
        index: number,
        field: keyof MatchingImageItem,
        value: string
    ) => {
        const items = side === 'left' ? [...config.leftItems] : [...config.rightItems];
        items[index] = { ...items[index], [field]: value };
        setConfig({
            ...config,
            [side === 'left' ? 'leftItems' : 'rightItems']: items,
        });
    };

    const handleImageUpload = (
        side: 'left' | 'right',
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleItemChange(side, index, 'imageData', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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

    if (playMode) {
        return (
            <MatchingImagesPlay
                title={config.title}
                leftItems={config.leftItems.filter(item => item.text)}
                rightItems={config.rightItems.filter(item => item.text)}
                leftHasImages={config.leftHasImages}
                rightHasImages={config.rightHasImages}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    return (
        <>
        <TemplateModal
            isOpen={templateModalOpen}
            mode={templateModalMode}
            currentType="matchingImages"
            currentConfig={config}
            onClose={() => setTemplateModalOpen(false)}
            onLoadTemplate={tpl => setConfig(tpl.config)}
        />
        <EditorLayout
            toolbar={
                <Toolbar
                    title={t('modules.matchingImages.name')}
                    onUndo={undo}
                    onRedo={redo}
                    onReset={() => reset(getDefaultConfig())}
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
                    {/* Play Mode Button - PRIMARY FEATURE */}
                    <Button
                        variant="primary"
                        className="w-full mb-6"
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

                    <h3 className="mb-4" style={{ fontSize: '0.85rem', color: '#6b625a' }}>
                        {t('editor.config')} (for print/export)
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <div className="flex gap-2 mb-4">
                        <Checkbox
                            label="Left has images"
                            checked={config.leftHasImages}
                            onChange={e => setConfig({ ...config, leftHasImages: e.target.checked })}
                        />
                        <Checkbox
                            label="Right has images"
                            checked={config.rightHasImages}
                            onChange={e => setConfig({ ...config, rightHasImages: e.target.checked })}
                        />
                    </div>

                    <Checkbox
                        label="Shuffle right column"
                        checked={config.shuffleRight}
                        onChange={e => setConfig({ ...config, shuffleRight: e.target.checked })}
                    />

                    <div className="form-group mt-4">
                        <label className="label">Pairs</label>
                        {config.leftItems.map((leftItem, i) => (
                            <div key={i} style={{
                                marginBottom: '1em',
                                padding: '0.5em',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center', marginBottom: '0.5em' }}>
                                    <span style={{ fontWeight: 600, width: '60px' }}>Left:</span>
                                    <Input
                                        value={leftItem.text}
                                        onChange={e => handleItemChange('left', i, 'text', e.target.value)}
                                        placeholder="Left text"
                                        style={{ flex: 1, marginBottom: 0 }}
                                    />
                                    {config.leftHasImages && (
                                        <label style={{
                                            padding: '0.5em',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            background: leftItem.imageData ? '#e8f5e9' : 'transparent',
                                        }}><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg><input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleImageUpload('left', i, e)}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, width: '60px' }}>Right:</span>
                                    <Input
                                        value={config.rightItems[i]?.text || ''}
                                        onChange={e => handleItemChange('right', i, 'text', e.target.value)}
                                        placeholder="Right text"
                                        style={{ flex: 1, marginBottom: 0 }}
                                    />
                                    {config.rightHasImages && (
                                        <label style={{
                                            padding: '0.5em',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            background: config.rightItems[i]?.imageData ? '#e8f5e9' : 'transparent',
                                        }}><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg><input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleImageUpload('right', i, e)}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleRemovePair(i)}
                                        style={{ padding: '0.25em 0.5em' }}
                                    ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></Button>
                                </div>
                            </div>
                        ))}
                        <Button variant="secondary" onClick={handleAddPair} className="w-full">
                            + Add Pair
                        </Button>
                    </div>

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
                            <h1 style={{ textAlign: 'center', marginBottom: '0.5em', fontSize: '1.4em' }}>
                                {config.title}
                            </h1>

                            <p style={{ marginBottom: '1em' }}>
                                Draw a line to match the items.
                            </p>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                maxWidth: '500px',
                                margin: '0 auto',
                            }}>
                                {/* Left column */}
                                <div>
                                    {config.leftItems.map((item, i) => (
                                        <div key={i} style={{
                                            marginBottom: '1em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5em',
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{i + 1}.</span>
                                            {config.leftHasImages && item.imageData && (
                                                <img
                                                    src={item.imageData}
                                                    alt={item.text}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            )}
                                            {(!config.leftHasImages || !item.imageData) && (
                                                <span style={{
                                                    padding: '0.5em 1em',
                                                    border: '1px solid #333',
                                                    borderRadius: '4px',
                                                }}>
                                                    {item.text}
                                                </span>
                                            )}
                                            <span>•</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Right column */}
                                <div>
                                    {shuffledRight.map((item, i) => (
                                        <div key={i} style={{
                                            marginBottom: '1em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5em',
                                        }}>
                                            <span>•</span>
                                            {config.rightHasImages && item.imageData && (
                                                <img
                                                    src={item.imageData}
                                                    alt={item.text}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            )}
                                            {(!config.rightHasImages || !item.imageData) && (
                                                <span style={{
                                                    padding: '0.5em 1em',
                                                    border: '1px solid #333',
                                                    borderRadius: '4px',
                                                }}>
                                                    {item.text}
                                                </span>
                                            )}
                                            <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + i)}.</span>
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
                                }}>
                                    <h3 style={{ marginBottom: '0.5em' }}>Answer Key</h3>
                                    {config.leftItems.map((left, i) => {
                                        const rightIndex = shuffledRight.findIndex(r => r.text === config.rightItems[i]?.text);
                                        return (
                                            <p key={i}>
                                                {i + 1} → {String.fromCharCode(65 + rightIndex)} ({left.text} → {config.rightItems[i]?.text})
                                            </p>
                                        );
                                    })}
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
