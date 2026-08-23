import { SudokuConfig, SudokuResult, SudokuPuzzle, SudokuSize, SudokuTheme } from '../../types';

const THEME_SYMBOLS: Record<SudokuTheme, string[]> = {
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    animals: ['🐱', '🐶', '🐰', '🐼', '🦁', '🐵', '🦊', '🐸', '🐨'],
    fruits: ['🍎', '🍌', '🍊', '🍇', '🍉', '🍓', '🍒', '🍍', '🥑'],
    shapes: ['▲', '■', '●', '★', '◆', '♥', '♣', '♠', '✦'],
};

// Solve Sudoku helper to ensure validity
function solve(grid: number[][], size: SudokuSize, boxRows: number, boxCols: number): boolean {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) {
                const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
                for (const n of nums) {
                    if (isValid(grid, r, c, n, size, boxRows, boxCols)) {
                        grid[r][c] = n;
                        if (solve(grid, size, boxRows, boxCols)) return true;
                        grid[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isValid(grid: number[][], row: number, col: number, num: number, size: SudokuSize, boxRows: number, boxCols: number): boolean {
    // Check row
    for (let c = 0; c < size; c++) {
        if (grid[row][c] === num) return false;
    }
    // Check col
    for (let r = 0; r < size; r++) {
        if (grid[r][col] === num) return false;
    }
    // Check box
    const startRow = Math.floor(row / boxRows) * boxRows;
    const startCol = Math.floor(col / boxCols) * boxCols;
    for (let r = 0; r < boxRows; r++) {
        for (let c = 0; c < boxCols; c++) {
            if (grid[startRow + r][startCol + c] === num) return false;
        }
    }
    return true;
}

export function generateSudoku(config: SudokuConfig): SudokuResult {
    const { size = 4, theme = 'animals', difficulty = 'easy', puzzlesPerPage = 2 } = config;
    const boxRows = size === 4 ? 2 : size === 6 ? 2 : 3;
    const boxCols = size === 4 ? 2 : size === 6 ? 3 : 3;

    const puzzles: SudokuPuzzle[] = [];

    for (let p = 0; p < puzzlesPerPage; p++) {
        // Step 1: Generate full solved board
        const solvedGrid: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
        solve(solvedGrid, size, boxRows, boxCols);

        // Step 2: Carve holes based on difficulty
        const initialGrid: (number | null)[][] = solvedGrid.map(row => [...row]);
        const totalCells = size * size;
        let removeCount = Math.floor(totalCells * 0.4); // easy

        if (difficulty === 'medium') {
            removeCount = Math.floor(totalCells * 0.55);
        } else if (difficulty === 'hard') {
            removeCount = Math.floor(totalCells * 0.65);
        }

        const positions: Array<{ r: number; c: number }> = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                positions.push({ r, c });
            }
        }
        positions.sort(() => Math.random() - 0.5);

        for (let i = 0; i < removeCount && i < positions.length; i++) {
            const { r, c } = positions[i];
            initialGrid[r][c] = null;
        }

        puzzles.push({
            initialGrid,
            solutionGrid: solvedGrid,
            symbolMap: THEME_SYMBOLS[theme] || THEME_SYMBOLS.numbers,
        });
    }

    return { puzzles };
}

export function getDefaultSudokuConfig(): SudokuConfig {
    return {
        title: 'Sudoku Trí Tuệ Thiếu Nhi - Kids Visual Sudoku',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 14,
        font: 'Inter',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        size: 4,
        theme: 'animals',
        difficulty: 'easy',
        puzzlesPerPage: 2,
    };
}
