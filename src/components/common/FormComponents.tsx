import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    return (
        <button
            className={`btn btn-${variant} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
        </button>
    );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`input ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-danger text-sm mt-1">{error}</span>}
        </div>
    );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`;

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                className={`textarea ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-danger text-sm mt-1">{error}</span>}
        </div>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `select-${Math.random().toString(36).slice(2)}`;

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <select id={inputId} className={`select ${className}`} {...props}>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
        <label htmlFor={inputId} className={`checkbox-label ${className}`}>
            <input type="checkbox" id={inputId} {...props} />
            <span>{label}</span>
        </label>
    );
};

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    min?: number;
    max?: number;
    step?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    label,
    className = '',
    ...props
}) => {
    return (
        <Input label={label} type="number" className={className} {...props} />
    );
};
