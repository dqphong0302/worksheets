import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GeneratorType, GeneratorModule } from '../types';
import { usePDTheme } from '../hooks/usePDTheme';
import { soundFx } from '../utils/sound';

// Modern SVG Icons for all 15 modules
const CrosswordIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="14" height="14" rx="2" fill="currentColor" fillOpacity="0.15" />
        <rect x="22" y="8" width="14" height="14" rx="2" />
        <rect x="36" y="8" width="14" height="14" rx="2" fill="currentColor" fillOpacity="0.15" />
        <rect x="22" y="22" width="14" height="14" rx="2" />
        <rect x="22" y="36" width="14" height="14" rx="2" />
        <rect x="36" y="36" width="14" height="14" rx="2" />
        <rect x="50" y="36" width="14" height="14" rx="2" fill="currentColor" fillOpacity="0.15" />
        <text x="29" y="19" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">A</text>
        <text x="29" y="33" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">B</text>
        <text x="29" y="47" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">C</text>
    </svg>
);

const WordSearchIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="48" height="48" rx="6" />
        <text x="16" y="24" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">A B C D</text>
        <text x="16" y="38" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">E F G H</text>
        <text x="16" y="50" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">I J K L</text>
        <line x1="14" y1="21" x2="48" y2="21" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    </svg>
);

const MatchingIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="12" width="18" height="10" rx="3" />
        <rect x="8" y="27" width="18" height="10" rx="3" />
        <rect x="8" y="42" width="18" height="10" rx="3" />
        <rect x="38" y="12" width="18" height="10" rx="3" />
        <rect x="38" y="27" width="18" height="10" rx="3" />
        <rect x="38" y="42" width="18" height="10" rx="3" />
        <path d="M26 17 L38 32" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="3 3" />
        <path d="M26 32 L38 47" stroke="#6366f1" strokeWidth="2.2" strokeDasharray="3 3" />
        <path d="M26 47 L38 17" stroke="#10b981" strokeWidth="2.2" strokeDasharray="3 3" />
    </svg>
);

const WordScrambleIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="22" width="11" height="16" rx="3" />
        <rect x="22" y="22" width="11" height="16" rx="3" />
        <rect x="36" y="22" width="11" height="16" rx="3" />
        <rect x="50" y="22" width="11" height="16" rx="3" />
        <text x="13.5" y="34" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">C</text>
        <text x="27.5" y="34" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">A</text>
        <text x="41.5" y="34" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">T</text>
        <text x="55.5" y="34" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">?</text>
        <path d="M14 44 C14 50, 28 50, 28 44" stroke="#38bdf8" strokeWidth="2" fill="none" />
        <path d="M42 44 C42 50, 56 50, 56 44" stroke="#6366f1" strokeWidth="2" fill="none" />
    </svg>
);

const ImageSearchIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="28" height="28" rx="4" />
        <text x="13" y="22" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none">A B</text>
        <text x="13" y="32" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none">C D</text>
        <rect x="40" y="8" width="16" height="16" rx="3" />
        <circle cx="48" cy="14" r="2.5" fill="currentColor" stroke="none" />
        <path d="M43 21 L47 17 L51 19 L54 15" stroke="currentColor" strokeWidth="1.5" />
        <rect x="40" y="28" width="16" height="16" rx="3" />
        <path d="M44 38 L48 34 L52 38" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const MatchingImagesIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="12" width="18" height="14" rx="3" />
        <circle cx="14" cy="17" r="2" fill="currentColor" stroke="none" />
        <path d="M10 23 L14 19 L18 21 L24 17" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="36" width="18" height="14" rx="3" />
        <path d="M12 45 L17 41 L22 45" stroke="currentColor" strokeWidth="2" />
        <rect x="38" y="12" width="18" height="14" rx="3" />
        <text x="47" y="22" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">Cat</text>
        <rect x="38" y="36" width="18" height="14" rx="3" />
        <text x="47" y="46" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">Dog</text>
        <path d="M26 19 L38 43" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M26 43 L38 19" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
);

const SpellingIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <text x="10" y="20" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">1.</text>
        <line x1="24" y1="18" x2="54" y2="18" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
        <text x="10" y="36" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">2.</text>
        <line x1="24" y1="34" x2="54" y2="34" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
        <text x="10" y="52" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">3.</text>
        <line x1="24" y1="50" x2="54" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="50" cy="18" r="3" fill="#38bdf8" stroke="none" />
    </svg>
);

const TracerIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <text x="10" y="36" fontSize="28" fontWeight="bold" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2">Aa</text>
        <line x1="8" y1="46" x2="56" y2="46" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="8" y1="52" x2="56" y2="52" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const MathIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <text x="12" y="22" fontSize="14" fontWeight="bold" fill="currentColor" stroke="none">12</text>
        <text x="30" y="22" fontSize="14" fontWeight="bold" fill="#38bdf8" stroke="none">+</text>
        <text x="44" y="22" fontSize="14" fontWeight="bold" fill="currentColor" stroke="none">5</text>
        <line x1="12" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="2.5" />
        <text x="12" y="46" fontSize="14" fontWeight="bold" fill="#10b981" stroke="none">17</text>
        <text x="12" y="58" fontSize="10" fill="currentColor" opacity="0.6" stroke="none">3 × 4 = ?</text>
    </svg>
);

const FindIdenticalIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="22" height="22" rx="4" />
        <rect x="34" y="8" width="22" height="22" rx="4" />
        <rect x="8" y="34" width="22" height="22" rx="4" />
        <rect x="34" y="34" width="22" height="22" rx="4" />
        <text x="19" y="23" fontSize="11" fill="currentColor" stroke="none" textAnchor="middle">❓</text>
        <text x="45" y="23" fontSize="11" fill="currentColor" stroke="none" textAnchor="middle">🐱</text>
        <text x="19" y="49" fontSize="11" fill="currentColor" stroke="none" textAnchor="middle">🐱</text>
        <text x="45" y="49" fontSize="11" fill="currentColor" stroke="none" textAnchor="middle">❓</text>
    </svg>
);

const BingoIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="48" height="48" rx="6" />
        <line x1="8" y1="22" x2="56" y2="22" />
        <line x1="24" y1="8" x2="24" y2="56" />
        <line x1="40" y1="8" x2="40" y2="56" />
        <line x1="8" y1="39" x2="56" y2="39" />
        <circle cx="32" cy="30.5" r="4.5" fill="#f59e0b" stroke="none" />
        <text x="16" y="18" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">B</text>
        <text x="32" y="18" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">I</text>
        <text x="48" y="18" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">N</text>
    </svg>
);

const FlashcardsIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="8" width="38" height="44" rx="4" fill="currentColor" fillOpacity="0.1" />
        <rect x="8" y="14" width="38" height="44" rx="4" fill="var(--bg-card)" />
        <text x="27" y="34" fontSize="11" fontWeight="bold" fill="#0284c7" stroke="none" textAnchor="middle">A-Z</text>
        <line x1="16" y1="44" x2="38" y2="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
);

const CryptogramIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="10" width="48" height="44" rx="6" />
        <circle cx="20" cy="24" r="5" stroke="#38bdf8" />
        <text x="20" y="27" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" textAnchor="middle">1</text>
        <path d="M36 20 L44 28 M44 20 L36 28" stroke="#6366f1" strokeWidth="2" />
        <line x1="14" y1="42" x2="26" y2="42" stroke="currentColor" strokeWidth="2" />
        <line x1="32" y1="42" x2="44" y2="42" stroke="currentColor" strokeWidth="2" />
        <text x="20" y="39" fontSize="10" fontWeight="bold" fill="#10b981" stroke="none" textAnchor="middle">A</text>
    </svg>
);

const MazeIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="48" height="48" rx="6" />
        <path d="M8 24 H28 V40 H18 V48" />
        <path d="M38 8 V24 H48" />
        <path d="M38 34 V56" />
        <path d="M48 38 H56" />
        <circle cx="16" cy="16" r="3.5" fill="#38bdf8" stroke="none" />
        <circle cx="48" cy="48" r="3.5" fill="#f59e0b" stroke="none" />
    </svg>
);

const SudokuIcon = () => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="48" height="48" rx="5" />
        <line x1="24" y1="8" x2="24" y2="56" strokeWidth="2.5" />
        <line x1="40" y1="8" x2="40" y2="56" strokeWidth="2.5" />
        <line x1="8" y1="24" x2="56" y2="24" strokeWidth="2.5" />
        <line x1="8" y1="40" x2="56" y2="40" strokeWidth="2.5" />
        <text x="16" y="20" fontSize="9" fontWeight="bold" fill="#0284c7" stroke="none" textAnchor="middle">4</text>
        <text x="32" y="36" fontSize="9" fontWeight="bold" fill="#10b981" stroke="none" textAnchor="middle">1</text>
        <text x="48" y="52" fontSize="9" fontWeight="bold" fill="#f59e0b" stroke="none" textAnchor="middle">3</text>
    </svg>
);

