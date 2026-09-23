import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Select, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { FlashcardsConfig, FlashcardItem, FlashcardAIStyle, ExportFormat } from '../../types';
import { getDefaultFlashcardsConfig } from './flashcardsGenerator';
import { FlashcardsPlay } from './FlashcardsPlay';
import { DictionaryAIPanel } from './DictionaryAIPanel';
import { generateAIImageUrl } from '../../services/aiImageService';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getInitialConfig(): FlashcardsConfig {
    const saved = getEditorState<FlashcardsConfig>('flashcards');
    if (saved) {
        const { lastModified, ...config } = saved as FlashcardsConfig & { lastModified?: string };
        return { ...getDefaultFlashcardsConfig(), ...config };
    }
    return getDefaultFlashcardsConfig();
}

interface FlashcardsEditorProps {
    onHome: () => void;
}

export const FlashcardsEditor: React.FC<FlashcardsEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<FlashcardsConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('flashcards', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const items: FlashcardItem[] = topic.words.map((w, idx) => ({
            id: (idx + 1).toString(),
            frontText: w.word,
            frontSub: w.pairRightEn || '',
            iconOrEmoji: w.emoji || '✨',
            imageUrl: generateAIImageUrl(w.word, config.aiStyle || '3d_pixar'),
            backText: w.pairRightVi || w.clueVi,
            backSub: w.clueVi,
            ipa: `/${w.word.toLowerCase()}/`,
            exampleEn: `Example with ${w.word}`,
        }));
        setConfig({
            ...config,
            title: `Flashcards - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            items,
        });
    };

    const handleAddItem = () => {
        const newId = (config.items.length + 1).toString();
        const newWord = `Word ${newId}`;
        setConfig({
            ...config,
            items: [
                ...config.items,
                {
                    id: newId,
                    frontText: newWord,
                    backText: `Nghĩa ${newId}`,
                    iconOrEmoji: '✨',
                    imageUrl: generateAIImageUrl(newWord, config.aiStyle || '3d_pixar'),
                }
            ],
        });
    };

    const handleAddSingleCard = (item: FlashcardItem) => {
        setConfig({
            ...config,
            items: [...config.items, item],
        });
    };

    const handleBatchAddCards = (newItems: FlashcardItem[]) => {
        setConfig({
            ...config,
            items: newItems,
        });
    };

    const handleRemoveItem = (id: string) => {
        setConfig({
            ...config,
            items: config.items.filter(item => item.id !== id),
        });
    };

    const handleUpdateItem = (id: string, updates: Partial<FlashcardItem>) => {
        setConfig({
            ...config,
            items: config.items.map(item => (item.id === id ? { ...item, ...updates } : item)),
        });
    };

    const handleRegenerateItemImage = (id: string, word: string) => {
        const newUrl = generateAIImageUrl(word, config.aiStyle || '3d_pixar', `seed-${Date.now()}`);
        handleUpdateItem(id, { imageUrl: newUrl });
    };

    const handleStyleChange = (style: FlashcardAIStyle) => {
        // Update all existing items with the new AI style
        const updatedItems = config.items.map(it => ({
            ...it,
            imageUrl: generateAIImageUrl(it.frontText, style),
        }));
        setConfig({
            ...config,
            aiStyle: style,
            items: updatedItems,
        });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: 'Printable Classroom Flashcards Table',
                sections: [
                    {
                        type: 'paragraph',
                        content: `Total Cards: ${config.items.length}`
                    },
                    {
                        type: 'grid',
                        content: [
                            ['Front (Term / Word)', 'IPA / Details', 'Back (Meaning / Definition)', 'Example'],
                            ...config.items.map(it => [
                                `${it.iconOrEmoji ? it.iconOrEmoji + ' ' : ''}${it.frontText}`,
                                it.ipa || it.frontSub || '',
                                it.backText,
                                it.exampleEn || it.backSub || '',
                            ])
                        ]
                    }
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    if (playMode) {
        return (
            <FlashcardsPlay
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
                currentType="flashcards"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.flashcards.name', 'Thẻ Học Flashcards')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultFlashcardsConfig())}
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
                        {/* Play Mini-Games Button */}
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setPlayMode(true)}
                            style={{
                                background: '#2f7a4f',
                                fontSize: '1.1rem',
                                padding: '0.85rem',
                                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                            }}
                        >
                            {i18n.language === 'vi' ? 'Chơi 4 Mini-Games Tương Tác' : 'Play 4 Flashcard Mini-Games'}
                        </Button>

                        {/* AI Dictionary & Image Generation Suite */}
                        <DictionaryAIPanel
                            currentStyle={config.aiStyle || '3d_pixar'}
                            onStyleChange={handleStyleChange}
                            onAddFlashcard={handleAddSingleCard}
                            onBatchAddFlashcards={handleBatchAddCards}
                        />

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

                        <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">
                            {t('editor.config')}
                        </h3>

                        <Input
                            label={t('editor.title')}
                            value={config.title}
                            onChange={e => setConfig({ ...config, title: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label={i18n.language === 'vi' ? 'Kiểu in thẻ' : 'Layout style'}
                                value={config.cardLayout}
                                options={[
                                    { value: 'fold', label: 'Gập đôi (2 mặt gập)' },
                                    { value: 'grid', label: 'Lưới cắt rời từng thẻ' },
                                ]}
                                onChange={e => setConfig({ ...config, cardLayout: e.target.value as 'fold' | 'grid' })}
                            />

                            <Select
                                label={i18n.language === 'vi' ? 'Số thẻ/trang' : 'Cards/page'}
                                value={config.cardsPerPage.toString()}
                                options={[
                                    { value: '4', label: '4 thẻ lớn' },
                                    { value: '6', label: '6 thẻ vừa' },
                                    { value: '8', label: '8 thẻ nhỏ' },
                                ]}
                                onChange={e => setConfig({ ...config, cardsPerPage: parseInt(e.target.value) as 4 | 6 | 8 })}
                            />
                        </div>

                        {/* Visual Display Toggles */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Checkbox
                                label={i18n.language === 'vi' ? 'Hiện ảnh AI (Images)' : 'Show AI Images'}
                                checked={config.showImages ?? true}
                                onChange={e => setConfig({ ...config, showImages: e.target.checked })}
                            />
                            <Checkbox
                                label={i18n.language === 'vi' ? 'Hiện phiên âm (IPA)' : 'Show IPA'}
                                checked={config.showIpa ?? true}
                                onChange={e => setConfig({ ...config, showIpa: e.target.checked })}
                            />
                            <Checkbox
                                label={i18n.language === 'vi' ? 'Hiện câu ví dụ' : 'Show Examples'}
                                checked={config.showExamples ?? true}
                                onChange={e => setConfig({ ...config, showExamples: e.target.checked })}
                            />
                            <Checkbox
                                label={i18n.language === 'vi' ? 'Đường viền cắt kéo' : 'Show Cut lines'}
                                checked={config.showCutLines}
                                onChange={e => setConfig({ ...config, showCutLines: e.target.checked })}
                            />
                        </div>

                        {/* Card List Items Editor */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-ink">
                                    {i18n.language === 'vi' ? `Danh sách thẻ (${config.items.length})` : `Flashcard Items (${config.items.length})`}
                                </label>
                                <Button variant="secondary" onClick={handleAddItem} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>
                                    + {i18n.language === 'vi' ? 'Thêm thẻ' : 'Add Card'}
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {config.items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-2xl border space-y-2"
                                        style={{
                                            background: 'var(--bg-primary)',
                                            borderColor: 'var(--border-color)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-ink-muted">#{idx + 1}</span>

                                            {/* AI Image Thumbnail & Regenerate Button */}
                                            {item.imageUrl ? (
                                                <div className="relative group/img shrink-0">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.frontText}
                                                        className="w-10 h-10 object-cover rounded-lg border border-line shadow-sm"
                                                    />
                                                    <button
                                                        onClick={() => handleRegenerateItemImage(item.id, item.frontText)}
                                                        className="absolute inset-0 bg-black/60 rounded-lg text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-xs transition-opacity"
                                                        title="Sinh lại ảnh AI khác"
                                                    ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></button>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={item.iconOrEmoji || ''}
                                                    onChange={e => handleUpdateItem(item.id, { iconOrEmoji: e.target.value })}
                                                    placeholder="Emoji"
                                                    className="w-10 px-1 py-1 rounded-lg border text-sm text-center"
                                                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-ink)' }}
                                                />
                                            )}

                                            <input
                                                type="text"
                                                value={item.frontText}
                                                onChange={e => handleUpdateItem(item.id, { frontText: e.target.value })}
                                                placeholder="Từ vựng tiếng Anh"
                                                className="flex-1 px-2.5 py-1 rounded-lg border text-sm font-bold"
                                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-ink)' }}
                                            />
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-red-500 hover:text-red-700 px-1 text-base font-bold"
                                                title="Delete"
                                            ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={item.ipa || item.frontSub || ''}
                                                onChange={e => handleUpdateItem(item.id, { ipa: e.target.value, frontSub: e.target.value })}
                                                placeholder="Phiên âm IPA (VD: /ˈæpl/)"
                                                className="px-2 py-1 rounded border text-xs font-mono"
                                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-ink)' }}
                                            />
                                            <input
                                                type="text"
                                                value={item.backText}
                                                onChange={e => handleUpdateItem(item.id, { backText: e.target.value })}
                                                placeholder="Nghĩa tiếng Việt"
                                                className="px-2 py-1 rounded border text-xs font-semibold"
                                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-ink)' }}
                                            />
                                        </div>
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
                                    <h1 style={{ fontSize: '1.5em', fontWeight: 800, color: '#1c1917', marginBottom: '0.2em' }}>
                                        {config.title}
                                    </h1>
                                    <p style={{ fontSize: '0.85em', color: '#6b625a' }}>
                                        {config.cardLayout === 'fold'
                                            ? 'Cắt theo viền ngoài, sau đó gấp đôi theo đường nét đứt giữa để thành thẻ 2 mặt'
                                            : 'Cắt rời từng thẻ dọc theo các đường viền nét đứt'}
                                    </p>
                                </div>

                                {/* Printable Cards Grid */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: config.cardLayout === 'fold' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                        gap: '14px',
                                    }}
                                >
                                    {config.items.map((card) => (
                                        <div
                                            key={card.id}
                                            style={{
                                                border: config.showCutLines ? '1.5px dashed #9a9086' : '1px solid #e8e2da',
                                                borderRadius: '14px',
                                                padding: '10px',
                                                backgroundColor: '#ffffff',
                                                position: 'relative',
                                                minHeight: config.showImages ? '160px' : '120px',
                                                display: 'flex',
                                                flexDirection: config.cardLayout === 'fold' ? 'row' : 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '8px',
                                            }}
                                        >
                                            {config.cardLayout === 'fold' ? (
                                                <>
                                                    {/* Left Half: Front (Word + Image + IPA) */}
                                                    <div style={{ flex: 1, textAlign: 'center', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        {config.showImages && card.imageUrl ? (
                                                            <img
                                                                src={card.imageUrl}
                                                                alt={card.frontText}
                                                                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', marginBottom: '4px' }}
                                                            />
                                                        ) : card.iconOrEmoji ? (
                                                            <div style={{ fontSize: '28px', marginBottom: '2px' }}>{card.iconOrEmoji}</div>
                                                        ) : null}

                                                        <div style={{ fontWeight: 800, fontSize: '1.1em', color: '#0284c7' }}>{card.frontText}</div>
                                                        {config.showIpa && card.ipa && (
                                                            <div style={{ fontSize: '0.72em', color: '#6b625a', fontFamily: 'monospace' }}>{card.ipa}</div>
                                                        )}
                                                    </div>

                                                    {/* Folding Line */}
                                                    <div style={{ width: '1px', height: '85%', borderRight: '1.5px dotted #d9cfc3', margin: '0 4px' }} />

                                                    {/* Right Half: Back (Meaning + Example) */}
                                                    <div style={{ flex: 1, textAlign: 'center', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '1.05em', color: '#1c1917' }}>{card.backText}</div>
                                                        {config.showExamples && card.exampleEn && (
                                                            <div style={{ fontSize: '0.7em', color: '#6b625a', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.3' }}>
                                                                "{card.exampleEn}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                /* Grid Individual Card */
                                                <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    {config.showImages && card.imageUrl ? (
                                                        <img
                                                            src={card.imageUrl}
                                                            alt={card.frontText}
                                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', marginBottom: '6px' }}
                                                        />
                                                    ) : card.iconOrEmoji ? (
                                                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>{card.iconOrEmoji}</div>
                                                    ) : null}

                                                    <div style={{ fontWeight: 800, fontSize: '1.15em', color: '#0284c7' }}>{card.frontText}</div>
                                                    {config.showIpa && card.ipa && (
                                                        <div style={{ fontSize: '0.75em', color: '#6b625a', fontFamily: 'monospace' }}>{card.ipa}</div>
                                                    )}
                                                    <div style={{ fontWeight: 700, fontSize: '0.95em', color: '#1c1917', marginTop: '4px' }}>{card.backText}</div>
                                                    {config.showExamples && card.exampleEn && (
                                                        <div style={{ fontSize: '0.7em', color: '#6b625a', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.2' }}>
                                                                "{card.exampleEn}"
                                                        </div>
                                                    )}
                                                </div>
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
