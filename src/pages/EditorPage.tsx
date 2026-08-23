import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GeneratorType } from '../types';

// Import generator editors
import { CrosswordEditor } from '../generators/crossword/CrosswordEditor';
import { WordSearchEditor } from '../generators/wordSearch/WordSearchEditor';
import { MatchingEditor } from '../generators/matching/MatchingEditor';
import { WordScrambleEditor } from '../generators/wordScramble/WordScrambleEditor';
import { WordSearchImagesEditor } from '../generators/wordSearchImages/WordSearchImagesEditor';
import { MatchingImagesEditor } from '../generators/matchingImages/MatchingImagesEditor';
import { SpellingTestEditor } from '../generators/spellingTest/SpellingTestEditor';
import { WordTracerEditor } from '../generators/wordTracer/WordTracerEditor';
import { MathWorksheetEditor } from '../generators/mathWorksheet/MathWorksheetEditor';
import { FindIdenticalEditor } from '../generators/findIdentical/FindIdenticalEditor';
import { BingoEditor } from '../generators/bingo/BingoEditor';
import { FlashcardsEditor } from '../generators/flashcards/FlashcardsEditor';
import { CryptogramEditor } from '../generators/cryptogram/CryptogramEditor';
import { MazeEditor } from '../generators/maze/MazeEditor';
import { SudokuEditor } from '../generators/sudoku/SudokuEditor';

const EditorMap: Record<GeneratorType, React.FC<{ onHome: () => void }>> = {
    crossword: CrosswordEditor,
    wordSearch: WordSearchEditor,
    matching: MatchingEditor,
    wordScramble: WordScrambleEditor,
    wordSearchImages: WordSearchImagesEditor,
    matchingImages: MatchingImagesEditor,
    spellingTest: SpellingTestEditor,
    wordTracer: WordTracerEditor,
    mathWorksheet: MathWorksheetEditor,
    findIdentical: FindIdenticalEditor,
    bingo: BingoEditor,
    flashcards: FlashcardsEditor,
    cryptogram: CryptogramEditor,
    maze: MazeEditor,
    sudoku: SudokuEditor,
};

export const EditorPage: React.FC = () => {
    const { type } = useParams<{ type: GeneratorType }>();
    const navigate = useNavigate();

    const handleHome = () => {
        navigate('/');
    };

    if (!type || !EditorMap[type]) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen">
                <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">Module not found</h2>
                    <button className="btn btn-primary" onClick={handleHome}>
                        ← Go Home
                    </button>
                </div>
            </div>
        );
    }

    const EditorComponent = EditorMap[type];
    return <EditorComponent onHome={handleHome} />;
};