interface ModuleCategory {
    id: string;
    icon: string;
    nameVi: string;
    nameEn: string;
    color: string;
    modules: GeneratorModule[];
}

const CATEGORIES: ModuleCategory[] = [
    {
        id: 'vocabulary',
        icon: '📝',
        nameVi: 'Từ vựng & Ngôn ngữ',
        nameEn: 'Vocabulary & Language',
        color: '#0284c7',
        modules: [
            {
                id: 'crossword',
                nameKey: 'modules.crossword.name',
                descriptionKey: 'modules.crossword.description',
                icon: 'crossword',
                hasPlayMode: true,
            },
            {
                id: 'wordSearch',
                nameKey: 'modules.wordSearch.name',
                descriptionKey: 'modules.wordSearch.description',
                icon: 'wordSearch',
                hasPlayMode: true,
            },
            {
                id: 'wordScramble',
                nameKey: 'modules.wordScramble.name',
                descriptionKey: 'modules.wordScramble.description',
                icon: 'wordScramble',
                hasPlayMode: true,
            },
            {
                id: 'spellingTest',
                nameKey: 'modules.spellingTest.name',
                descriptionKey: 'modules.spellingTest.description',
                icon: 'spellingTest',
                hasPlayMode: true,
            },
            {
                id: 'wordTracer',
                nameKey: 'modules.wordTracer.name',
                descriptionKey: 'modules.wordTracer.description',
                icon: 'wordTracer',
                hasPlayMode: true,
            },
            {
                id: 'flashcards',
                nameKey: 'modules.flashcards.name',
                descriptionKey: 'modules.flashcards.description',
                icon: 'flashcards',
                hasPlayMode: true,
            },
            {
                id: 'cryptogram',
                nameKey: 'modules.cryptogram.name',
                descriptionKey: 'modules.cryptogram.description',
                icon: 'cryptogram',
                hasPlayMode: true,
            },
        ],
    },
    {
        id: 'matching',
        icon: '🔗',
        nameVi: 'Nối ghép & Trò chơi Lớp học',
        nameEn: 'Matching & Classroom Games',
        color: '#6366f1',
        modules: [
            {
                id: 'matching',
                nameKey: 'modules.matching.name',
                descriptionKey: 'modules.matching.description',
                icon: 'matching',
                hasPlayMode: true,
            },
            {
                id: 'wordSearchImages',
                nameKey: 'modules.wordSearchImages.name',
                descriptionKey: 'modules.wordSearchImages.description',
                icon: 'wordSearchImages',
                hasPlayMode: true,
            },
            {
                id: 'matchingImages',
                nameKey: 'modules.matchingImages.name',
                descriptionKey: 'modules.matchingImages.description',
                icon: 'matchingImages',
                hasPlayMode: true,
            },
            {
                id: 'findIdentical',
                nameKey: 'modules.findIdentical.name',
                descriptionKey: 'modules.findIdentical.description',
                icon: 'findIdentical',
                hasPlayMode: true,
            },
            {
                id: 'bingo',
                nameKey: 'modules.bingo.name',
                descriptionKey: 'modules.bingo.description',
                icon: 'bingo',
                hasPlayMode: true,
            },
        ],
    },
    {
        id: 'math',
        icon: '🔢',
        nameVi: 'Toán học & Tư duy Logic',
        nameEn: 'Math & Logic Puzzles',
        color: '#10b981',
        modules: [
            {
                id: 'mathWorksheet',
                nameKey: 'modules.mathWorksheet.name',
                descriptionKey: 'modules.mathWorksheet.description',
                icon: 'mathWorksheet',
                hasPlayMode: true,
            },
            {
                id: 'sudoku',
                nameKey: 'modules.sudoku.name',
                descriptionKey: 'modules.sudoku.description',
                icon: 'sudoku',
                hasPlayMode: true,
            },
            {
                id: 'maze',
                nameKey: 'modules.maze.name',
                descriptionKey: 'modules.maze.description',
                icon: 'maze',
                hasPlayMode: true,
            },
        ],
    },
];

