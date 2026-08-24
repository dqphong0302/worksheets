import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WORKSHEET_PRESETS, PresetTopic } from '../../presets/worksheetPresets';
import { soundFx } from '../../utils/sound';

interface PresetPickerProps {
    onSelectTopic: (topic: PresetTopic) => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({ onSelectTopic }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative mb-3">
            <button
                type="button"
                onClick={() => {
                    soundFx.playClick();
                    setIsOpen(!isOpen);
                }}
                className="w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all"
                style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                    color: 'var(--text-ink)',
                }}
            >
                <span className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span>{i18n.language === 'vi' ? 'Nạp chủ đề mẫu có sẵn' : 'Load from Presets'}</span>
                </span>
                <span className="text-sky-500 font-bold">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div
                    className="mt-1.5 p-2 rounded-2xl border shadow-xl z-30 max-h-64 overflow-y-auto space-y-1"
                    style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div className="text-[11px] font-bold px-2 py-1 text-slate-400 uppercase tracking-wider">
                        {i18n.language === 'vi' ? 'Chọn 1 chủ đề để nạp nhanh' : 'Select a topic preset'}
                    </div>

                    {WORKSHEET_PRESETS.map(topic => (
                        <button
                            key={topic.id}
                            type="button"
                            onClick={() => {
                                soundFx.playClick();
                                onSelectTopic(topic);
                                setIsOpen(false);
                            }}
                            className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all hover:bg-sky-50 dark:hover:bg-slate-800"
                            style={{ color: 'var(--text-ink)' }}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base">{topic.icon}</span>
                                <span>{i18n.language === 'vi' ? topic.nameVi : topic.nameEn}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {topic.words.length} từ
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
