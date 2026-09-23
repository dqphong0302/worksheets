import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WorksheetTemplate, GeneratorType } from '../../types';
import { getAllTemplates, saveTemplate, deleteTemplate, exportTemplatesAsJSON, importTemplatesFromJSON } from '../../services/storageService';
import { soundFx } from '../../utils/sound';

interface TemplateModalProps {
    isOpen: boolean;
    mode: 'save' | 'load';
    currentType: GeneratorType;
    currentConfig?: any;
    onClose: () => void;
    onLoadTemplate: (template: WorksheetTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
    isOpen,
    mode: initialMode,
    currentType,
    currentConfig,
    onClose,
    onLoadTemplate,
}) => {
    const { t, i18n } = useTranslation();
    const [mode, setMode] = useState<'save' | 'load'>(initialMode);
    const [templateName, setTemplateName] = useState(currentConfig?.title || 'Mẫu bài tập của tôi');
    const [templates, setTemplates] = useState<WorksheetTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        try {
            const all = await getAllTemplates();
            setTemplates(all);
        } catch (e) {
            console.error('Failed to load templates', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            loadAll();
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!templateName.trim() || !currentConfig) return;
        soundFx.playClick();
        const newTemplate: WorksheetTemplate = {
            id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: templateName.trim(),
            type: currentType,
            config: currentConfig,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await saveTemplate(newTemplate);
        soundFx.playCorrect();
        await loadAll();
        setMode('load');
    };

    const handleDelete = async (id: string) => {
        soundFx.playClick();
        await deleteTemplate(id);
        await loadAll();
    };

    const handleExportJSON = () => {
        soundFx.playClick();
        const json = exportTemplatesAsJSON(templates);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `worksheet_templates_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        soundFx.playClick();
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const content = evt.target?.result as string;
            const imported = importTemplatesFromJSON(content);
            for (const tpl of imported) {
                if (tpl.id && tpl.type && tpl.config) {
                    await saveTemplate(tpl);
                }
            }
            soundFx.playCorrect();
            await loadAll();
        };
        reader.readAsText(file);
    };

    const filteredTemplates = templates.filter(t => t.type === currentType);

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div
                className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-line">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl"></span>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-ink)' }}>
                            {mode === 'save' ? (i18n.language === 'vi' ? 'Lưu mẫu bài tập' : 'Save Template') : (i18n.language === 'vi' ? 'Kho mẫu bài tập đã lưu' : 'Saved Templates')}
                        </h3>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-surface-subtle">
                        <button
                            type="button"
                            onClick={() => { soundFx.playClick(); setMode('save'); }}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${mode === 'save' ? 'bg-brand text-on-brand shadow-sm' : 'text-ink-muted'}`}
                        >
                            Lưu Mẫu
                        </button>
                        <button
                            type="button"
                            onClick={() => { soundFx.playClick(); setMode('load'); }}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${mode === 'load' ? 'bg-brand text-on-brand shadow-sm' : 'text-ink-muted'}`}
                        >
                            Mẫu Đã Lưu ({filteredTemplates.length})
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="py-4 flex-1 overflow-y-auto">
                    {mode === 'save' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase text-ink-muted">
                                    {i18n.language === 'vi' ? 'Tên mẫu bài tập để ghi nhớ' : 'Template Name'}
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    className="input w-full p-3 text-sm rounded-xl"
                                    placeholder="Ví dụ: Ô chữ Tiếng Anh Lớp 4 - Unit 5"
                                />
                            </div>

                            <p className="text-xs text-ink-subtle">
                                Mẫu bài tập sẽ được lưu an toàn trong trình duyệt của bạn (IndexedDB). Bạn có thể mở lại bất cứ lúc nào.
                            </p>

                            <button
                                type="button"
                                onClick={handleSave}
                                className="btn btn-primary w-full !py-3 font-bold"
                            >
                                {i18n.language === 'vi' ? 'Xác nhận Lưu Mẫu' : 'Save to Browser'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTemplates.length === 0 ? (
                                <div className="text-center py-10 text-ink-subtle">
                                    <div className="text-4xl mb-2"></div>
                                    <p className="text-sm font-semibold">Chưa có mẫu nào cho công cụ này.</p>
                                    <p className="text-xs mt-1">Hãy chuyển sang tab "Lưu Mẫu" để lưu bài tập hiện tại.</p>
                                </div>
                            ) : (
                                filteredTemplates.map(tpl => (
                                    <div
                                        key={tpl.id}
                                        className="p-3.5 rounded-2xl border flex items-center justify-between transition-all hover:border-brand"
                                        style={{
                                            background: 'var(--bg-body)',
                                            borderColor: 'var(--border-color)',
                                        }}
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-ink">{tpl.name}</h4>
                                            <span className="text-[11px] text-ink-subtle">
                                                {new Date(tpl.updatedAt).toLocaleDateString('vi-VN')} {new Date(tpl.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    soundFx.playCorrect();
                                                    onLoadTemplate(tpl);
                                                    onClose();
                                                }}
                                                className="btn btn-primary !py-1.5 !px-3 !text-xs font-bold"
                                            >
                                                Tải mẫu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(tpl.id)}
                                                className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center font-bold text-sm"
                                                title="Xóa mẫu"
                                            ><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Export / Import Buttons */}
                            <div className="pt-3 border-t border-line flex justify-between items-center text-xs">
                                <button
                                    type="button"
                                    onClick={handleExportJSON}
                                    className="btn btn-secondary !py-1.5 !px-3 !text-xs"
                                >
                                    Xuất ra file JSON
                                </button>

                                <label className="btn btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer">
                                    Nhập từ file JSON
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportJSON}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer close */}
                <div className="pt-3 border-t border-line flex justify-end">
                    <button
                        type="button"
                        onClick={() => { soundFx.playClick(); onClose(); }}
                        className="btn btn-secondary !py-2 !px-5 text-xs font-semibold"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
