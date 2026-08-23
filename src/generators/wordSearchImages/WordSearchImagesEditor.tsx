import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { WordSearchImagesConfig, WordSearchImageItem, ExportFormat } from '../../types';
import { generateWordSearch } from '../wordSearch/wordSearchGenerator';
import { WordSearchImagesPlay } from './WordSearchImagesPlay';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { exportPreviewToDOCX } from '../../services/exportService';
import { TemplateModal } from '../../components/template/TemplateModal';

function getDefaultConfig(): WordSearchImagesConfig {
    return {
        title: 'Word Search with Pictures',
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
        zoom: 0.5,
        items: [
            { word: 'CAT', imageUrl: '' },
            { word: 'DOG', imageUrl: '' },
            { word: 'BIRD', imageUrl: '' },
            { word: 'FISH', imageUrl: '' },
        ],
        gridSize: 10,
        allowDiagonal: true,
        allowReverse: false,
        uppercase: true,
        showImagesBelow: true,
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): WordSearchImagesConfig {
    const saved = getEditorState<WordSearchImagesConfig>('wordSearchImages');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultConfig(), ...config };
    }
    return getDefaultConfig();
}

interface WordSearchImagesEditorProps {
    onHome: () => void;
}

export const WordSearchImagesEditor: React.FC<WordSearchImagesEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<WordSearchImagesConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('wordSearchImages', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateWordSearch({
        ...config,
        words: config.items.map(item => item.word),
    }), [config]);

    const handleAddItem = () => {
        setConfig({
            ...config,
            items: [...config.items, { word: '', imageUrl: '' }],
        });
    };

    const handleRemoveItem = (index: number) => {
        setConfig({
            ...config,
            items: config.items.filter((_, i) => i !== index),
        });
    };

    const handleItemChange = (index: number, field: keyof WordSearchImageItem, value: string) => {
        const newItems = [...config.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setConfig({ ...config, items: newItems });
    };

    const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                handleItemChange(index, 'imageData', reader.result as string);
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
            <WordSearchImagesPlay
                title={config.title}
                result={result}
                items={config.items.filter(item => item.word)}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    return (
        <>
        <TemplateModal
            isOpen={templateModalOpen}
            mode={templateModalMode}
            currentType="wordSearchImages"
            currentConfig={config}
            onClose={() => setTemplateModalOpen(false)}
            onLoadTemplate={tpl => setConfig(tpl.config)}
        />
        <EditorLayout
            toolbar={
                <Toolbar
                    title={t('modules.wordSearchImages.name')}
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

                    <h3 className="mb-md" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        ⚙️ {t('editor.config')} (for print/export)
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <div className="form-group">
                        <label className="label">Words & Images</label>
                        {config.items.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '0.5em',
                                marginBottom: '0.5em',
                                alignItems: 'center',
                            }}>
                                <Input
                                    value={item.word}
                                    onChange={e => handleItemChange(i, 'word', e.target.value.toUpperCase())}
                                    placeholder="Word"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <label style={{
                                    padding: '0.5em',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    background: item.imageData ? '#e8f5e9' : 'transparent',
                                }}>
                                    📷
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleImageUpload(i, e)}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveItem(i)}
                                    style={{ padding: '0.25em 0.5em' }}
                                >
                                    ✕
                                </Button>
                            </div>
                        ))}
                        <Button variant="secondary" onClick={handleAddItem} className="w-full">
                            + Add Word
                        </Button>
                    </div>

                    <NumberInput
                        label={t('editor.gridSize')}
                        value={config.gridSize}
                        min={6}
                        max={15}
                        onChange={e => setConfig({ ...config, gridSize: parseInt(e.target.value) || 10 })}
                    />

                    <Checkbox
                        label={t('editor.allowDiagonal')}
                        checked={config.allowDiagonal}
                        onChange={e => setConfig({ ...config, allowDiagonal: e.target.checked })}
                    />

                    <Checkbox
                        label="Show images below grid"
                        checked={config.showImagesBelow}
                        onChange={e => setConfig({ ...config, showImagesBelow: e.target.checked })}
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

                            {/* Grid */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1em' }}>
                                <table style={{ borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {result.grid.map((row, i) => (
                                            <tr key={i}>
                                                {row.map((cell, j) => (
                                                    <td key={j} style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        textAlign: 'center',
                                                        border: '1px solid #ddd',
                                                        fontWeight: 500,
                                                    }}>
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Images and words */}
                            {config.showImagesBelow && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '1em',
                                    marginTop: '1em',
                                }}>
                                    {config.items.filter(item => item.word).map((item, i) => (
                                        <div key={i} style={{ textAlign: 'center' }}>
                                            {item.imageData ? (
                                                <img
                                                    src={item.imageData}
                                                    alt={item.word}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        marginBottom: '0.25em',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    background: '#f0f0f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    margin: '0 auto 0.25em',
                                                    fontSize: '24px',
                                                }}>
                                                    🖼️
                                                </div>
                                            )}
                                            <p style={{ fontSize: '0.8em', fontWeight: 500 }}>{item.word}</p>
                                        </div>
                                    ))}
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
