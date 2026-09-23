import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ExportFormat, PaperSize } from '../../types';
import { exportToPDF, exportToPNG } from '../../services/exportService';
import { usePDTheme } from '../../hooks/usePDTheme';
import { soundFx } from '../../utils/sound';

// Icons
const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const UndoIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
);

const RedoIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
);

const ResetIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 2v6h6M21.5 22v-6h-6" />
        <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
    </svg>
);

const PrintIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
);

const DownloadIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

interface ToolbarProps {
    title: string;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    onSaveTemplate?: () => void;
    onLoadTemplate?: () => void;
    onExport: (format: ExportFormat) => void;
    onHome: () => void;
    canUndo: boolean;
    canRedo: boolean;
    previewRef: React.RefObject<HTMLDivElement | null>;
    paperSize: PaperSize;
    filename: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    title,
    onUndo,
    onRedo,
    onReset,
    onSaveTemplate,
    onLoadTemplate,
    onExport,
    onHome,
    canUndo,
    canRedo,
    previewRef,
    paperSize,
    filename,
}) => {
    const { t, i18n } = useTranslation();
    const { isDark, toggleTheme } = usePDTheme();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleLanguage = () => {
        soundFx.playClick();
        const newLang = i18n.language === 'en' ? 'vi' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const handlePrint = () => {
        soundFx.playClick();
        window.print();
    };

    const handleExport = async (format: ExportFormat) => {
        soundFx.playClick();
        if (!previewRef.current) return;

        setIsExporting(true);
        try {
            if (format === 'pdf') {
                await exportToPDF(previewRef.current, filename, paperSize);
            } else if (format === 'png') {
                await exportToPNG(previewRef.current, filename);
            } else {
                onExport(format);
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
            setShowExportMenu(false);
        }
    };

    return (
        <div className="editor-toolbar">
            {/* Left Brand / Breadcrumb */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => {
                        soundFx.playClick();
                        onHome();
                    }}
                    className="btn-theme"
                    title="Quay lại danh sách công cụ"
                >
                    <BackIcon />
                    <span className="hidden sm:inline">{i18n.language === 'vi' ? 'Quay lại' : 'Back'}</span>
                </button>
                <div className="h-6 w-px bg-line hidden sm:block" />
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                    <span className="text-xl"><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
                    <span>{title}</span>
                </h2>
            </div>

            {/* Middle Action Controls */}
            <div className="flex items-center gap-2">
                {/* Save / Load Templates */}
                {onSaveTemplate && (
                    <button
                        className="btn-theme"
                        onClick={() => {
                            soundFx.playClick();
                            onSaveTemplate();
                        }}
                        title="Lưu hoặc quản lý các mẫu bài tập"
                    >
                        <span><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/></svg></span>
                        <span className="hidden lg:inline text-xs">Mẫu</span>
                    </button>
                )}

                {/* Undo / Redo */}
                <button
                    className="btn-theme"
                    onClick={() => {
                        soundFx.playClick();
                        onUndo();
                    }}
                    disabled={!canUndo}
                    title="Hoàn tác (Ctrl+Z)"
                >
                    <UndoIcon />
                </button>
                <button
                    className="btn-theme"
                    onClick={() => {
                        soundFx.playClick();
                        onRedo();
                    }}
                    disabled={!canRedo}
                    title="Làm lại (Ctrl+Y)"
                >
                    <RedoIcon />
                </button>

                {/* Reset */}
                <button
                    className="btn-theme"
                    onClick={() => {
                        soundFx.playClick();
                        onReset();
                    }}
                    title="Đặt lại cài đặt mặc định"
                >
                    <ResetIcon />
                </button>

                <div className="h-6 w-px bg-line mx-1 hidden sm:block" />

                {/* Direct Print */}
                <button
                    className="btn btn-secondary"
                    onClick={handlePrint}
                    title="In trực tiếp ra máy in / Print (Ctrl+P)"
                >
                    <PrintIcon />
                    <span className="hidden md:inline">{i18n.language === 'vi' ? 'In ấn' : 'Print'}</span>
                </button>

                {/* Export Dropdown */}
                <div className="dropdown" ref={dropdownRef}>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            soundFx.playClick();
                            setShowExportMenu(!showExportMenu);
                        }}
                        disabled={isExporting}
                    >
                        <DownloadIcon />
                        <span>{isExporting ? (i18n.language === 'vi' ? 'Đang xuất...' : 'Exporting...') : (i18n.language === 'vi' ? 'Xuất file' : 'Export')}</span>
                    </button>

                    {showExportMenu && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item" onClick={() => handleExport('pdf')}>
                                <span><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
                                <span>Xuất PDF (A4)</span>
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('png')}>
                                <span><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg></span>
                                <span>Xuất Ảnh PNG (HD)</span>
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('docx')}>
                                <span><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/></svg></span>
                                <span>Xuất File Word (DOCX)</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-line mx-1 hidden sm:block" />

                {/* Language Switcher */}
                <button
                    className="btn-theme"
                    onClick={toggleLanguage}
                    title="Đổi ngôn ngữ giao diện (VI / EN)"
                >
                    <span><svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg></span>
                    <span className="font-mono text-xs">{i18n.language.toUpperCase()}</span>
                </button>

                {/* Theme Switcher */}
                <button
                    className="btn-theme"
                    onClick={() => {
                        soundFx.playClick();
                        toggleTheme();
                    }}
                    title="Chuyển chế độ Sáng / Tối"
                >
                    {isDark ? <svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg> : <svg className="pd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
                    <span className="hidden lg:inline text-xs">{isDark ? (i18n.language === 'vi' ? 'Sáng' : 'Light') : (i18n.language === 'vi' ? 'Tối' : 'Dark')}</span>
                </button>
            </div>
        </div>
    );
};
