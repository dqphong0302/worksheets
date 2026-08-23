import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { WorksheetTemplate } from '../types';

interface WorksheetDB extends DBSchema {
    templates: {
        key: string;
        value: WorksheetTemplate;
        indexes: { 'by-type': string };
    };
    images: {
        key: string;
        value: {
            id: string;
            data: string; // base64
            name: string;
            createdAt: string;
        };
    };
}

let db: IDBPDatabase<WorksheetDB> | null = null;

async function getDB(): Promise<IDBPDatabase<WorksheetDB>> {
    if (db) return db;

    db = await openDB<WorksheetDB>('worksheet-generator', 1, {
        upgrade(database) {
            // Templates store
            const templateStore = database.createObjectStore('templates', { keyPath: 'id' });
            templateStore.createIndex('by-type', 'type');

            // Images store
            database.createObjectStore('images', { keyPath: 'id' });
        },
    });

    return db;
}

// Template operations
export async function saveTemplate(template: WorksheetTemplate): Promise<void> {
    const database = await getDB();
    await database.put('templates', template);
}

export async function getTemplate(id: string): Promise<WorksheetTemplate | undefined> {
    const database = await getDB();
    return database.get('templates', id);
}

export async function getAllTemplates(): Promise<WorksheetTemplate[]> {
    const database = await getDB();
    return database.getAll('templates');
}

export async function getTemplatesByType(type: string): Promise<WorksheetTemplate[]> {
    const database = await getDB();
    return database.getAllFromIndex('templates', 'by-type', type);
}

export async function deleteTemplate(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('templates', id);
}

// Image operations
export async function saveImage(id: string, data: string, name: string): Promise<void> {
    const database = await getDB();
    await database.put('images', {
        id,
        data,
        name,
        createdAt: new Date().toISOString(),
    });
}

export async function getImage(id: string): Promise<string | undefined> {
    const database = await getDB();
    const image = await database.get('images', id);
    return image?.data;
}

export async function deleteImage(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('images', id);
}

// Settings (localStorage)
const SETTINGS_KEY = 'worksheet-settings';

export interface AppSettings {
    theme: 'light' | 'dark';
    language: 'en' | 'vi';
    defaultPaperSize: 'a4' | 'letter';
    defaultFontSize: number;
}

const defaultSettings: AppSettings = {
    theme: 'light',
    language: 'vi',
    defaultPaperSize: 'a4',
    defaultFontSize: 14,
};

export function getSettings(): AppSettings {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            return { ...defaultSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return defaultSettings;
}

export function saveSettings(settings: Partial<AppSettings>): void {
    try {
        const current = getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// Export/Import templates as JSON
export function exportTemplatesAsJSON(templates: WorksheetTemplate[]): string {
    return JSON.stringify(templates, null, 2);
}

export function importTemplatesFromJSON(json: string): WorksheetTemplate[] {
    try {
        const templates = JSON.parse(json);
        if (!Array.isArray(templates)) {
            return [templates];
        }
        return templates;
    } catch (e) {
        console.error('Failed to parse templates JSON:', e);
        return [];
    }
}

// Editor State Persistence (localStorage)
const EDITOR_STATE_PREFIX = 'worksheet-editor-';

export interface EditorState {
    [key: string]: unknown;
    lastModified: string;
}

/**
 * Save editor state for a specific module type
 */
export function saveEditorState(moduleType: string, state: object): void {
    try {
        const data: EditorState = {
            ...state,
            lastModified: new Date().toISOString(),
        };
        localStorage.setItem(`${EDITOR_STATE_PREFIX}${moduleType}`, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save editor state for ${moduleType}:`, e);
    }
}

/**
 * Get saved editor state for a specific module type
 */
export function getEditorState<T>(moduleType: string): (T & { lastModified?: string }) | null {
    try {
        const saved = localStorage.getItem(`${EDITOR_STATE_PREFIX}${moduleType}`);
        if (saved) {
            return JSON.parse(saved) as T & { lastModified?: string };
        }
    } catch (e) {
        console.error(`Failed to load editor state for ${moduleType}:`, e);
    }
    return null;
}

/**
 * Clear editor state for a specific module type
 */
export function clearEditorState(moduleType: string): void {
    try {
        localStorage.removeItem(`${EDITOR_STATE_PREFIX}${moduleType}`);
    } catch (e) {
        console.error(`Failed to clear editor state for ${moduleType}:`, e);
    }
}

/**
 * Get all saved editor states
 */
export function getAllEditorStates(): Record<string, EditorState> {
    const states: Record<string, EditorState> = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(EDITOR_STATE_PREFIX)) {
                const moduleType = key.replace(EDITOR_STATE_PREFIX, '');
                const data = localStorage.getItem(key);
                if (data) {
                    states[moduleType] = JSON.parse(data);
                }
            }
        }
    } catch (e) {
        console.error('Failed to get all editor states:', e);
    }
    return states;
}
