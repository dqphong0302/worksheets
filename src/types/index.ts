// Generator Types
export type GeneratorType =
    | 'crossword'
    | 'wordSearch'
    | 'matching'
    | 'wordScramble'
    | 'wordSearchImages'
    | 'matchingImages'
    | 'spellingTest'
    | 'wordTracer'
    | 'mathWorksheet'
    | 'findIdentical'
    | 'bingo'
    | 'flashcards'
    | 'cryptogram'
    | 'maze'
    | 'sudoku';

export type PaperSize = 'a4' | 'letter';

export interface GeneratorModule {
    id: GeneratorType;
    nameKey: string;
    descriptionKey: string;
    icon: string;
    hasPlayMode?: boolean;
}

// Common Worksheet Config
export interface StudentInfo {
    showStudentInfo: boolean;
    showName: boolean;
    showClass: boolean;
    showDate: boolean;
    showScore: boolean;
}

export type BorderStyle = 'none' | 'simple' | 'double' | 'decorative' | 'dotted' | 'elegant';

export type WorksheetLanguage = 'en' | 'vi';

export interface BaseWorksheetConfig {
    title: string;
    subtitle?: string;
    paperSize: PaperSize;
    showAnswerKey: boolean;
    fontSize: number;
    font: string;
    studentInfo: StudentInfo;
    borderStyle: BorderStyle;
    zoom: number;
    worksheetLanguage?: WorksheetLanguage;
}

// Crossword
export interface CrosswordWord {
    word: string;
    clue: string;
}

export interface CrosswordConfig extends BaseWorksheetConfig {
    words: CrosswordWord[];
    gridSize: number;
}

export interface CrosswordCell {
    letter: string;
    number?: number;
    isBlack: boolean;
}

export interface CrosswordPlacement {
    word: string;
    clue: string;
    row: number;
    col: number;
    direction: 'across' | 'down';
    number: number;
}

export interface CrosswordResult {
    grid: CrosswordCell[][];
    placements: CrosswordPlacement[];
    acrossClues: CrosswordPlacement[];
    downClues: CrosswordPlacement[];
}

// Word Search
export interface WordSearchConfig extends BaseWorksheetConfig {
    words: string[];
    gridSize: number;
    allowDiagonal: boolean;
    allowReverse: boolean;
    uppercase: boolean;
}

export interface WordSearchPlacement {
    word: string;
    startRow: number;
    startCol: number;
    direction: { row: number; col: number };
}

export interface WordSearchResult {
    grid: string[][];
    placements: WordSearchPlacement[];
}

// Matching
export interface MatchingPair {
    left: string;
    right: string;
}

export interface MatchingConfig extends BaseWorksheetConfig {
    pairs: MatchingPair[];
    shuffleRight: boolean;
    connectorStyle: 'dots' | 'lines' | 'numbers';
}

export interface MatchingResult {
    leftItems: string[];
    rightItems: string[];
    shuffledRight: string[];
    answers: number[];
}

// Word Scramble
export interface WordScrambleConfig extends BaseWorksheetConfig {
    words: string[];
    showHints: boolean;
    hintType: 'firstLetter' | 'length' | 'none';
}

export interface WordScrambleResult {
    items: Array<{
        original: string;
        scrambled: string;
        hint?: string;
    }>;
}

// Word Search with Images
export interface WordSearchImageItem {
    word: string;
    imageUrl?: string;
    imageData?: string;
}

export interface WordSearchImagesConfig extends BaseWorksheetConfig {
    items: WordSearchImageItem[];
    gridSize: number;
    allowDiagonal: boolean;
    allowReverse: boolean;
    uppercase: boolean;
    showImagesBelow: boolean;
}

// Matching with Images
export interface MatchingImageItem {
    text: string;
    imageUrl?: string;
    imageData?: string;
}

export interface MatchingImagesConfig extends BaseWorksheetConfig {
    leftItems: MatchingImageItem[];
    rightItems: MatchingImageItem[];
    leftHasImages: boolean;
    rightHasImages: boolean;
    shuffleRight: boolean;
}

// Spelling Test
export interface SpellingTestConfig extends BaseWorksheetConfig {
    words: string[];
    columns: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    showNumbers: boolean;
}

export interface SpellingTestResult {
    items: Array<{
        number: number;
        word: string;
    }>;
}

