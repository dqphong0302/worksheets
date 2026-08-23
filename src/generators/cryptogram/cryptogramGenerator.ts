import { CryptogramConfig, CryptogramResult, CipherType } from '../../types';

const EMOJI_CIPHER = [
    '🍎', '🍌', '🥕', '🍩', '🥑', '🦊', '🍇', '🍯', '🍦', '🍒',
    '🥝', '🍋', '🍉', '🥜', '🍊', '🍍', '🧀', '🍓', '🍅', '🍇',
    '🍄', '🌽', '🥨', '🍪', '🥞', '🍫'
];

const SHAPE_CIPHER = [
    '▲', '▼', '◆', '◈', '◉', '■', '□', '●', '○', '★',
    '☆', '✦', '✧', '♠', '♣', '♥', '♦', '☼', '☽', '☿',
    '♀', '♂', '♃', '♄', '♅', '♆'
];

export function generateCryptogram(config: CryptogramConfig): CryptogramResult {
    const { secretMessage = 'KNOWLEDGE IS POWER', cipherType = 'numbers', hintLettersCount = 2 } = config;
    const cleanMsg = secretMessage.toUpperCase();

    // Map letters A-Z to cipher symbols
    const keyMap: Record<string, string> = {};
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i];
        if (cipherType === 'numbers') {
            keyMap[letter] = (i + 1).toString();
        } else if (cipherType === 'emojis') {
            keyMap[letter] = EMOJI_CIPHER[i] || `${i + 1}`;
        } else if (cipherType === 'shapes') {
            keyMap[letter] = SHAPE_CIPHER[i] || `${i + 1}`;
        } else {
            // Caesar shift +3
            const shiftedIndex = (i + 3) % 26;
            keyMap[letter] = alphabet[shiftedIndex];
        }
    }

    // Pick distinct letters present in message for hints
    const distinctLettersInMsg = Array.from(new Set(cleanMsg.replace(/[^A-Z]/g, '').split('')));
    const revealedHints: Record<string, boolean> = {};

    for (let i = 0; i < Math.min(hintLettersCount, distinctLettersInMsg.length); i++) {
        revealedHints[distinctLettersInMsg[i]] = true;
    }

    const encodedMessage = cleanMsg.split('').map(char => {
        if (/[A-Z]/.test(char)) {
            return keyMap[char] || char;
        }
        return char;
    });

    return {
        encodedMessage,
        keyMap,
        revealedHints,
    };
}

export function getDefaultCryptogramConfig(): CryptogramConfig {
    return {
        title: 'Mật Mã Giải Đố - Secret Code Decoder',
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
        secretMessage: 'HOC TAP LA CHIA KHOA DEN THANH CONG',
        cipherType: 'numbers',
        hintLettersCount: 2,
        showDecoderKeyTable: true,
    };
}
