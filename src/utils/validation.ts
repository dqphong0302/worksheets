export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Validate a list of words
export function validateWords(
    words: string[],
    options: {
        minCount?: number;
        maxLength?: number;
        allowDuplicates?: boolean;
        allowSpecialChars?: boolean;
    } = {}
): ValidationResult {
    const {
        minCount = 1,
        maxLength = 20,
        allowDuplicates = false,
        allowSpecialChars = false,
    } = options;

    const errors: string[] = [];
    const seen = new Set<string>();

    if (words.length < minCount) {
        errors.push(`Cần ít nhất ${minCount} từ`);
    }

    const validCharPattern = allowSpecialChars
        ? /^[\p{L}\p{N}\s-]+$/u
        : /^[\p{L}\p{N}]+$/u;

    for (const word of words) {
        const trimmed = word.trim();

        if (!trimmed) continue;

        // Check for duplicates
        const normalized = trimmed.toLowerCase();
        if (!allowDuplicates && seen.has(normalized)) {
            errors.push(`Từ trùng lặp: "${trimmed}"`);
        }
        seen.add(normalized);

        // Check length
        if (trimmed.length > maxLength) {
            errors.push(`Từ quá dài: "${trimmed}" (tối đa ${maxLength} ký tự)`);
        }

        // Check for invalid characters
        if (!validCharPattern.test(trimmed)) {
            errors.push(`Ký tự không hợp lệ trong: "${trimmed}"`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Validate matching pairs
export function validatePairs(
    pairs: Array<{ left: string; right: string }>,
    options: {
        minCount?: number;
        maxLength?: number;
    } = {}
): ValidationResult {
    const { minCount = 2, maxLength = 50 } = options;
    const errors: string[] = [];

    if (pairs.length < minCount) {
        errors.push(`Cần ít nhất ${minCount} cặp`);
    }

    const leftSeen = new Set<string>();
    const rightSeen = new Set<string>();

    for (const pair of pairs) {
        const left = pair.left.trim();
        const right = pair.right.trim();

        if (!left || !right) {
            errors.push('Cặp không được để trống');
            continue;
        }

        if (left.length > maxLength) {
            errors.push(`Phần trái quá dài: "${left}"`);
        }

        if (right.length > maxLength) {
            errors.push(`Phần phải quá dài: "${right}"`);
        }

        if (leftSeen.has(left.toLowerCase())) {
            errors.push(`Phần trái trùng lặp: "${left}"`);
        }
        leftSeen.add(left.toLowerCase());

        if (rightSeen.has(right.toLowerCase())) {
            errors.push(`Phần phải trùng lặp: "${right}"`);
        }
        rightSeen.add(right.toLowerCase());
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Validate crossword entries
export function validateCrosswordEntries(
    entries: Array<{ word: string; clue: string }>,
    options: {
        minCount?: number;
        maxWordLength?: number;
    } = {}
): ValidationResult {
    const { minCount = 2, maxWordLength = 15 } = options;
    const errors: string[] = [];

    if (entries.length < minCount) {
        errors.push(`Cần ít nhất ${minCount} từ`);
    }

    const seen = new Set<string>();

    for (const entry of entries) {
        const word = entry.word.trim().toUpperCase();
        const clue = entry.clue.trim();

        if (!word) {
            errors.push('Từ không được để trống');
            continue;
        }

        if (!clue) {
            errors.push(`Thiếu gợi ý cho từ: "${word}"`);
        }

        if (word.length > maxWordLength) {
            errors.push(`Từ quá dài: "${word}" (tối đa ${maxWordLength} ký tự)`);
        }

        // Only allow letters
        if (!/^[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]+$/u.test(word)) {
            errors.push(`Từ chỉ được chứa chữ cái: "${word}"`);
        }

        if (seen.has(word)) {
            errors.push(`Từ trùng lặp: "${word}"`);
        }
        seen.add(word);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Validate math worksheet options
export function validateMathOptions(
    options: {
        minNumber: number;
        maxNumber: number;
        problemCount: number;
        operations: string[];
    }
): ValidationResult {
    const errors: string[] = [];

    if (options.minNumber < 0) {
        errors.push('Số nhỏ nhất phải >= 0');
    }

    if (options.maxNumber <= options.minNumber) {
        errors.push('Số lớn nhất phải lớn hơn số nhỏ nhất');
    }

    if (options.problemCount < 1 || options.problemCount > 100) {
        errors.push('Số câu hỏi phải từ 1-100');
    }

    if (options.operations.length === 0) {
        errors.push('Phải chọn ít nhất một phép tính');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Parse textarea input to array of words
export function parseWords(text: string): string[] {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Parse textarea input to pairs (format: "left | right")
export function parsePairs(text: string): Array<{ left: string; right: string }> {
    return text
        .split('\n')
        .map(line => {
            const [left, right] = line.split('|').map(s => s.trim());
            return { left: left || '', right: right || '' };
        })
        .filter(pair => pair.left && pair.right);
}

// Parse crossword entries (format: "word | clue")
export function parseCrosswordEntries(text: string): Array<{ word: string; clue: string }> {
    return text
        .split('\n')
        .map(line => {
            const [word, clue] = line.split('|').map(s => s.trim());
            return { word: word || '', clue: clue || '' };
        })
        .filter(entry => entry.word && entry.clue);
}
