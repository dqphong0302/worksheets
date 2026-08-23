import { BingoConfig, BingoResult, BingoCard } from '../../types';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function generateBingo(config: BingoConfig): BingoResult {
    const { gridSize = 5, words = [], cardCount = 6, hasFreeSpace = true, freeSpaceText = '★ FREE' } = config;
    const cleanWords = words.map(w => w.trim()).filter(w => w.length > 0);

    // If not enough words, fill with generic terms
    const totalCells = gridSize * gridSize;
    const requiredPoolSize = hasFreeSpace && gridSize % 2 === 1 ? totalCells - 1 : totalCells;

    const fullPool = [...cleanWords];
    if (fullPool.length < requiredPoolSize) {
        for (let i = fullPool.length + 1; i <= requiredPoolSize; i++) {
            fullPool.push(`Item ${i}`);
        }
    }

    const cards: BingoCard[] = [];
    const mid = Math.floor(gridSize / 2);

    for (let c = 1; c <= cardCount; c++) {
        const shuffled = shuffleArray(fullPool);
        let wordIdx = 0;
        const grid: string[][] = [];

        for (let r = 0; r < gridSize; r++) {
            const row: string[] = [];
            for (let col = 0; col < gridSize; col++) {
                if (hasFreeSpace && gridSize % 2 === 1 && r === mid && col === mid) {
                    row.push(freeSpaceText || '★ FREE');
                } else {
                    row.push(shuffled[wordIdx] || `Word ${wordIdx + 1}`);
                    wordIdx++;
                }
            }
            grid.push(row);
        }

        cards.push({ id: c, grid });
    }

    return {
        cards,
        callerList: [...fullPool],
    };
}

export function getDefaultBingoConfig(): BingoConfig {
    return {
        title: 'Lớp Học Vui Nhộn - Classroom Bingo',
        paperSize: 'a4',
        showAnswerKey: true,
        fontSize: 13,
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
        gridSize: 5,
        cardCount: 6,
        hasFreeSpace: true,
        freeSpaceText: '★ BINGO',
        words: [
            'Apple 🍎', 'Banana 🍌', 'Orange 🍊', 'Grape 🍇', 'Watermelon 🍉',
            'Cat 🐱', 'Dog 🐶', 'Rabbit 🐰', 'Panda 🐼', 'Lion 🦁',
            'Book 📚', 'Pencil ✏️', 'Ruler 📏', 'School 🏫', 'Teacher 👩‍🏫',
            'Sun ☀️', 'Moon 🌙', 'Star ⭐', 'Cloud ☁️', 'Rainbow 🌈',
            'Car 🚗', 'Bus 🚌', 'Airplane ✈️', 'Train 🚆', 'Bicycle 🚲',
            'Guitar 🎸', 'Piano 🎹', 'Soccer ⚽', 'Basketball 🏀', 'Music 🎵'
        ],
    };
}
