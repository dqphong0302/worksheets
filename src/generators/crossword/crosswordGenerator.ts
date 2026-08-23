import { CrosswordConfig, CrosswordResult, CrosswordCell, CrosswordPlacement } from '../../types';

// Robust crossword placement and standard numbering algorithm
export function generateCrossword(config: CrosswordConfig): CrosswordResult {
    const { words, gridSize } = config;
    const grid: CrosswordCell[][] = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill(null).map(() => ({ letter: '', isBlack: true })));

    const placements: CrosswordPlacement[] = [];

    // Filter and sanitize words
    const validWords = words
        .map(w => ({ word: w.word.trim().replace(/\s+/g, '').toUpperCase(), clue: w.clue.trim() }))
        .filter(w => w.word.length > 0 && w.word.length <= gridSize);

    if (validWords.length === 0) {
        return { grid, placements, acrossClues: [], downClues: [] };
    }

    // Sort words by length (longest first)
    const sortedWords = [...validWords].sort((a, b) => b.word.length - a.word.length);

    // Place first word horizontally near center
    const first = sortedWords[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.max(0, Math.floor((gridSize - first.word.length) / 2));

    for (let i = 0; i < first.word.length; i++) {
        grid[startRow][startCol + i] = { letter: first.word[i], isBlack: false };
    }

    placements.push({
        word: first.word,
        clue: first.clue,
        row: startRow,
        col: startCol,
        direction: 'across',
        number: 1,
    });

    // Try to place remaining words
    for (let i = 1; i < sortedWords.length; i++) {
        const { word, clue } = sortedWords[i];
        let placed = false;

        // Try to find an intersection with existing placed letters
        for (let wi = 0; wi < word.length && !placed; wi++) {
            const letter = word[wi];

            for (let r = 0; r < gridSize && !placed; r++) {
                for (let c = 0; c < gridSize && !placed; c++) {
                    if (grid[r][c].letter === letter) {
                        // 1. Try vertical placement at this intersection
                        const vertStart = r - wi;
                        if (canPlaceWord(grid, word, vertStart, c, 'down', gridSize)) {
                            placeWordLetters(grid, word, vertStart, c, 'down');
                            placements.push({
                                word,
                                clue,
                                row: vertStart,
                                col: c,
                                direction: 'down',
                                number: 0, // Assigned in renumbering step
                            });
                            placed = true;
                        }

                        // 2. Try horizontal placement at this intersection
                        const horizStart = c - wi;
                        if (!placed && canPlaceWord(grid, word, r, horizStart, 'across', gridSize)) {
                            placeWordLetters(grid, word, r, horizStart, 'across');
                            placements.push({
                                word,
                                clue,
                                row: r,
                                col: horizStart,
                                direction: 'across',
                                number: 0,
                            });
                            placed = true;
                        }
                    }
                }
            }
        }
    }

    // Standard Crossword Renumbering:
    // Scan grid in standard reading order (row by row, column by column).
    // If a cell is the starting position of ANY placed word (Across or Down),
    // assign it the next sequential clue number and update the placement(s).
    let nextClueNumber = 1;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const startingPlacements = placements.filter(p => p.row === r && p.col === c);
            if (startingPlacements.length > 0) {
                const assignedNum = nextClueNumber++;
                grid[r][c].number = assignedNum;
                startingPlacements.forEach(p => {
                    p.number = assignedNum;
                });
            } else if (grid[r][c].letter !== '') {
                delete grid[r][c].number;
            }
        }
    }

    // Separate across and down clues and sort by number
    const acrossClues = placements.filter(p => p.direction === 'across').sort((a, b) => a.number - b.number);
    const downClues = placements.filter(p => p.direction === 'down').sort((a, b) => a.number - b.number);

    return { grid, placements, acrossClues, downClues };
}

function canPlaceWord(
    grid: CrosswordCell[][],
    word: string,
    startRow: number,
    startCol: number,
    direction: 'across' | 'down',
    gridSize: number
): boolean {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;

    // Check bounds
    if (startRow < 0 || startCol < 0) return false;
    if (direction === 'down' && startRow + word.length > gridSize) return false;
    if (direction === 'across' && startCol + word.length > gridSize) return false;

    // Check cell before word start (must be empty/edge)
    const beforeR = startRow - dr;
    const beforeC = startCol - dc;
    if (beforeR >= 0 && beforeR < gridSize && beforeC >= 0 && beforeC < gridSize) {
        if (grid[beforeR][beforeC].letter !== '') return false;
    }

    // Check cell after word end (must be empty/edge)
    const afterR = startRow + word.length * dr;
    const afterC = startCol + word.length * dc;
    if (afterR >= 0 && afterR < gridSize && afterC >= 0 && afterC < gridSize) {
        if (grid[afterR][afterC].letter !== '') return false;
    }

    let hasIntersection = false;

    // Check each cell along the word
    for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dr;
        const c = startCol + i * dc;
        const cell = grid[r][c];

        if (cell.letter !== '') {
            if (cell.letter !== word[i]) {
                return false; // Letter conflict
            }
            hasIntersection = true;
        } else {
            // Check adjacent parallel cells (no accidental parallel adjacent letters)
            if (direction === 'across') {
                if (r > 0 && grid[r - 1][c].letter !== '') return false;
                if (r < gridSize - 1 && grid[r + 1][c].letter !== '') return false;
            } else {
                if (c > 0 && grid[r][c - 1].letter !== '') return false;
                if (c < gridSize - 1 && grid[r][c + 1].letter !== '') return false;
            }
        }
    }

    return hasIntersection;
}

function placeWordLetters(
    grid: CrosswordCell[][],
    word: string,
    startRow: number,
    startCol: number,
    direction: 'across' | 'down'
): void {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;

    for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dr;
        const c = startCol + i * dc;
        grid[r][c] = {
            ...grid[r][c],
            letter: word[i],
            isBlack: false,
        };
    }
}

export function getDefaultCrosswordConfig(): CrosswordConfig {
    return {
        title: 'Crossword Puzzle',
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
        words: [
            { word: 'COMPUTER', clue: 'Thiết bị điện tử xử lý dữ liệu' },
            { word: 'MOUSE', clue: 'Con chuột điều khiển con trỏ máy tính' },
            { word: 'SCREEN', clue: 'Màn hình hiển thị hình ảnh' },
            { word: 'KEYBOARD', clue: 'Bàn phím dùng để nhập văn bản' },
            { word: 'PRINTER', clue: 'Máy in tài liệu ra giấy' },
        ],
        gridSize: 15,
    };
}
