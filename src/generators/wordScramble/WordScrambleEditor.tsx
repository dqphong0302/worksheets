import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { parseWords, validateWords } from '../../utils/validation';
import { WordScrambleConfig, WordScrambleResult, ExportFormat } from '../../types';
import { WordScramblePlay } from './WordScramblePlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function shuffleWord(word: string): string {
    const letters = word.split('');
    if (letters.length <= 1 || new Set(letters).size <= 1) {
        return word;
    }
    let scrambled = word;
    let attempts = 0;
    while (scrambled === word && attempts < 25) {
        const arr = [...letters];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        scrambled = arr.join('');
        attempts++;
    }
    return scrambled;
}

function generateWordScramble(config: WordScrambleConfig): WordScrambleResult {
    return {
        items: config.words.map(word => {
            const scrambled = shuffleWord(word.toUpperCase());
            let hint: string | undefined;

            if (config.showHints) {
                switch (config.hintType) {
                    case 'firstLetter':
                        hint = `Starts with ${word[0].toUpperCase()}`;
                        break;
                    case 'length':
                        hint = `${word.length} letters`;
                        break;
                }
            }

            return { original: word, scrambled, hint };
        })
    };
}

function getDefaultWordScrambleConfig(): WordScrambleConfig {
    return {
        title: 'Word Scramble',
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
        words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'LEMON'],
        showHints: true,
        hintType: 'firstLetter',
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): WordScrambleConfig {
    const saved = getEditorState<WordScrambleConfig>('wordScramble');
    if (saved) {
        const { lastModified, ...config } = saved as WordScrambleConfig & { lastModified?: string };
        return { ...getDefaultWordScrambleConfig(), ...config };
    }
    return getDefaultWordScrambleConfig();
}

interface WordScrambleEditorProps {
    onHome: () => void;
}

export const WordScrambleEditor: React.FC<WordScrambleEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<WordScrambleConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('wordScramble', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateWordScramble(config), [config]);

    const validation = useMemo(() => {
        return validateWords(config.words, { minCount: 2 });
    }, [config.words]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const words = topic.words.map(w => w.word);
        setConfig({
            ...config,
            title: `${i18n.language === 'vi' ? 'Xáo Chữ' : 'Word Scramble'} - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
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
                subtitle: 'Unscramble the letters to find the hidden words.',
                sections: [
                    {
                        type: 'numberedList', content: result.items.map(item =>
                            `${item.scrambled}  →  ____________${item.hint ? ` (${item.hint})` : ''}`
                        )
                    },
                    ...(config.showAnswerKey ? [
                        { type: 'paragraph' as const, content: '—— Answer Key ——' },
                        { type: 'numberedList' as const, content: result.items.map(item => item.original) },
                    ] : []),
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="wordScramble"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.wordScramble.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultWordScrambleConfig())}
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

                        <Textarea
                            label={t('editor.words')}
                            value={config.words.join('\n')}
                            onChange={e => handleWordsChange(e.target.value)}
                            placeholder={t('editor.wordsPlaceholder')}
                            rows={8}
                            error={validation.errors[0]}
                        />

                        <Checkbox
                            label="Show Hints"
                            checked={config.showHints}
                            onChange={e => setConfig({ ...config, showHints: e.target.checked })}
                        />

                        {config.showHints && (
                            <Select
                                label="Hint Type"
                                value={config.hintType}
                                onChange={e => setConfig({ ...config, hintType: e.target.value as any })}
                                options={[
                                    { value: 'firstLetter', label: 'First Letter' },
                                    { value: 'length', label: 'Word Length' },
                                    { value: 'none', label: 'None' },
                                ]}
                            />
                        )}

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

                                <p style={{ marginBottom: '1.5em', textAlign: 'center' }}>
                                    Unscramble the letters to find the hidden words.
                                </p>

                                {/* Scrambled words */}
                                <div style={{ display: 'grid', gap: '1.5em' }}>
                                    {result.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                                            <span style={{ width: '30px', fontWeight: 600 }}>{i + 1}.</span>
                                            <span style={{
                                                fontSize: '1.2em',
                                                letterSpacing: '0.2em',
                                                fontWeight: 600,
                                                background: '#f0f0f0',
                                                padding: '0.25em 0.5em',
                                                borderRadius: '4px',
                                            }}>
                                                {item.scrambled}
                                            </span>
                                            <span style={{ flex: 1 }}>
                                                → ________________________
                                            </span>
                                            {item.hint && (
                                                <span style={{ fontSize: '0.8em', color: '#666' }}>
                                                    ({item.hint})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Answer key */}
                                {config.showAnswerKey && (
                                    <div style={{
                                        marginTop: '3em',
                                        padding: '1em',
                                        background: '#f5f5f5',
                                        borderRadius: '4px',
                                    }}>
                                        <h3 style={{ marginBottom: '0.5em' }}>Answer Key</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5em' }}>
                                            {result.items.map((item, i) => (
                                                <p key={i}>{i + 1}. {item.original}</p>
                                            ))}
                                        </div>
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
                    <WordScramblePlay
                        title={config.title}
                        words={result.items.map((item, idx) => ({
                            original: item.original,
                            scrambled: item.scrambled,
                            hint: item.hint,
                        }))}
                        onClose={() => setPlayMode(false)}
                    />
                )
            }
        </>
    );
};
