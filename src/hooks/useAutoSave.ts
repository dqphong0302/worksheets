import { useEffect, useCallback, useRef } from 'react';
import { saveEditorState, getEditorState } from '../services/storageService';

/**
 * Auto-save hook with debounce
 * Automatically saves state to localStorage and restores on mount
 */
export function useAutoSave<T extends Record<string, unknown>>(
    moduleType: string,
    state: T,
    setState: (state: T) => void,
    debounceMs: number = 1000
) {
    const isInitialized = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Restore state on mount
    useEffect(() => {
        if (!isInitialized.current) {
            const saved = getEditorState<T>(moduleType);
            if (saved) {
                // Remove lastModified from the restored state
                const { lastModified, ...restoredState } = saved as T & { lastModified?: string };
                setState(restoredState as T);
            }
            isInitialized.current = true;
        }
    }, [moduleType, setState]);

    // Auto-save with debounce
    useEffect(() => {
        if (!isInitialized.current) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            saveEditorState(moduleType, state);
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [moduleType, state, debounceMs]);

    // Force save function
    const forceSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        saveEditorState(moduleType, state);
    }, [moduleType, state]);

    return { forceSave };
}

/**
 * Simple hook that just loads initial state from localStorage
 */
export function useLoadSavedState<T extends Record<string, unknown>>(
    moduleType: string,
    defaultState: T
): T {
    const saved = getEditorState<T>(moduleType);
    if (saved) {
        const { lastModified, ...restoredState } = saved as T & { lastModified?: string };
        return { ...defaultState, ...restoredState } as T;
    }
    return defaultState;
}
