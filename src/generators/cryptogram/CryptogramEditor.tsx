import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Textarea, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { CryptogramConfig, CipherType, ExportFormat } from '../../types';
import { generateCryptogram, getDefaultCryptogramConfig } from './cryptogramGenerator';
import { CryptogramPlay } from './CryptogramPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getInitialConfig(): CryptogramConfig {
    const saved = getEditorState<CryptogramConfig>('cryptogram');
    if (saved) {
        const { lastModified, ...config } = saved as CryptogramConfig & { lastModified?: string };
        return { ...getDefaultCryptogramConfig(), ...config };
    }
    return getDefaultCryptogramConfig();
}

interface CryptogramEditorProps {
    onHome: () => void;
}

export const CryptogramEditor: React.FC<CryptogramEditorProps> = ({ onHome }) => {
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
    } = useUndoRedo<CryptogramConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('cryptogram', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateCryptogram(config), [config]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const firstTwo = topic.words.slice(0, 3).map(w => w.word).join(' ');
        setConfig({
            ...config,
            title: `Mật Thư - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            secretMessage: firstTwo,
        });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: 'Crack the cipher code to reveal the hidden secret message.',
                sections: [
                    {
                        type: 'paragraph',
                        content: `Cipher Code:\n${result.encodedMessage.join(' ')}`
                    },
                    ...(config.showAnswerKey ? [
                        { type: 'paragraph' as const, content: '—— Answer Key ——' },
                        { type: 'paragraph' as const, content: config.secretMessage.toUpperCase() }
                    ] : [])
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    if (playMode) {
        return (
            <CryptogramPlay
                title={config.title}
                secretMessage={config.secretMessage}
                keyMap={result.keyMap}
                revealedHints={result.revealedHints}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    const words = config.secretMessage.toUpperCase().split(' ');

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="cryptogram"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.cryptogram.name', 'Mật Mã Mật Thư')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultCryptogramConfig())}
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
                        >
                            🎮 {i18n.language === 'vi' ? 'Giải Mã Tương Tác / Play Decoder' : 'Solve Cryptogram'}
                        </Button>

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

                    <h3 className="text-xs uppercase font-bold tracking-wider text-muted">
                        ⚙️ {t('editor.config')}
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <Textarea
                        label={i18n.language === 'vi' ? 'Thông điệp bí mật cần mã hóa' : 'Secret message to encode'}
                        value={config.secretMessage}
                        onChange={e => setConfig({ ...config, secretMessage: e.target.value })}
                        placeholder="Nhập câu danh ngôn, thành ngữ hoặc bài học..."
                        rows={3}
                    />

                    <Select
                        label={i18n.language === 'vi' ? 'Kiểu ký hiệu mã hóa' : 'Cipher type'}
                        value={config.cipherType}
                        options={[
                            { value: 'numbers', label: 'Con số (1, 2, 3... - Dễ)' },
                            { value: 'emojis', label: 'Biểu tượng Emojis (🍎, 🍌, 🥕...)' },
                            { value: 'shapes', label: 'Hình học & Ký hiệu (▲, ●, ★...)' },
                            { value: 'caesar', label: 'Mật mã dịch chuyển Caesar (+3)' },
                        ]}
                        onChange={e => setConfig({ ...config, cipherType: e.target.value as CipherType })}
                    />

                    <NumberInput
                        label={i18n.language === 'vi' ? 'Số chữ cái gợi ý sẵn' : 'Hint letters count'}
                        value={config.hintLettersCount}
                        min={0}
                        max={10}
                        onChange={e => setConfig({ ...config, hintLettersCount: parseInt(e.target.value) || 0 })}
                    />

                    <Checkbox
                        label={i18n.language === 'vi' ? 'Hiện bảng tra cứu ký hiệu ở đầu trang' : 'Show decoder key table'}
                        checked={config.showDecoderKeyTable}
                        onChange={e => setConfig({ ...config, showDecoderKeyTable: e.target.checked })}
                    />

                    <Checkbox
                        label={t('editor.showAnswerKey')}
                        checked={config.showAnswerKey}
                        onChange={e => setConfig({ ...config, showAnswerKey: e.target.checked })}
                    />
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
                            {config.studentInfo.showStudentInfo && (
                                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-300 text-xs">
                                    <span>Họ và tên / Name: _______________________</span>
                                    <span>Lớp / Class: ________</span>
                                    <span>Ngày / Date: ________</span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h1 style={{ fontSize: '1.6em', fontWeight: 800, color: '#0f172a', marginBottom: '0.2em' }}>
                                    {config.title}
                                </h1>
                                <p style={{ fontSize: '0.85em', color: '#64748b' }}>
                                    🔍 {i18n.language === 'vi'
                                        ? 'Sử dụng bảng giải mã bên dưới để tìm ra thông điệp bí mật ẩn giấu'
                                        : 'Use the decoder key table to crack the secret code'}
                                </p>
                            </div>

                            {/* Decoder Key Table */}
                            {config.showDecoderKeyTable && (
                                <div className="mb-8 p-3 rounded-xl border border-slate-300 bg-slate-50">
                                    <div className="text-xs font-bold text-center text-slate-600 mb-2 uppercase tracking-wider">
                                        📋 Bảng Tra Cứu Giải Mã (Decoder Key Table)
                                    </div>
                                    <table className="w-full text-center border-collapse text-xs">
                                        <tbody>
                                            <tr className="bg-sky-100/60 font-bold border-b border-slate-300">
                                                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                                                    <td key={l} className="p-1 border-r border-slate-300 last:border-r-0">
                                                        {l}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="font-mono text-[11px] text-slate-700">
                                                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                                                    <td key={l} className="p-1 border-r border-slate-300 last:border-r-0">
                                                        {result.keyMap[l] || ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Cryptogram Puzzle Work Area */}
                            <div className="flex flex-wrap gap-x-8 gap-y-6 justify-center my-8">
                                {words.map((word, wordIdx) => (
                                    <div key={wordIdx} className="flex gap-2 items-end">
                                        {word.split('').map((char, charIdx) => {
                                            const isLetter = /[A-Z]/.test(char);
                                            if (!isLetter) {
                                                return (
                                                    <span key={charIdx} className="text-xl font-bold pb-2">
                                                        {char}
                                                    </span>
                                                );
                                            }

                                            const symbol = result.keyMap[char] || char;
                                            const isHint = result.revealedHints[char];

                                            return (
                                                <div key={charIdx} className="flex flex-col items-center">
                                                    {/* Blank Line for student to write */}
                                                    <div
                                                        style={{
                                                            width: '26px',
                                                            height: '32px',
                                                            borderBottom: '2px solid #0f172a',
                                                            textAlign: 'center',
                                                            fontWeight: 700,
                                                            fontSize: '1.2em',
                                                            color: isHint ? '#0284c7' : '#0f172a',
                                                        }}
                                                    >
                                                        {isHint ? char : ''}
                                                    </div>
                                                    {/* Symbol Below */}
                                                    <div style={{ fontSize: '0.85em', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                                                        {symbol}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Answer Key */}
                            {config.showAnswerKey && (
                                <div className="mt-12 pt-4 border-t border-dashed border-slate-300">
                                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                                        Đáp án (Answer Key):
                                    </div>
                                    <div className="text-sm font-semibold text-emerald-700">
                                        {config.secretMessage.toUpperCase()}
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
