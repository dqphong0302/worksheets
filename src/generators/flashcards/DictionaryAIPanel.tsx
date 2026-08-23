import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashcardItem, FlashcardAIStyle } from '../../types';
import { AI_STYLE_PRESETS, generateAIImageUrl } from '../../services/aiImageService';
import { enrichVocabularyWord, batchGenerateAIFlashcards } from '../../services/dictionaryService';
import { Button, Input, Select } from '../../components/common';
import { soundFx } from '../../utils/sound';

interface DictionaryAIPanelProps {
    currentStyle: FlashcardAIStyle;
    onStyleChange: (style: FlashcardAIStyle) => void;
    onAddFlashcard: (item: FlashcardItem) => void;
    onBatchAddFlashcards: (items: FlashcardItem[]) => void;
}

const POPULAR_THEMES = [
    { label: '🪐 Khám phá Vũ trụ & Thiên văn (Space)', words: 'sun, moon, star, rocket, astronaut, planet, galaxy, telescope' },
    { label: '🌊 Đại dương & Sinh vật biển (Ocean Life)', words: 'dolphin, whale, shark, octopus, turtle, coral, jellyfish, crab' },
    { label: '🦁 Động vật hoang dã (Wild Animals)', words: 'lion, tiger, elephant, giraffe, monkey, zebra, bear, panda' },
    { label: '🍎 Trái cây nhiệt đới (Tropical Fruits)', words: 'apple, banana, orange, strawberry, watermelon, mango, pineapple, grape' },
    { label: '💼 Nghề nghiệp tương lai (Dream Jobs)', words: 'doctor, teacher, pilot, artist, chef, firefighter, scientist, engineer' },
    { label: '🌈 Cảm xúc & Tính cách (Emotions)', words: 'happy, sad, excited, brave, calm, creative, friendly, curious' },
];

