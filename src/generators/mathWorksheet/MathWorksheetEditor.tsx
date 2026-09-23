import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorLayout } from '../../components/editor/EditorLayout';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { PaperPreview } from '../../components/paper/PaperPreview';
import { ZoomControl } from '../../components/editor/ZoomControl';
import { Input, Select, Checkbox, NumberInput, Button } from '../../components/common';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { MathWorksheetConfig, MathProblem, MathOperation, ExportFormat } from '../../types';
import { MathWorksheetPlay } from './MathWorksheetPlay';
import { exportToDOCX } from '../../services/exportService';
import { saveEditorState, getEditorState } from '../../services/storageService';
import { TemplateModal } from '../../components/template/TemplateModal';

function generateMathProblems(config: MathWorksheetConfig): MathProblem[] {
    const problems: MathProblem[] = [];
    const { minNumber = 1, maxNumber = 20, problemCount = 20, allowCarry = true, allowBorrow = true } = config;
    const activeOperations: MathOperation[] = (config.operations && config.operations.length > 0) ? config.operations : ['add'];

    for (let i = 0; i < problemCount; i++) {
        const operation = activeOperations[Math.floor(Math.random() * activeOperations.length)];
        let num1: number, num2: number, answer: number;

        switch (operation) {
            case 'add': {
                num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
                num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
                if (!allowCarry && num1 + num2 >= 100 && maxNumber < 100) {
                    num2 = Math.max(1, Math.min(num2, 99 - num1));
                }
                answer = num1 + num2;
                break;
            }
            case 'subtract': {
                const a = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
                const b = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
                num1 = Math.max(a, b);
                num2 = Math.min(a, b);
                if (!allowBorrow && num1 >= 10) {
                    const d1 = num1 % 10;
                    const d2 = Math.min(num2 % 10, d1);
                    const t1 = Math.floor(num1 / 10);
                    const t2 = Math.min(Math.floor(num2 / 10), t1);
                    num2 = t2 * 10 + d2;
                }
                answer = num1 - num2;
                break;
            }
            case 'multiply': {
                const maxFactor = Math.min(12, Math.max(2, maxNumber));
                num1 = Math.floor(Math.random() * maxFactor) + 1;
                num2 = Math.floor(Math.random() * maxFactor) + 1;
                answer = num1 * num2;
                break;
            }
            case 'divide': {
                num2 = Math.floor(Math.random() * 10) + 2; // divisor 2..11
                answer = Math.floor(Math.random() * 10) + 1; // quotient 1..10
                num1 = num2 * answer;
                break;
            }
            default:
                num1 = 5;
                num2 = 3;
                answer = 8;
        }

        problems.push({ num1, num2, operation, answer });
    }

    return problems;
}

function getOperationSymbol(op: MathOperation): string {
    switch (op) {
        case 'add': return '+';
        case 'subtract': return '−';
        case 'multiply': return '×';
        case 'divide': return '÷';
    }
}

function getDefaultMathConfig(): MathWorksheetConfig {
    return {
        title: 'Math Worksheet',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 16,
        font: 'Arial',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.5,
        operations: ['add', 'subtract'],
        minNumber: 1,
        maxNumber: 20,
        problemCount: 20,
        layout: 'vertical',
        allowCarry: true,
        allowBorrow: true,
        columns: 4,
    };
}

// Get initial config from localStorage or use default
function getInitialConfig(): MathWorksheetConfig {
    const saved = getEditorState<MathWorksheetConfig>('mathWorksheet');
    if (saved) {
        const config = { ...saved };
        delete config.lastModified;
        return { ...getDefaultMathConfig(), ...config };
    }
    return getDefaultMathConfig();
}

interface MathWorksheetEditorProps {
    onHome: () => void;
}

