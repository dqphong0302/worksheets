import { useState, useCallback, useRef } from 'react';
import { HistoryState } from '../types';

export function useUndoRedo<T>(initialState: T) {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    const historyRef = useRef(history);
    historyRef.current = history;

    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        setHistory(prev => {
            const actualNewState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(prev.present)
                : newState;

            return {
                past: [...prev.past, prev.present],
                present: actualNewState,
                future: [],
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, -1);

            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            return {
                past: [...prev.past, prev.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const reset = useCallback((newState?: T) => {
        setHistory({
            past: [],
            present: newState ?? initialState,
            future: [],
        });
    }, [initialState]);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    return {
        state: history.present,
        setState,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
    };
}
