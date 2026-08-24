/** Type surface for the PDUI ESM theme adapter (`pdui-theme.mjs`). */
export type PduiTheme = 'light' | 'dark';
export type PduiToastType = 'success' | 'error' | 'warning' | 'info';

export declare function subscribe(onChange: () => void): () => void;
export declare function getTheme(): PduiTheme;
export declare function setTheme(theme: PduiTheme): void;
export declare function toggleTheme(): void;
export declare function toast(message: string, type?: PduiToastType, duration?: number): void;