// Word Tracer
export interface WordTracerConfig extends BaseWorksheetConfig {
    text: string;
    style: 'dotted' | 'faded' | 'outline';
    lineHeight: number;
    showGuideLines: boolean;
    repetitions: number;
}

// Math Worksheet
export type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide';
export type MathLayout = 'horizontal' | 'vertical';

export interface MathWorksheetConfig extends BaseWorksheetConfig {
    operations: MathOperation[];
    minNumber: number;
    maxNumber: number;
    problemCount: number;
    layout: MathLayout;
    allowCarry: boolean;
    allowBorrow: boolean;
    columns: number;
}

export interface MathProblem {
    num1: number;
    num2: number;
    operation: MathOperation;
    answer: number;
}

export interface MathWorksheetResult {
    problems: MathProblem[];
}

// Bingo Game
export type BingoGridSize = 3 | 4 | 5;

export interface BingoConfig extends BaseWorksheetConfig {
    gridSize: BingoGridSize;
    words: string[];
    cardCount: number;
    hasFreeSpace: boolean;
    freeSpaceText: string;
    customThemeColor?: string;
}

export interface BingoCard {
    id: number;
    grid: string[][];
}

export interface BingoResult {
    cards: BingoCard[];
    callerList: string[];
}

// Flashcards
export type FlashcardAIStyle = '3d_pixar' | 'vector_flat' | 'kawaii_anime' | 'photo' | 'coloring';

export interface FlashcardItem {
    id: string;
    frontText: string;
    backText: string;
    frontSub?: string;
    backSub?: string;
    iconOrEmoji?: string;
    imageData?: string;
    imageUrl?: string;
    imagePrompt?: string;
    partOfSpeech?: string; // n, v, adj, adv
    ipa?: string; // /'æpl/
    exampleEn?: string;
    exampleVi?: string;
    category?: string;
    level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

export interface FlashcardsConfig extends BaseWorksheetConfig {
    items: FlashcardItem[];
    cardLayout: 'fold' | 'doubleSided' | 'grid';
    cardsPerPage: 4 | 6 | 8;
    showCutLines: boolean;
    showImages: boolean;
    showIpa: boolean;
    showExamples: boolean;
    aiStyle: FlashcardAIStyle;
}

// Cryptogram / Secret Code
export type CipherType = 'numbers' | 'emojis' | 'shapes' | 'caesar';

export interface CryptogramConfig extends BaseWorksheetConfig {
    secretMessage: string;
    cipherType: CipherType;
    hintLettersCount: number;
    showDecoderKeyTable: boolean;
}

export interface CryptogramResult {
    encodedMessage: string[];
    keyMap: Record<string, string>; // letter -> symbol
    revealedHints: Record<string, boolean>;
}

// Maze Generator
export type MazeDifficulty = 'easy' | 'medium' | 'hard';

export interface MazeConfig extends BaseWorksheetConfig {
    difficulty: MazeDifficulty;
    width: number;
    height: number;
    startEmoji: string;
    goalEmoji: string;
    checkpointWord?: string;
    showSolutionPath: boolean;
}

export interface MazeCell {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
    visited: boolean;
    checkpointLetter?: string;
    isSolution?: boolean;
}

export interface MazeResult {
    grid: MazeCell[][];
    start: { r: number; c: number };
    goal: { r: number; c: number };
    solutionPath: Array<{ r: number; c: number }>;
}

// Sudoku
export type SudokuSize = 4 | 6 | 9;
export type SudokuTheme = 'numbers' | 'animals' | 'fruits' | 'shapes';
export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

export interface SudokuConfig extends BaseWorksheetConfig {
    size: SudokuSize;
    theme: SudokuTheme;
    difficulty: SudokuDifficulty;
    puzzlesPerPage: 1 | 2 | 4;
}

export interface SudokuPuzzle {
    initialGrid: (number | null)[][];
    solutionGrid: number[][];
    symbolMap: string[]; // for emoji or number rendering
}

export interface SudokuResult {
    puzzles: SudokuPuzzle[];
}

// Template
export interface WorksheetTemplate {
    id: string;
    name: string;
    type: GeneratorType;
    config: any;
    createdAt: string;
    updatedAt: string;
}

// Undo/Redo
export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

// Export
export type ExportFormat = 'pdf' | 'png' | 'docx';

export interface ExportOptions {
    format: ExportFormat;
    includeAnswerKey: boolean;
    filename?: string;
}
