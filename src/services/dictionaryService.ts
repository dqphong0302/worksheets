import { FlashcardItem, FlashcardAIStyle } from '../types';
import { generateAIImageUrl, POPULAR_VOCAB_VISUALS } from './aiImageService';

export interface DictionaryEntry {
    word: string;
    phonetic?: string;
    phonetics?: Array<{ text?: string; audio?: string }>;
    meanings: Array<{
        partOfSpeech: string;
        definitions: Array<{
            definition: string;
            example?: string;
            synonyms?: string[];
        }>;
    }>;
}

export interface EnrichedWordData {
    word: string;
    ipa: string;
    partOfSpeech: string;
    meaningEn: string;
    meaningVi: string;
    exampleEn: string;
    exampleVi?: string;
    audioUrl?: string;
    emoji: string;
    imageUrl: string;
}

// Built-in Vietnamese dictionary translation mapping for educational vocabulary
const VIETNAMESE_DICTIONARY_MAP: Record<string, { vi: string; pos: string; ipa: string; emoji: string; exEn: string; exVi: string }> = {
    // Animals
    'cat': { vi: 'Con mèo', pos: 'noun', ipa: '/kæt/', emoji: '🐱', exEn: 'The cat is purring softly.', exVi: 'Con mèo đang kêu rừ rừ êm ái.' },
    'dog': { vi: 'Con chó', pos: 'noun', ipa: '/dɒɡ/', emoji: '🐶', exEn: 'Dogs are loyal companions.', exVi: 'Chó là những người bạn trung thành.' },
    'elephant': { vi: 'Con voi', pos: 'noun', ipa: '/ˈelɪfənt/', emoji: '🐘', exEn: 'Elephants have great memory.', exVi: 'Loài voi có trí nhớ tuyệt vời.' },
    'lion': { vi: 'Sư tử', pos: 'noun', ipa: '/ˈlaɪən/', emoji: '🦁', exEn: 'The lion is the king of the jungle.', exVi: 'Sư tử là chúa sơn lâm.' },
    'tiger': { vi: 'Con hổ', pos: 'noun', ipa: '/ˈtaɪɡər/', emoji: '🐯', exEn: 'Tigers have beautiful orange stripes.', exVi: 'Hổ có những sọc màu cam tuyệt đẹp.' },
    'rabbit': { vi: 'Con thỏ', pos: 'noun', ipa: '/ˈræbɪt/', emoji: '🐰', exEn: 'The rabbit loves eating carrots.', exVi: 'Thỏ thích ăn cà rốt.' },
    'monkey': { vi: 'Con khỉ', pos: 'noun', ipa: '/ˈmʌŋki/', emoji: '🐵', exEn: 'Monkeys swing skillfully from tree to tree.', exVi: 'Những chú khỉ đu thoăn thoắt từ cây này sang cây khác.' },
    'bear': { vi: 'Con gấu', pos: 'noun', ipa: '/beər/', emoji: '🐻', exEn: 'Bears love sweet wild honey.', exVi: 'Loài gấu rất thích mật ong rừng ngọt ngào.' },
    'penguin': { vi: 'Chim cánh cụt', pos: 'noun', ipa: '/ˈpeŋɡwɪn/', emoji: '🐧', exEn: 'Penguins swim fast in cold waters.', exVi: 'Chim cánh cụt bơi rất nhanh trong làn nước lạnh.' },
    'dolphin': { vi: 'Cá heo', pos: 'noun', ipa: '/ˈdɒlfɪn/', emoji: '🐬', exEn: 'Dolphins are intelligent ocean animals.', exVi: 'Cá heo là loài động vật đại dương thông minh.' },
    'butterfly': { vi: 'Con bướm', pos: 'noun', ipa: '/ˈbʌtərflaɪ/', emoji: '🦋', exEn: 'A colorful butterfly lands on a flower.', exVi: 'Một chú bướm rực rỡ đậu trên bông hoa.' },

    // Fruits & Food
    'apple': { vi: 'Quả táo', pos: 'noun', ipa: '/ˈæpl/', emoji: '🍎', exEn: 'Fresh red apples are juicy.', exVi: 'Những quả táo đỏ tươi rất mọng nước.' },
    'banana': { vi: 'Quả chuối', pos: 'noun', ipa: '/bəˈnænə/', emoji: '🍌', exEn: 'Bananas are rich in potassium.', exVi: 'Chuối rất giàu chất kali.' },
    'orange': { vi: 'Quả cam', pos: 'noun', ipa: '/ˈɒrɪndʒ/', emoji: '🍊', exEn: 'Drinking orange juice in the morning.', exVi: 'Uống nước cam vào buổi sáng.' },
    'strawberry': { vi: 'Dâu tây', pos: 'noun', ipa: '/ˈstrɔːbəri/', emoji: '🍓', exEn: 'Sweet strawberries on top of the cake.', exVi: 'Những quả dâu ngọt ngào trên chiếc bánh kem.' },
    'watermelon': { vi: 'Dưa hấu', pos: 'noun', ipa: '/ˈwɔːtərmelən/', emoji: '🍉', exEn: 'Cold watermelon on a hot summer day.', exVi: 'Dưa hấu mát lạnh trong ngày hè oi bức.' },
    'grape': { vi: 'Chùm nho', pos: 'noun', ipa: '/ɡreɪp/', emoji: '🍇', exEn: 'Purple grapes grow on the vine.', exVi: 'Những chùm nho tím mọc trên giàn cây.' },
    'pizza': { vi: 'Bánh pizza', pos: 'noun', ipa: '/ˈpiːtsə/', emoji: '🍕', exEn: 'Hot cheese pizza straight from the oven.', exVi: 'Bánh pizza phô mai nóng hổi vừa ra lò.' },
    'bread': { vi: 'Bánh mì', pos: 'noun', ipa: '/bred/', emoji: '🍞', exEn: 'Fresh baked bread smells delicious.', exVi: 'Bánh mì mới nướng thơm phức.' },
    'milk': { vi: 'Sữa tươi', pos: 'noun', ipa: '/mɪlk/', emoji: '🥛', exEn: 'Drink a glass of warm milk before bed.', exVi: 'Uống một ly sữa ấm trước khi đi ngủ.' },

    // School & Study
    'book': { vi: 'Quyển sách', pos: 'noun', ipa: '/bʊk/', emoji: '📚', exEn: 'Reading books opens your mind.', exVi: 'Đọc sách mở rộng tâm trí bạn.' },
    'pencil': { vi: 'Bút chì', pos: 'noun', ipa: '/ˈpensl/', emoji: '✏️', exEn: 'Write your answers with a pencil.', exVi: 'Hãy viết câu trả lời bằng bút chì.' },
    'teacher': { vi: 'Giáo viên', pos: 'noun', ipa: '/ˈtiːtʃər/', emoji: '👩‍🏫', exEn: 'The teacher guides students with care.', exVi: 'Cô giáo ân cần chỉ bảo học sinh.' },
    'student': { vi: 'Học sinh', pos: 'noun', ipa: '/ˈstjuːdnt/', emoji: '🧑‍🎓', exEn: 'Students listen attentively in class.', exVi: 'Học sinh chăm chú lắng nghe trong lớp.' },
    'computer': { vi: 'Máy tính', pos: 'noun', ipa: '/kəmˈpjuːtər/', emoji: '💻', exEn: 'We learn coding on the computer.', exVi: 'Chúng tôi học lập trình trên máy tính.' },
    'library': { vi: 'Thư viện', pos: 'noun', ipa: '/ˈlaɪbrəri/', emoji: '🏛️', exEn: 'The school library has thousands of books.', exVi: 'Thư viện trường học có hàng ngàn đầu sách.' },

    // Nature & Universe
    'sun': { vi: 'Mặt trời', pos: 'noun', ipa: '/sʌn/', emoji: '☀️', exEn: 'The sun rises in the east.', exVi: 'Mặt trời mọc ở hướng đông.' },
    'moon': { vi: 'Mặt trăng', pos: 'noun', ipa: '/muːn/', emoji: '🌙', exEn: 'The full moon illuminates the night.', exVi: 'Trăng tròn tỏa sáng màn đêm.' },
    'star': { vi: 'Ngôi sao', pos: 'noun', ipa: '/stɑːr/', emoji: '⭐', exEn: 'Countless stars sparkle in the galaxy.', exVi: 'Vô số ngôi sao lấp lánh trong dải ngân hà.' },
    'rainbow': { vi: 'Cầu vồng', pos: 'noun', ipa: '/ˈreɪnbəʊ/', emoji: '🌈', exEn: 'A magnificent rainbow appears after the rain.', exVi: 'Cầu vồng tuyệt đẹp xuất hiện sau cơn mưa.' },
    'ocean': { vi: 'Đại dương', pos: 'noun', ipa: '/ˈəʊʃn/', emoji: '🌊', exEn: 'The vast ocean is home to marine life.', exVi: 'Đại dương bao la là ngôi nhà của sinh vật biển.' },
    'mountain': { vi: 'Ngọn núi', pos: 'noun', ipa: '/ˈmaʊntn/', emoji: '⛰️', exEn: 'Climbing to the peak of the mountain.', exVi: 'Leo lên đỉnh của ngọn núi cao.' },

    // Jobs
    'doctor': { vi: 'Bác sĩ', pos: 'noun', ipa: '/ˈdɒktər/', emoji: '👨‍⚕️', exEn: 'The doctor examines patients carefully.', exVi: 'Bác sĩ thăm khám bệnh nhân cẩn thận.' },
    'astronaut': { vi: 'Phi hành gia', pos: 'noun', ipa: '/ˈæstrənɔːt/', emoji: '👨‍🚀', exEn: 'Astronauts float in zero gravity.', exVi: 'Các phi hành gia lơ lửng trong môi trường không trọng lực.' },
    'firefighter': { vi: 'Lính cứu hỏa', pos: 'noun', ipa: '/ˈfaɪərfaɪtər/', emoji: '👨‍🚒', exEn: 'Brave firefighters extinguish the flame.', exVi: 'Những người lính cứu hỏa dũng cảm dập tắt ngọn lửa.' },
    'artist': { vi: 'Họa sĩ', pos: 'noun', ipa: '/ˈɑːtɪst/', emoji: '🎨', exEn: 'The artist paints a stunning landscape.', exVi: 'Họa sĩ vẽ nên bức tranh phong cảnh tuyệt đẹp.' },
    'pilot': { vi: 'Phi công', pos: 'noun', ipa: '/ˈpaɪlət/', emoji: '👨‍✈️', exEn: 'The pilot navigates the plane through turbulence.', exVi: 'Phi công điều khiển máy bay vượt qua vùng nhiễu động.' },
};

