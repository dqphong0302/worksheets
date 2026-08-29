# Worksheet Generator

A PWA (Progressive Web App) for teachers to create and export educational worksheets quickly.

## Features

- **15 Worksheet Generators:**
  - 📝 Crossword Puzzle
  - 🔍 Word Search
  - 🔗 Matching Lists
  - 🔀 Word Scramble
  - 🖼️ Word Search + Images
  - 📷 Matching + Images
  - ✍️ Spelling Test
  - ✏️ Word Tracer
  - ➕ Math Worksheet
  - 🃏 Find Identical Pairs
  - 🎯 Bingo
  - 📚 Flashcards
  - 🔐 Cryptogram
  - 🧩 Maze
  - 🔢 Sudoku

- **Live Preview** - See your worksheet as you configure it
- **Export Options** - PDF, PNG, DOCX formats
- **Template System** - Save and load templates
- **Bilingual** - Vietnamese and English support
- **PWA** - Works offline

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Technology Stack

- **React 19** + **TypeScript** + **Vite**
- **jsPDF** + **html2canvas** for high-resolution PDF/PNG export
- **docx** for Word document export
- **i18next** for internationalization
- **IndexedDB** for local storage

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/       # Form elements, Modal
│   ├── editor/       # Editor layout
│   ├── paper/        # Paper preview
│   └── toolbar/      # Toolbar with export
├── generators/       # 15 worksheet generators
├── pages/           # HomePage, EditorPage
├── services/        # Export, Storage
├── hooks/           # useUndoRedo
├── i18n/            # Translations (en/vi)
├── types/           # TypeScript types
└── utils/           # Validation utilities
```

## License

MIT
