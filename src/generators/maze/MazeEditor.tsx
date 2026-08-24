import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Select, Checkbox, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { MazeConfig, MazeDifficulty, ExportFormat } from '../../types';
import { generateMaze, getDefaultMazeConfig } from './mazeGenerator';
import { MazePlay } from './MazePlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';

import { PresetPicker } from '../../components/common/PresetPicker';
import { TemplateModal } from '../../components/template/TemplateModal';
import { PresetTopic } from '../../presets/worksheetPresets';

function getInitialConfig(): MazeConfig {
    const saved = getEditorState<MazeConfig>('maze');
    if (saved) {
        const { lastModified, ...config } = saved as MazeConfig & { lastModified?: string };
        return { ...getDefaultMazeConfig(), ...config };
    }
    return getDefaultMazeConfig();
}

interface MazeEditorProps {
    onHome: () => void;
}

export const MazeEditor: React.FC<MazeEditorProps> = ({ onHome }) => {
    const { t, i18n } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);
    const [playMode, setPlayMode] = useState(false);
    const [regenerateKey, setRegenerateKey] = useState(0);
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
    } = useUndoRedo<MazeConfig>(getInitialConfig());

    // Auto-save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('maze', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const result = useMemo(() => generateMaze(config), [config, regenerateKey]);

    const handleApplyPreset = (topic: PresetTopic) => {
        const word = topic.words[0]?.word || 'STAR';
        const startEmoji = topic.icon || '🚀';
        const goalEmoji = topic.words[0]?.emoji || '⭐';
        setConfig({
            ...config,
            title: `Mê Cung - ${i18n.language === 'vi' ? topic.nameVi : topic.nameEn}`,
            checkpointWord: word,
            startEmoji,
            goalEmoji,
        });
    };

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                subtitle: `Maze Puzzle - ${config.difficulty.toUpperCase()} difficulty`,
                sections: [
                    {
                        type: 'paragraph',
                        content: `Help the ${config.startEmoji} find the way to the ${config.goalEmoji}! Collect letters along the path.`
                    }
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    if (playMode) {
        return (
            <MazePlay
                title={config.title}
                grid={result.grid}
                start={result.start}
                goal={result.goal}
                startEmoji={config.startEmoji}
                goalEmoji={config.goalEmoji}
                checkpointWord={config.checkpointWord}
                onClose={() => setPlayMode(false)}
            />
        );
    }

    const height = result.grid.length;
    const width = result.grid[0]?.length || 1;
    const cellSize = Math.min(32, Math.floor(460 / Math.max(width, height)));

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="maze"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(tpl) => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.maze.name', 'Mê Cung Chữ Cái')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultMazeConfig())}
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
                            🎮 {i18n.language === 'vi' ? 'Chơi Vượt Mê Cung / Play Maze' : 'Play Maze Now'}
                        </Button>

                        {/* Preset Picker */}
                        <PresetPicker onSelectTopic={handleApplyPreset} />

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setRegenerateKey(k => k + 1)}
                    >
                        🎲 {i18n.language === 'vi' ? 'Sinh ngẫu nhiên mê cung mới' : 'Regenerate Maze'}
                    </Button>

                    <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">
                        ⚙️ {t('editor.config')}
                    </h3>

                    <Input
                        label={t('editor.title')}
                        value={config.title}
                        onChange={e => setConfig({ ...config, title: e.target.value })}
                    />

                    <Select
                        label={i18n.language === 'vi' ? 'Độ khó mê cung' : 'Difficulty'}
                        value={config.difficulty}
                        options={[
                            { value: 'easy', label: 'Dễ (8 x 8 - Mầm non & Lớp 1)' },
                            { value: 'medium', label: 'Vừa (12 x 12 - Tiểu học)' },
                            { value: 'hard', label: 'Khó (16 x 16 - Thử thách)' },
                        ]}
                        onChange={e => setConfig({ ...config, difficulty: e.target.value as MazeDifficulty })}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label={i18n.language === 'vi' ? 'Icon Xuất phát' : 'Start emoji'}
                            value={config.startEmoji}
                            onChange={e => setConfig({ ...config, startEmoji: e.target.value })}
                        />
                        <Input
                            label={i18n.language === 'vi' ? 'Icon Đích đến' : 'Goal emoji'}
                            value={config.goalEmoji}
                            onChange={e => setConfig({ ...config, goalEmoji: e.target.value })}
                        />
                    </div>

                    <Input
                        label={i18n.language === 'vi' ? 'Từ vựng đặt trên đường đi' : 'Checkpoint word'}
                        value={config.checkpointWord || ''}
                        onChange={e => setConfig({ ...config, checkpointWord: e.target.value })}
                        placeholder="VD: APPLE, STAR, CAT..."
                    />

                    <Checkbox
                        label={i18n.language === 'vi' ? 'Hiện đường đi đáp án (Solution Path)' : 'Show solution path'}
                        checked={config.showSolutionPath}
                        onChange={e => setConfig({ ...config, showSolutionPath: e.target.checked })}
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
                                    🚀 {i18n.language === 'vi'
                                        ? `Giúp ${config.startEmoji} tìm đường đến ${config.goalEmoji}${config.checkpointWord ? ` và thu thập các chữ cái ghép thành từ [${config.checkpointWord.toUpperCase()}]` : ''}!`
                                        : `Help ${config.startEmoji} find the path to ${config.goalEmoji}!`}
                                </p>
                            </div>

                            {/* Printable Maze Board */}
                            <div className="flex justify-center my-6">
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                                        gap: '0',
                                        backgroundColor: '#ffffff',
                                        border: '3px solid #0f172a',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    {result.grid.map((row, r) =>
                                        row.map((cell, c) => {
                                            const isStart = result.start.r === r && result.start.c === c;
                                            const isGoal = result.goal.r === r && result.goal.c === c;
                                            const isSol = config.showSolutionPath && cell.isSolution;

                                            return (
                                                <div
                                                    key={`${r}-${c}`}
                                                    style={{
                                                        width: `${cellSize}px`,
                                                        height: `${cellSize}px`,
                                                        borderTop: cell.top ? '2.5px solid #0f172a' : '2.5px solid transparent',
                                                        borderRight: cell.right ? '2.5px solid #0f172a' : '2.5px solid transparent',
                                                        borderBottom: cell.bottom ? '2.5px solid #0f172a' : '2.5px solid transparent',
                                                        borderLeft: cell.left ? '2.5px solid #0f172a' : '2.5px solid transparent',
                                                        backgroundColor: isSol ? '#e0f2fe' : '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: `${cellSize * 0.55}px`,
                                                        fontWeight: 700,
                                                        color: '#0284c7',
                                                    }}
                                                >
                                                    {isStart ? (
                                                        <span>{config.startEmoji}</span>
                                                    ) : isGoal ? (
                                                        <span>{config.goalEmoji}</span>
                                                    ) : cell.checkpointLetter ? (
                                                        <span style={{ fontSize: '0.85em', color: '#d97706', fontWeight: 800 }}>
                                                            {cell.checkpointLetter}
                                                        </span>
                                                    ) : isSol ? (
                                                        <span style={{ fontSize: '0.5em', color: '#0284c7' }}>•</span>
                                                    ) : null}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </PaperPreview>
                </div>
            }
        />
        </>
    );
};
