import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Button, Checkbox } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { FindIdenticalPlay } from './FindIdenticalPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { ExportFormat, PaperSize } from '../../types';
import { TemplateModal } from '../../components/template/TemplateModal';

export interface FindIdenticalItem {
    id: string;
    imageData?: string;
    imageUrl?: string;
    label?: string;
}

export interface FindIdenticalConfig {
    title: string;
    paperSize: PaperSize;
    showAnswerKey: boolean;
    fontSize: number;
    font: string;
    studentInfo: {
        showStudentInfo: boolean;
        showName: boolean;
        showClass: boolean;
        showDate: boolean;
        showScore: boolean;
    };
    borderStyle: 'none' | 'simple' | 'double' | 'dotted' | 'decorative' | 'elegant';
    zoom: number;
    items: FindIdenticalItem[];
    showLabels: boolean;
}

const DEFAULT_PRESETS: FindIdenticalItem[] = [
    { id: '1', label: '🐱 Con Mèo / Cat' },
    { id: '2', label: '🐶 Con Chó / Dog' },
    { id: '3', label: '🐰 Con Thỏ / Rabbit' },
    { id: '4', label: '🦊 Con Cáo / Fox' },
    { id: '5', label: '🐻 Con Gấu / Bear' },
    { id: '6', label: '🐼 Gấu Trúc / Panda' },
];

function getDefaultConfig(): FindIdenticalConfig {
    return {
        title: 'Trò Chơi Lật Thẻ Tìm Cặp Giống Nhau / Matching Pairs',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 14,
        font: 'Inter',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        items: DEFAULT_PRESETS,
        showLabels: true,
    };
}

function getInitialConfig(): FindIdenticalConfig {
    const saved = getEditorState<FindIdenticalConfig>('findIdentical');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultConfig(), ...config };
    }
    return getDefaultConfig();
}

interface FindIdenticalEditorProps {
    onHome: () => void;
}

export const FindIdenticalEditor: React.FC<FindIdenticalEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<FindIdenticalConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('findIdentical', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const handleAddItem = () => {
        const newId = (config.items.length + 1).toString();
        setConfig({
            ...config,
            items: [...config.items, { id: newId, label: `Item ${newId}` }],
        });
    };

    const handleRemoveItem = (id: string) => {
        setConfig({
            ...config,
            items: config.items.filter(item => item.id !== id),
        });
    };

    const handleUpdateItem = (id: string, updates: Partial<FindIdenticalItem>) => {
        setConfig({
            ...config,
            items: config.items.map(item => (item.id === id ? { ...item, ...updates } : item)),
        });
    };

    const handleImageUpload = (id: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdateItem(id, { imageData: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: 'Cut along the dotted lines to create matching flashcards for classroom games.',
                sections: [
                    {
                        type: 'paragraph',
                        content: `Total Pairs: ${config.items.length} (${config.items.length * 2} cards in total).`
                    },
                    {
                        type: 'numberedList',
                        content: config.items.map(it => it.label || `Card ${it.id}`)
                    }
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    // Prepare printable paired cards
    const pairedCards = useMemo(() => {
        const list: { id: string; itemId: string; label: string; imageData?: string }[] = [];
        config.items.forEach(item => {
            list.push({ id: `${item.id}-1`, itemId: item.id, label: item.label || '', imageData: item.imageData });
            list.push({ id: `${item.id}-2`, itemId: item.id, label: item.label || '', imageData: item.imageData });
        });
        return list;
    }, [config.items]);

    if (playMode) {
        return (
            <FindIdenticalPlay
                title={config.title}
                items={config.items}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    return (
        <>
        <TemplateModal
            isOpen={templateModalOpen}
            mode={templateModalMode}
            currentType="findIdentical"
            currentConfig={config}
            onClose={() => setTemplateModalOpen(false)}
            onLoadTemplate={tpl => setConfig(tpl.config)}
        />
        <EditorLayout
            toolbar={
                <Toolbar
                    title={t('modules.findIdentical.name')}
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
                        disabled={config.items.length < 2}
                    >
                        🎮 {i18n.language === 'vi' ? 'Chơi Tương Tác / Play Now' : 'Play Now'}
                    </Button>

                    <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">
                        ⚙️ {t('editor.config')}
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <Checkbox
                        label={i18n.language === 'vi' ? 'Hiện tên/nhãn dưới thẻ' : 'Show card labels'}
                        checked={config.showLabels}
                        onChange={e => setConfig({ ...config, showLabels: e.target.checked })}
                    />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-ink">
                                {i18n.language === 'vi' ? `Danh sách thẻ (${config.items.length} cặp)` : `Card items (${config.items.length} pairs)`}
                            </label>
                            <Button variant="secondary" onClick={handleAddItem} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>
                                + {i18n.language === 'vi' ? 'Thêm' : 'Add'}
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {config.items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="p-3 rounded-xl border"
                                    style={{
                                        background: 'var(--bg-primary)',
                                        borderColor: 'var(--border-color)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-ink-muted">#{index + 1}</span>
                                        <input
                                            type="text"
                                            value={item.label || ''}
                                            onChange={e => handleUpdateItem(item.id, { label: e.target.value })}
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                                            placeholder={i18n.language === 'vi' ? 'Tên thẻ / Emoji (VD: 🐱 Mèo)' : 'Card label / Emoji'}
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-ink)',
                                            }}
                                        />
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 px-1 text-lg font-bold"
                                            title="Delete"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {item.imageData ? (
                                        <div className="relative rounded-lg overflow-hidden border">
                                            <img
                                                src={item.imageData}
                                                alt={item.label}
                                                className="w-full h-16 object-cover"
                                            />
                                            <button
                                                onClick={() => handleUpdateItem(item.id, { imageData: undefined })}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="block w-full py-1.5 text-center border border-dashed rounded-lg cursor-pointer text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-ink-muted)' }}
                                        >
                                            📷 {i18n.language === 'vi' ? 'Tải ảnh lên (tùy chọn)' : 'Upload image (optional)'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(item.id, file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
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
                            <div className="text-center mb-6">
                                <h1 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '0.25em' }}>
                                    {config.title}
                                </h1>
                                <p style={{ fontSize: '0.85em', color: '#64748b' }}>
                                    ✂️ {i18n.language === 'vi'
                                        ? 'Cắt theo đường nét đứt để tạo bộ thẻ bài lật tìm cặp giống nhau'
                                        : 'Cut along the dotted lines to create memory flashcards'}
                                </p>
                            </div>

                            {/* Printable Flashcards Grid */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '12px',
                                    margin: '0 auto',
                                }}
                            >
                                {pairedCards.map(card => (
                                    <div
                                        key={card.id}
                                        style={{
                                            border: '2px dashed #94a3b8',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            minHeight: '110px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#ffffff',
                                        }}
                                    >
                                        {card.imageData ? (
                                            <img
                                                src={card.imageData}
                                                alt={card.label}
                                                style={{
                                                    maxWidth: '80px',
                                                    maxHeight: '60px',
                                                    objectFit: 'contain',
                                                    marginBottom: '4px',
                                                }}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                                                {card.label.split(' ')[0] || '🃏'}
                                            </div>
                                        )}
                                        {config.showLabels && (
                                            <span style={{ fontSize: '0.8em', fontWeight: 600, color: '#1e293b' }}>
                                                {card.label}
                                            </span>
                                        )}
                                    </div>
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
