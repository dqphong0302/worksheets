import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Select, NumberInput } from '../common';
import { StudentInfo, BorderStyle } from '../../types';

interface ConfigPanelExtrasProps {
    studentInfo: StudentInfo;
    borderStyle: BorderStyle;
    zoom: number;
    onStudentInfoChange: (info: StudentInfo) => void;
    onBorderStyleChange: (style: BorderStyle) => void;
    onZoomChange: (zoom: number) => void;
}

export const ConfigPanelExtras: React.FC<ConfigPanelExtrasProps> = ({
    studentInfo,
    borderStyle,
    zoom,
    onStudentInfoChange,
    onBorderStyleChange,
    onZoomChange,
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            marginTop: 'var(--space-lg)',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--color-border)',
        }}>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                {t('editor.paperSettings')}
            </h4>

            {/* Zoom control */}
            <div className="form-group">
                <label className="label flex items-center justify-between">
                    <span>{t('editor.zoom')}</span>
                    <span className="text-ink-muted">{Math.round(zoom * 100)}%</span>
                </label>
                <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={zoom}
                    onChange={e => onZoomChange(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Border style */}
            <Select
                label={t('editor.borderStyle')}
                value={borderStyle}
                onChange={e => onBorderStyleChange(e.target.value as BorderStyle)}
                options={[
                    { value: 'none', label: t('borders.none') },
                    { value: 'simple', label: t('borders.simple') },
                    { value: 'double', label: t('borders.double') },
                    { value: 'dotted', label: t('borders.dotted') },
                    { value: 'decorative', label: t('borders.decorative') },
                    { value: 'elegant', label: t('borders.elegant') },
                ]}
            />

            {/* Student info section */}
            <div className="form-group">
                <Checkbox
                    label={t('editor.showStudentInfo')}
                    checked={studentInfo.showStudentInfo}
                    onChange={e => onStudentInfoChange({ ...studentInfo, showStudentInfo: e.target.checked })}
                />

                {studentInfo.showStudentInfo && (
                    <div style={{
                        marginLeft: 'var(--space-lg)',
                        marginTop: 'var(--space-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-xs)',
                    }}>
                        <Checkbox
                            label={t('studentInfo.name')}
                            checked={studentInfo.showName}
                            onChange={e => onStudentInfoChange({ ...studentInfo, showName: e.target.checked })}
                        />
                        <Checkbox
                            label={t('studentInfo.class')}
                            checked={studentInfo.showClass}
                            onChange={e => onStudentInfoChange({ ...studentInfo, showClass: e.target.checked })}
                        />
                        <Checkbox
                            label={t('studentInfo.date')}
                            checked={studentInfo.showDate}
                            onChange={e => onStudentInfoChange({ ...studentInfo, showDate: e.target.checked })}
                        />
                        <Checkbox
                            label={t('studentInfo.score')}
                            checked={studentInfo.showScore}
                            onChange={e => onStudentInfoChange({ ...studentInfo, showScore: e.target.checked })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