export const DictionaryAIPanel: React.FC<DictionaryAIPanelProps> = ({
    currentStyle,
    onStyleChange,
    onAddFlashcard,
    onBatchAddFlashcards,
}) => {
    const { t, i18n } = useTranslation();
    const [mode, setMode] = useState<'single' | 'batch'>('single');

    // Single word state
    const [searchWord, setSearchWord] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [previewItem, setPreviewItem] = useState<FlashcardItem | null>(null);

    // Batch state
    const [batchText, setBatchText] = useState('');
    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);

    const handleSearchSingle = async () => {
        if (!searchWord.trim()) return;
        soundFx.playClick();
        setIsSearching(true);

        try {
            const data = await enrichVocabularyWord(searchWord, currentStyle);
            setPreviewItem({
                id: Date.now().toString(),
                frontText: data.word,
                frontSub: `${data.partOfSpeech} • ${data.ipa}`,
                backText: data.meaningVi,
                backSub: data.exampleEn,
                iconOrEmoji: data.emoji,
                imageUrl: data.imageUrl,
                partOfSpeech: data.partOfSpeech,
                ipa: data.ipa,
                exampleEn: data.exampleEn,
                exampleVi: data.exampleVi,
            });
            soundFx.playCorrect();
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddSingleToDeck = () => {
        if (!previewItem) return;
        soundFx.playClick();
        onAddFlashcard(previewItem);
        setPreviewItem(null);
        setSearchWord('');
    };

    const handleBatchGenerate = async (customWords?: string) => {
        const textToUse = customWords || batchText;
        const words = textToUse
            .split(/[,\n]/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        if (words.length === 0) return;

        soundFx.playClick();
        setIsGeneratingBatch(true);
        setBatchProgress(10);

        try {
            const items = await batchGenerateAIFlashcards(words, currentStyle);
            setBatchProgress(100);
            soundFx.playVictory();
            onBatchAddFlashcards(items);
            setBatchText('');
        } catch (e) {
            console.error('Batch generate error:', e);
        } finally {
            setIsGeneratingBatch(false);
            setBatchProgress(0);
        }
    };

    const styleOptions = Object.entries(AI_STYLE_PRESETS).map(([key, val]) => ({
        value: key,
        label: `${val.icon} ${i18n.language === 'vi' ? val.labelVi : val.labelEn}`,
    }));

    return (
        <div className="card p-5 mb-6 border-2 border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 shadow-md rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                            {i18n.language === 'vi' ? 'AI Visual Flashcards & Từ Điển Thông Minh' : 'Smart Dictionary & AI Visual Flashcards'}
                        </h4>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {i18n.language === 'vi' ? 'Tự động tra nghĩa, phiên âm IPA & tạo hình ảnh AI' : 'Auto IPA, Vietnamese Meaning & AI Illustrations'}
                        </span>
                    </div>
                </div>

                {/* Mode toggle */}
                <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                    <button
                        onClick={() => setMode('single')}
                        className={`px-3 py-1 rounded-lg transition-all ${mode === 'single' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        {i18n.language === 'vi' ? 'Tra 1 từ' : 'Single Word'}
                    </button>
                    <button
                        onClick={() => setMode('batch')}
                        className={`px-3 py-1 rounded-lg transition-all ${mode === 'batch' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        {i18n.language === 'vi' ? 'Tạo theo chủ đề' : 'Batch AI Deck'}
                    </button>
                </div>
            </div>

            {/* Style Selector */}
            <div className="mb-4">
                <Select
                    label={i18n.language === 'vi' ? '🎨 Phong cách nghệ thuật AI (Art Style)' : '🎨 AI Visual Art Style'}
                    value={currentStyle}
                    options={styleOptions}
                    onChange={e => onStyleChange(e.target.value as FlashcardAIStyle)}
                />
            </div>

            {/* Mode 1: Single Word Lookup */}
            {mode === 'single' ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchWord}
                            onChange={e => setSearchWord(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearchSingle()}
                            placeholder={i18n.language === 'vi' ? 'Nhập từ tiếng Anh (VD: astronaut, butterfly...)' : 'Type English word (e.g. astronaut, galaxy...)'}
                            className="input flex-1 py-2 text-sm"
                        />
                        <Button
                            variant="primary"
                            onClick={handleSearchSingle}
                            disabled={isSearching || !searchWord.trim()}
                            className="!px-4 !py-2 shrink-0"
                        >
                            {isSearching ? '⏳ Tra cứu...' : '✨ Tra từ'}
                        </Button>
                    </div>

                    {/* Preview card result */}
                    {previewItem && (
                        <div className="mt-3 p-4 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-col sm:flex-row items-center gap-4 animate-scaleIn">
                            {previewItem.imageUrl && (
                                <img
                                    src={previewItem.imageUrl}
                                    alt={previewItem.frontText}
                                    className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                                />
                            )}
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{previewItem.frontText}</span>
                                    <span className="badge badge-primary">{previewItem.partOfSpeech}</span>
                                    <span className="text-xs text-slate-500 font-mono">{previewItem.ipa}</span>
                                </div>
                                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {previewItem.backText}
                                </div>
                                {previewItem.exampleEn && (
                                    <div className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                                        "{previewItem.exampleEn}"
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleAddSingleToDeck}
                                className="!py-2 !px-4 shrink-0 w-full sm:w-auto"
                            >
                                ➕ {i18n.language === 'vi' ? 'Thêm thẻ này' : 'Add to Deck'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                /* Mode 2: Batch AI Deck Generator */
                <div className="space-y-4">
                    {/* Topic presets */}
                    <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wider">
                            🌟 {i18n.language === 'vi' ? 'Hoặc chọn nhanh chủ đề gợi ý sẵn:' : 'Or pick ready-made topics:'}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {POPULAR_THEMES.map((theme, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setBatchText(theme.words);
                                        handleBatchGenerate(theme.words);
                                    }}
                                    disabled={isGeneratingBatch}
                                    className="text-left text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-all font-medium flex items-center justify-between group"
                                >
                                    <span className="line-clamp-1">{theme.label}</span>
                                    <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">⚡</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom word list input */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                            📝 {i18n.language === 'vi' ? 'Nhập danh sách từ tiếng Anh (cách nhau bằng dấu phẩy):' : 'Enter word list (comma separated):'}
                        </label>
                        <textarea
                            value={batchText}
                            onChange={e => setBatchText(e.target.value)}
                            placeholder="apple, banana, elephant, rocket, telescope, galaxy..."
                            rows={3}
                            className="textarea text-xs w-full mb-2"
                        />
                        <Button
                            variant="primary"
                            onClick={() => handleBatchGenerate()}
                            disabled={isGeneratingBatch || !batchText.trim()}
                            className="w-full !py-2.5"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            }}
                        >
                            {isGeneratingBatch
                                ? `✨ AI đang tra từ & tạo ảnh... (${batchProgress}%)`
                                : `🚀 ${i18n.language === 'vi' ? 'Tạo toàn bộ bộ thẻ bằng AI' : 'Generate Full AI Flashcards Deck'}`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