const IconMap: Record<string, React.FC> = {
    crossword: CrosswordIcon,
    wordSearch: WordSearchIcon,
    matching: MatchingIcon,
    wordScramble: WordScrambleIcon,
    wordSearchImages: ImageSearchIcon,
    matchingImages: MatchingImagesIcon,
    spellingTest: SpellingIcon,
    wordTracer: TracerIcon,
    mathWorksheet: MathIcon,
    findIdentical: FindIdenticalIcon,
    bingo: BingoIcon,
    flashcards: FlashcardsIcon,
    cryptogram: CryptogramIcon,
    maze: MazeIcon,
    sudoku: SudokuIcon,
};

export const HomePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = usePDTheme();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const toggleLanguage = () => {
        soundFx.playClick();
        const newLang = i18n.language === 'en' ? 'vi' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const handleModuleClick = (moduleId: GeneratorType) => {
        soundFx.playClick();
        navigate(`/editor/${moduleId}`);
    };

    const filteredCategories = useMemo(() => {
        return CATEGORIES.map(category => {
            if (selectedCategory !== 'all' && category.id !== selectedCategory) {
                return null;
            }
            const filteredModules = category.modules.filter(module => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                const name = t(module.nameKey).toLowerCase();
                const desc = t(module.descriptionKey).toLowerCase();
                return name.includes(q) || desc.includes(q);
            });
            if (filteredModules.length === 0) return null;
            return {
                ...category,
                modules: filteredModules,
            };
        }).filter(Boolean) as ModuleCategory[];
    }, [selectedCategory, searchQuery, t]);

    const totalModules = CATEGORIES.reduce((acc, cat) => acc + cat.modules.length, 0);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-body)]">
            {/* Header / Topbar */}
            <header className="header pd-header">
                <div className="container header-inner pd-container pd-header__inner">
                    <a href="https://phongdang.io.vn" className="brand-link pd-brand">
                        <div className="brand-icon pd-brand__icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div>
                            <span className="brand-title pd-brand__title">Worksheet Generator Pro</span>
                            <span className="brand-sub pd-brand__subtitle">
                                {i18n.language === 'vi' ? 'Tạo Phiếu Bài Tập & Học Tập Tương Tác' : 'Worksheet Creator & Classroom Games'}
                            </span>
                        </div>
                    </a>

                    <div className="header-actions pd-header__actions">
                        <button
                            id="lang-toggle"
                            className="btn-theme"
                            onClick={toggleLanguage}
                            title="Chuyển đổi ngôn ngữ / Switch Language"
                        >
                            <span>🌐</span>
                            <span className="font-mono">{i18n.language.toUpperCase()}</span>
                        </button>
                        <button
                            id="theme-toggle"
                            className="btn-theme"
                            onClick={() => {
                                soundFx.playClick();
                                toggleTheme();
                            }}
                            title="Chuyển chế độ Sáng / Tối"
                        >
                            <span>{isDark ? '☀️' : '🌙'}</span>
                            <span>{isDark ? (i18n.language === 'vi' ? 'Sáng' : 'Light') : (i18n.language === 'vi' ? 'Tối' : 'Dark')}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main id="main-content" className="pd-main flex-1">
                <h1 className="pd-sr-only">Worksheet Generator Pro - Tạo Phiếu Bài Tập Trực Tuyến</h1>

                {/* Hero Section */}
                <section className="py-12 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badges */}
                        <div className="flex flex-wrap justify-center items-center gap-2.5 mb-5">
                            <span className="badge badge-primary">✨ {totalModules} {i18n.language === 'vi' ? 'Bộ Học Cụ & Bài Tập' : 'Education Tools'}</span>
                            <span className="badge badge-indigo">🎮 {i18n.language === 'vi' ? 'Chế Độ Chơi Tương Tác' : 'Interactive Play Mode'}</span>
                            <span className="badge badge-success">🖨️ {i18n.language === 'vi' ? 'In A4 & Xuất PDF/DOCX' : 'Print & PDF/DOCX Export'}</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white leading-tight">
                            {i18n.language === 'vi' ? (
                                <>
                                    Tạo phiếu bài tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">nhanh chóng</span>.
                                    <br />
                                    Học sinh chơi trực tiếp <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">hào hứng</span>.
                                </>
                            ) : (
                                <>
                                    Create worksheets <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">in seconds</span>.
                                    <br />
                                    Students play <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">interactively</span>.
                                </>
                            )}
                        </h2>

                        <p className="text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400 mb-8">
                            {i18n.language === 'vi'
                                ? 'Đa dạng 15 thể loại học cụ và bài tập: Ô chữ, Tìm từ, Xáo chữ, Nối cặp, Bingo lớp học, Thẻ Flashcards, Mật thư, Mê cung, Sudoku, Bài tập toán... In ấn chất lượng cao hoặc mở chế độ chơi trực tiếp.'
                                : '15 versatile learning activities: Crosswords, Word Searches, Scramble, Bingo, Flashcards, Cryptograms, Mazes, Sudoku, Math Drills... High-quality print ready or interactive play mode.'}
                        </p>

                        {/* Search & Category Filter */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto mb-8">
                            <div className="relative w-full sm:w-80">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={i18n.language === 'vi' ? '🔍 Tìm kiếm công cụ bài tập...' : '🔍 Search worksheet tools...'}
                                    className="input w-full pl-4 pr-10 py-2.5 rounded-xl text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'} !py-2 !px-3.5 !text-xs`}
                                >
                                    {i18n.language === 'vi' ? 'Tất cả' : 'All'} ({totalModules})
                                </button>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'} !py-2 !px-3.5 !text-xs`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{i18n.language === 'vi' ? cat.nameVi.split('&')[0].trim() : cat.nameEn.split('&')[0].trim()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Module Categories Grid */}
                <section className="max-w-7xl mx-auto px-6 pb-20">
                    {filteredCategories.length === 0 ? (
                        <div className="card p-12 text-center max-w-md mx-auto">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                                {i18n.language === 'vi' ? 'Không tìm thấy công cụ' : 'No tools found'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                {i18n.language === 'vi' ? 'Vui lòng thử tìm với từ khóa khác.' : 'Please try searching with different keywords.'}
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                className="btn btn-secondary !py-2 !px-4"
                            >
                                {i18n.language === 'vi' ? 'Hiển thị tất cả' : 'Show all tools'}
                            </button>
                        </div>
                    ) : (
                        filteredCategories.map((category, catIndex) => (
                            <div
                                key={category.id}
                                className="mb-12 animate-slideUp"
                                style={{ animationDelay: `${catIndex * 80}ms` }}
                            >
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                                        style={{ background: `${category.color}20`, color: category.color }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {i18n.language === 'vi' ? category.nameVi : category.nameEn}
                                        </h3>
                                    </div>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {category.modules.length} {i18n.language === 'vi' ? 'công cụ' : 'tools'}
                                    </span>
                                </div>

                                {/* Module Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {category.modules.map(module => {
                                        const IconComponent = IconMap[module.icon] || CrosswordIcon;
                                        return (
                                            <div
                                                key={module.id}
                                                className="module-card cursor-pointer group"
                                                onClick={() => handleModuleClick(module.id)}
                                            >
                                                {/* Play Mode Badge */}
                                                {module.hasPlayMode && (
                                                    <div className="absolute top-3.5 right-3.5">
                                                        <span className="badge badge-success !text-[11px] !py-0.5">
                                                            🎮 Play
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    className="module-card-icon"
                                                    style={{ color: category.color }}
                                                >
                                                    <IconComponent />
                                                </div>

                                                <h4 className="module-card-title">{t(module.nameKey)}</h4>
                                                <p className="module-card-desc">{t(module.descriptionKey)}</p>

                                                {/* Action link */}
                                                <div
                                                    className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold transition-colors"
                                                    style={{ color: category.color }}
                                                >
                                                    <span>{i18n.language === 'vi' ? 'Tạo bài tập' : 'Open generator'}</span>
                                                    <span className="transition-transform group-hover:translate-x-1">→</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="footer pd-footer">
                <div className="container footer-inner pd-container pd-footer__inner">
                    <div className="footer-copy">
                        © 2026 <strong>Worksheet Generator Pro</strong> • <span>{i18n.language === 'vi' ? 'Một công cụ thuộc hệ sinh thái' : 'Part of the ecosystem'}</span> <a href="https://phongdang.io.vn" target="_blank" rel="noopener noreferrer" className="footer-domain">Phong Đặng</a>
                    </div>
                    <div className="footer-links pd-footer__links">
                        <a href="https://phongdang.io.vn" target="_blank" rel="noopener noreferrer" className="footer-link">🌐 phongdang.io.vn</a>
                        <a href="https://github.com/dqphong0302" target="_blank" rel="noopener noreferrer" className="footer-link">💻 GitHub</a>
                        <a href="https://classtools.vn" target="_blank" rel="noopener noreferrer" className="footer-link">🏫 classtools.vn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
