import { WordSearchConfig, WordSearchResult, WordSearchPlacement } from '../../types';

const DIRECTIONS = [
    { row: 0, col: 1 },   // right
    { row: 1, col: 0 },   // down
    { row: 1, col: 1 },   // diagonal down-right
    { row: -1, col: 1 },  // diagonal up-right
];

const REVERSE_DIRECTIONS = [
    { row: 0, col: -1 },  // left
    { row: -1, col: 0 },  // up
    { row: -1, col: -1 }, // diagonal up-left
    { row: 1, col: -1 },  // diagonal down-left
];

function getRandomLetter(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function canPlaceWord(
    grid: string[][],
    word: string,
    startRow: number,
    startCol: number,
    direction: { row: number; col: number }
): boolean {
    const size = grid.length;

    for (let i = 0; i < word.length; i++) {
        const row = startRow + i * direction.row;
        const col = startCol + i * direction.col;

        if (row < 0 || row >= size || col < 0 || col >= size) {
            return false;
        }

        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
            return false;
        }
    }

    return true;
}

function placeWord(
    grid: string[][],
    word: string,
    startRow: number,
    startCol: number,
    direction: { row: number; col: number }
): void {
    for (let i = 0; i < word.length; i++) {
        const row = startRow + i * direction.row;
        const col = startCol + i * direction.col;
        grid[row][col] = word[i];
    }
}

export function generateWordSearch(config: WordSearchConfig): WordSearchResult {
    const { words, gridSize, allowDiagonal, allowReverse, uppercase } = config;

    // Initialize empty grid
    const grid: string[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill(''));

    const placements: WordSearchPlacement[] = [];

    // Build direction options
    let directions = [...DIRECTIONS.slice(0, 2)]; // Always include right and down
    if (allowDiagonal) {
        directions.push(...DIRECTIONS.slice(2));
    }
    if (allowReverse) {
        directions.push(...REVERSE_DIRECTIONS.slice(0, 2));
        if (allowDiagonal) {
            directions.push(...REVERSE_DIRECTIONS.slice(2));
        }
    }

    // Sort words by length (longest first for better placement)
    const sortedWords = [...words]
        .map(w => uppercase ? w.toUpperCase() : w.toLowerCase())
        .filter(w => w.length > 0 && w.length <= gridSize)
        .sort((a, b) => b.length - a.length);

    // Try to place each word
    for (const word of sortedWords) {
        let placed = false;
        const shuffledDirections = shuffleArray(directions);

        // Try random positions
        const positions: Array<{ row: number; col: number }> = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                positions.push({ row: r, col: c });
            }
        }
        const shuffledPositions = shuffleArray(positions);

        for (const pos of shuffledPositions) {
            if (placed) break;

            for (const dir of shuffledDirections) {
                if (canPlaceWord(grid, word, pos.row, pos.col, dir)) {
                    placeWord(grid, word, pos.row, pos.col, dir);
                    placements.push({
                        word,
                        startRow: pos.row,
                        startCol: pos.col,
                        direction: dir,
                    });
                    placed = true;
                    break;
                }
            }
        }
    }

    // Fill empty cells with random letters
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
                let letter = getRandomLetter();
                if (!uppercase) {
                    letter = letter.toLowerCase();
                }
                grid[r][c] = letter;
            }
        }
    }

    return { grid, placements };
}

// Default config
export function getDefaultWordSearchConfig(): WordSearchConfig {
    return {
        title: 'Word Search',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 14,
        font: 'Arial',
        studentInfo: {
            showStudentInfo: true,
            showName: true,
            showClass: true,
            showDate: true,
            showScore: false,
        },
        borderStyle: 'none',
        zoom: 0.55,
        worksheetLanguage: 'en',
        words: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'LEMON', 'BERRY', 'PEACH'],
        gridSize: 12,
        allowDiagonal: true,
        allowReverse: false,
        uppercase: true,
    };
}

