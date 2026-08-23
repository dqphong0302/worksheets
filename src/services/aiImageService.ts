import { FlashcardAIStyle } from '../types';

export const AI_STYLE_PRESETS: Record<FlashcardAIStyle, { labelVi: string; labelEn: string; icon: string; promptModifier: string; model: string }> = {
    '3d_pixar': {
        labelVi: '🎨 Hoạt hình 3D Pixar / Disney',
        labelEn: '🎨 3D Pixar / Disney Animation',
        icon: '🧸',
        promptModifier: 'cute 3D Pixar Disney style character, vibrant lighting, smooth render, isolated on clean pure white background, high resolution, educational children illustration',
        model: 'flux',
    },
    'vector_flat': {
        labelVi: '🖌️ Tranh Vector Flat hiện đại',
        labelEn: '🖌️ Modern Flat Vector',
        icon: '📐',
        promptModifier: 'modern flat vector illustration, clean lines, minimalist, colorful, isolated on clean white background, educational icon clipart',
        model: 'flux',
    },
    'kawaii_anime': {
        labelVi: '🌸 Phong cách Kawaii / Anime dễ thương',
        labelEn: '🌸 Cute Kawaii Anime',
        icon: '✨',
        promptModifier: 'cute kawaii anime illustration, cheerful expressive, pastel colors, clean white background, high quality visual',
        model: 'flux-anime',
    },
    'photo': {
        labelVi: '📸 Ảnh chụp thực tế sắc nét',
        labelEn: '📸 Realistic Studio Photo',
        icon: '📷',
        promptModifier: 'studio product photography, sharp focus, clear detail, pure white background, professional lighting',
        model: 'flux-realism',
    },
    'coloring': {
        labelVi: '🖍️ Tranh nét vẽ đen trắng cho bé tô màu',
        labelEn: '🖍️ Kids Coloring Line Art',
        icon: '✏️',
        promptModifier: 'black and white coloring book page line art for kids, thick bold clean outlines, no shading, white background',
        model: 'flux',
    },
};

/**
 * Generate a direct AI image URL using Pollinations AI (free, instant, no key required)
 */
export function generateAIImageUrl(word: string, style: FlashcardAIStyle = '3d_pixar', customExtraPrompt?: string): string {
    const preset = AI_STYLE_PRESETS[style] || AI_STYLE_PRESETS['3d_pixar'];
    const cleanWord = word.trim().toLowerCase();
    
    const fullPrompt = `${cleanWord}, ${customExtraPrompt ? customExtraPrompt + ', ' : ''}${preset.promptModifier}`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const seed = Math.abs(cleanWord.split('').reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7)) % 10000;

    // Use fast pollination endpoint with cache seed
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true&model=${preset.model}&enhance=false`;
}

/**
 * Quick SVG icons / illustrations for instant offline preview & fallback
 */
export const POPULAR_VOCAB_VISUALS: Record<string, { emoji: string; category: string; ipa: string; vi: string; pos: string; example: string }> = {
    'apple': { emoji: '🍎', category: 'Fruits', ipa: '/ˈæpl/', vi: 'Quả táo', pos: 'noun', example: 'An apple a day keeps the doctor away.' },
    'banana': { emoji: '🍌', category: 'Fruits', ipa: '/bəˈnænə/', vi: 'Quả chuối', pos: 'noun', example: 'Monkeys love eating ripe yellow bananas.' },
    'cat': { emoji: '🐱', category: 'Animals', ipa: '/kæt/', vi: 'Con mèo', pos: 'noun', example: 'The cute cat is sleeping on the warm sofa.' },
    'dog': { emoji: '🐶', category: 'Animals', ipa: '/dɒɡ/', vi: 'Con chó', pos: 'noun', example: 'The friendly dog wags its tail happily.' },
    'elephant': { emoji: '🐘', category: 'Animals', ipa: '/ˈelɪfənt/', vi: 'Con voi', pos: 'noun', example: 'The giant elephant has large ears and a long trunk.' },
    'sun': { emoji: '☀️', category: 'Nature', ipa: '/sʌn/', vi: 'Mặt trời', pos: 'noun', example: 'The bright sun warms the green earth.' },
    'moon': { emoji: '🌙', category: 'Nature', ipa: '/muːn/', vi: 'Mặt trăng', pos: 'noun', example: 'The silver moon shines brightly in the night sky.' },
    'star': { emoji: '⭐', category: 'Nature', ipa: '/stɑːr/', vi: 'Ngôi sao', pos: 'noun', example: 'Twinkle twinkle little star in the deep dark sky.' },
    'book': { emoji: '📚', category: 'School', ipa: '/bʊk/', vi: 'Quyển sách', pos: 'noun', example: 'She opens her favorite story book to read.' },
    'pencil': { emoji: '✏️', category: 'School', ipa: '/ˈpensl/', vi: 'Bút chì', pos: 'noun', example: 'He sharpens his wooden pencil before drawing.' },
    'school': { emoji: '🏫', category: 'School', ipa: '/skuːl/', vi: 'Trường học', pos: 'noun', example: 'Children walk to school together every morning.' },
    'car': { emoji: '🚗', category: 'Vehicles', ipa: '/kɑːr/', vi: 'Xe ô tô', pos: 'noun', example: 'The red electric car drives smoothly down the road.' },
    'airplane': { emoji: '✈️', category: 'Vehicles', ipa: '/ˈeəpleɪn/', vi: 'Máy bay', pos: 'noun', example: 'The white airplane flies high above the clouds.' },
    'rocket': { emoji: '🚀', category: 'Space', ipa: '/ˈrɒkɪt/', vi: 'Tên lửa', pos: 'noun', example: 'The powerful rocket launches into outer space.' },
    'flower': { emoji: '🌸', category: 'Nature', ipa: '/ˈflaʊər/', vi: 'Bông hoa', pos: 'noun', example: 'Pink spring flowers bloom beautifully in the garden.' },
    'tree': { emoji: '🌳', category: 'Nature', ipa: '/triː/', vi: 'Cái cây', pos: 'noun', example: 'The tall green tree gives cool shade in summer.' },
    'house': { emoji: '🏠', category: 'Places', ipa: '/haʊs/', vi: 'Ngôi nhà', pos: 'noun', example: 'We live in a cozy small house with a garden.' },
    'pizza': { emoji: '🍕', category: 'Food', ipa: '/ˈpiːtsə/', vi: 'Bánh pizza', pos: 'noun', example: 'We shared a hot delicious cheese pizza for lunch.' },
    'ice cream': { emoji: '🍦', category: 'Food', ipa: '/ˌaɪs ˈkriːm/', vi: 'Kem', pos: 'noun', example: 'Eating sweet strawberry ice cream on a hot day.' },
    'doctor': { emoji: '👨‍⚕️', category: 'Jobs', ipa: '/ˈdɒktər/', vi: 'Bác sĩ', pos: 'noun', example: 'The kind doctor helps sick patients feel better.' },
    'teacher': { emoji: '👩‍🏫', category: 'Jobs', ipa: '/ˈtiːtʃər/', vi: 'Giáo viên', pos: 'noun', example: 'Our English teacher explains the lesson clearly.' },
};