/**
 * Fetch online dictionary entry from Free Dictionary API with fallback
 */
export async function lookupDictionary(word: string): Promise<DictionaryEntry | null> {
    try {
        const cleanWord = word.trim().toLowerCase();
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as DictionaryEntry;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Enrich a single word with full dictionary data, translation, and AI image
 */
export async function enrichVocabularyWord(
    rawWord: string,
    aiStyle: FlashcardAIStyle = '3d_pixar'
): Promise<EnrichedWordData> {
    const cleanWord = rawWord.trim().toLowerCase();
    const localInfo = VIETNAMESE_DICTIONARY_MAP[cleanWord] || POPULAR_VOCAB_VISUALS[cleanWord];

    // Try online dictionary lookup
    const onlineData = await lookupDictionary(cleanWord);

    let ipa = localInfo?.ipa || '';
    let partOfSpeech = localInfo?.pos || 'noun';
    let meaningEn = '';
    let exampleEn = localInfo ? ('exEn' in localInfo ? localInfo.exEn : (localInfo as any).example || '') : '';
    let audioUrl = '';

    if (onlineData) {
        // Extract phonetic
        if (!ipa && onlineData.phonetic) {
            ipa = onlineData.phonetic;
        }
        if (!ipa && onlineData.phonetics && onlineData.phonetics.length > 0) {
            const withText = onlineData.phonetics.find(p => p.text);
            if (withText?.text) ipa = withText.text;
        }
        // Extract audio
        if (onlineData.phonetics) {
            const withAudio = onlineData.phonetics.find(p => p.audio && p.audio.length > 0);
            if (withAudio?.audio) audioUrl = withAudio.audio;
        }
        // Extract meaning & pos
        if (onlineData.meanings && onlineData.meanings.length > 0) {
            const firstMeaning = onlineData.meanings[0];
            partOfSpeech = firstMeaning.partOfSpeech || partOfSpeech;
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                meaningEn = firstMeaning.definitions[0].definition || '';
                if (!exampleEn && firstMeaning.definitions[0].example) {
                    exampleEn = firstMeaning.definitions[0].example;
                }
            }
        }
    }

    // Fallbacks
    if (!ipa) ipa = `/${cleanWord}/`;
    if (!meaningEn) meaningEn = `A word representing ${cleanWord}`;
    if (!exampleEn) exampleEn = `Look at that beautiful ${cleanWord}!`;

    const meaningVi = localInfo?.vi || localInfo?.vi || capitalize(cleanWord);
    const emoji = localInfo?.emoji || '✨';
    const imageUrl = generateAIImageUrl(cleanWord, aiStyle);

    return {
        word: capitalize(cleanWord),
        ipa,
        partOfSpeech,
        meaningEn,
        meaningVi,
        exampleEn,
        exampleVi: localInfo?.exVi,
        audioUrl,
        emoji,
        imageUrl,
    };
}

/**
 * Convert an array of words to FlashcardItem list with full dictionary and AI images
 */
export async function batchGenerateAIFlashcards(
    words: string[],
    aiStyle: FlashcardAIStyle = '3d_pixar'
): Promise<FlashcardItem[]> {
    const results: FlashcardItem[] = [];

    for (let i = 0; i < words.length; i++) {
        const word = words[i].trim();
        if (!word) continue;

        const data = await enrichVocabularyWord(word, aiStyle);
        results.push({
            id: (i + 1).toString(),
            frontText: data.word,
            frontSub: `${data.partOfSpeech} • ${data.ipa}`,
            backText: data.meaningVi,
            backSub: data.exampleEn,
            iconOrEmoji: data.emoji,
            imageUrl: data.imageUrl,
            partOfSpeech: data.partOfSpeech,
            ipa: data.ipa,
            exampleEn: data.exampleEn,
            exampleVi: data.exampleVi,
        });
    }

    return results;
}

function capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}