export const MathWorksheetEditor: React.FC<MathWorksheetEditorProps> = ({ onHome }) => {
    const { t } = useTranslation();
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
    } = useUndoRedo<MathWorksheetConfig>(getInitialConfig());

    // Auto-save to localStorage
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveEditorState('mathWorksheet', config);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [config]);

    const problems = useMemo(() => generateMathProblems(config), [config]);

    const handleExport = async (format: ExportFormat) => {
        if (format === 'docx') {
            await exportToDOCX({
                title: config.title,
                sections: [
                    { type: 'paragraph', content: 'Name: ____________________  Date: ____________' },
                    {
                        type: 'numberedList', content: problems.map(p =>
                            `${p.num1} ${getOperationSymbol(p.operation)} ${p.num2} = ____`
                        )
                    },
                    ...(config.showAnswerKey ? [
                        { type: 'paragraph' as const, content: '—— Answer Key ——' },
                        { type: 'numberedList' as const, content: problems.map(p => String(p.answer)) },
                    ] : []),
                ]
            }, config.title.replace(/\s+/g, '_'));
        }
    };

    const toggleOperation = (op: MathOperation) => {
        const ops = config.operations.includes(op)
            ? config.operations.filter(o => o !== op)
            : [...config.operations, op];
        if (ops.length > 0) {
            setConfig({ ...config, operations: ops });
        }
    };

    return (
        <>
            <TemplateModal
                isOpen={templateModalOpen}
                mode={templateModalMode}
                currentType="mathWorksheet"
                currentConfig={config}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={tpl => setConfig(tpl.config)}
            />
            <EditorLayout
                toolbar={
                    <Toolbar
                        title={t('modules.mathWorksheet.name')}
                        onUndo={undo}
                        onRedo={redo}
                        onReset={() => reset(getDefaultMathConfig())}
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
                    <div className="animate-fadeIn">
                        {/* Play Mode Button - PRIMARY FEATURE */}
                        <Button
                            variant="primary"
                            className="w-full mb-6"
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

                        <h3 className="mb-4" style={{ fontSize: '0.85rem', color: '#6b625a' }}>
                            {t('editor.config')} (for print/export)
                        </h3>

                        <Input
                            label={t('editor.title')}
                            value={config.title}
                            onChange={e => setConfig({ ...config, title: e.target.value })}
                        />

                        <div className="form-group">
                            <label className="label">{t('math.operations')}</label>
                            <div className="flex flex-col gap-1">
                                <Checkbox
                                    label={t('math.add')}
                                    checked={config.operations.includes('add')}
                                    onChange={() => toggleOperation('add')}
                                />
                                <Checkbox
                                    label={t('math.subtract')}
                                    checked={config.operations.includes('subtract')}
                                    onChange={() => toggleOperation('subtract')}
                                />
                                <Checkbox
                                    label={t('math.multiply')}
                                    checked={config.operations.includes('multiply')}
                                    onChange={() => toggleOperation('multiply')}
                                />
                                <Checkbox
                                    label={t('math.divide')}
                                    checked={config.operations.includes('divide')}
                                    onChange={() => toggleOperation('divide')}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">{t('math.numberRange')}</label>
                            <div className="flex gap-2">
                                <NumberInput
                                    label={t('math.minNumber')}
                                    value={config.minNumber}
                                    min={0}
                                    max={config.maxNumber - 1}
                                    onChange={e => setConfig({ ...config, minNumber: parseInt(e.target.value) || 1 })}
                                />
                                <NumberInput
                                    label={t('math.maxNumber')}
                                    value={config.maxNumber}
                                    min={config.minNumber + 1}
                                    max={1000}
                                    onChange={e => setConfig({ ...config, maxNumber: parseInt(e.target.value) || 20 })}
                                />
                            </div>
                        </div>

                        <NumberInput
                            label={t('math.problemCount')}
                            value={config.problemCount}
                            min={4}
                            max={50}
                            onChange={e => setConfig({ ...config, problemCount: parseInt(e.target.value) || 20 })}
                        />

                        <Select
                            label={t('math.layout')}
                            value={config.layout}
                            onChange={e => setConfig({ ...config, layout: e.target.value as MathWorksheetConfig['layout'] })}
                            options={[
                                { value: 'horizontal', label: t('math.horizontal') },
                                { value: 'vertical', label: t('math.vertical') },
                            ]}
                        />

                        <NumberInput
                            label={t('math.columns')}
                            value={config.columns}
                            min={2}
                            max={5}
                            onChange={e => setConfig({ ...config, columns: parseInt(e.target.value) || 4 })}
                        />

                        <Checkbox
                            label={t('math.allowCarry')}
                            checked={config.allowCarry}
                            onChange={e => setConfig({ ...config, allowCarry: e.target.checked })}
                        />

                        <Checkbox
                            label={t('math.allowBorrow')}
                            checked={config.allowBorrow}
                            onChange={e => setConfig({ ...config, allowBorrow: e.target.checked })}
                        />

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
                                <h1 style={{ textAlign: 'center', marginBottom: '0.25em', fontSize: '1.3em' }}>
                                    {config.title}
                                </h1>

                                <p style={{ marginBottom: '1em', fontSize: '0.9em' }}>
                                    Name: _________________________ Date: _____________
                                </p>

                                {/* Problems grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                                    gap: config.layout === 'vertical' ? '1.5em' : '1em',
                                }}>
                                    {problems.map((problem, i) => (
                                        <div key={i} style={{ textAlign: config.layout === 'vertical' ? 'right' : 'left' }}>
                                            {config.layout === 'horizontal' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em' }}>
                                                    <span style={{ fontWeight: 500 }}>{i + 1}.</span>
                                                    <span>{problem.num1}</span>
                                                    <span>{getOperationSymbol(problem.operation)}</span>
                                                    <span>{problem.num2}</span>
                                                    <span>=</span>
                                                    <span style={{
                                                        minWidth: '40px',
                                                        borderBottom: '1px solid #333',
                                                        display: 'inline-block',
                                                    }}></span>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'inline-block',
                                                    textAlign: 'right',
                                                    padding: '0 0.5em',
                                                }}>
                                                    <div style={{ fontSize: '0.75em', marginBottom: '0.25em' }}>{i + 1})</div>
                                                    <div>{problem.num1}</div>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-start',
                                                        borderBottom: '2px solid #333',
                                                        paddingBottom: '0.25em',
                                                    }}>
                                                        <span style={{ marginRight: '0.25em' }}>{getOperationSymbol(problem.operation)}</span>
                                                        <span>{problem.num2}</span>
                                                    </div>
                                                    <div style={{ minHeight: '1.5em' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Answer key */}
                                {config.showAnswerKey && (
                                    <div style={{
                                        marginTop: '2em',
                                        padding: '1em',
                                        background: '#f9f9f9',
                                        borderRadius: '4px',
                                        fontSize: '0.8em',
                                    }}>
                                        <h3 style={{ marginBottom: '0.5em' }}>Answer Key</h3>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${Math.min(config.columns + 2, 6)}, 1fr)`,
                                            gap: '0.25em',
                                        }}>
                                            {problems.map((p, i) => (
                                                <span key={i}>{i + 1}. {p.answer}</span>
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
                    <MathWorksheetPlay
                        title={config.title}
                        problems={problems.map(p => ({
                            num1: p.num1,
                            num2: p.num2,
                            operator: getOperationSymbol(p.operation) as '+' | '-' | '×' | '÷',
                            answer: p.answer,
                        }))}
                        onClose={() => setPlayMode(false)}
                    />
                )
            }
        </>
    );
};
