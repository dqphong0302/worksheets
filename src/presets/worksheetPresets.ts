export interface PresetTopic {
    id: string;
    icon: string;
    nameVi: string;
    nameEn: string;
    words: Array<{
        word: string;
        clueVi: string;
        clueEn: string;
        emoji?: string;
        pairRightVi?: string;
        pairRightEn?: string;
    }>;
}

export const WORKSHEET_PRESETS: PresetTopic[] = [
    {
        id: 'animals',
        icon: '🐾',
        nameVi: 'Động vật quen thuộc',
        nameEn: 'Animals & Wildlife',
        words: [
            { word: 'CAT', clueVi: 'Con mèo bắt chuột kêu meo meo', clueEn: 'Small domestic feline pet', emoji: '🐱', pairRightVi: 'Mèo', pairRightEn: 'Feline' },
            { word: 'DOG', clueVi: 'Con chó trung thành trông nhà', clueEn: 'Loyal domestic canine companion', emoji: '🐶', pairRightVi: 'Chó', pairRightEn: 'Canine' },
            { word: 'ELEPHANT', clueVi: 'Loài thú trên cạn lớn nhất có vòi dài', clueEn: 'Largest land mammal with a trunk', emoji: '🐘', pairRightVi: 'Voi', pairRightEn: 'Giant' },
            { word: 'LION', clueVi: 'Chúa sơn lâm dũng mãnh', clueEn: 'King of the jungle with a mane', emoji: '🦁', pairRightVi: 'Sư tử', pairRightEn: 'Predator' },
            { word: 'MONKEY', clueVi: 'Con khỉ thích leo trèo ăn chuối', clueEn: 'Playful primate that loves bananas', emoji: '🐵', pairRightVi: 'Khỉ', pairRightEn: 'Primate' },
            { word: 'RABBIT', clueVi: 'Con thỏ tai dài thích ăn cà rốt', clueEn: 'Fluffy mammal with long ears that hops', emoji: '🐰', pairRightVi: 'Thỏ', pairRightEn: 'Bunny' },
            { word: 'PANDA', clueVi: 'Gấu trúc lông đen trắng thích ăn tre', clueEn: 'Black and white bear that eats bamboo', emoji: '🐼', pairRightVi: 'Gấu trúc', pairRightEn: 'Bamboo Bear' },
            { word: 'TIGER', clueVi: 'Con hổ có sọc vằn oai vệ', clueEn: 'Large striped wild cat predator', emoji: '🐯', pairRightVi: 'Hổ', pairRightEn: 'Striped Cat' },
            { word: 'DOLPHIN', clueVi: 'Cá heo thông minh thân thiện dưới biển', clueEn: 'Intelligent marine mammal that jumps', emoji: '🐬', pairRightVi: 'Cá heo', pairRightEn: 'Marine' },
            { word: 'PENGUIN', clueVi: 'Chim cánh cụt sống ở Nam Cực', clueEn: 'Flightless bird living in Antarctica', emoji: '🐧', pairRightVi: 'Chim cánh cụt', pairRightEn: 'Antarctic Bird' },
        ],
    },
    {
        id: 'fruits',
        icon: '🍎',
        nameVi: 'Hoa quả & Trái cây',
        nameEn: 'Fruits & Vegetables',
        words: [
            { word: 'APPLE', clueVi: 'Quả táo đỏ giòn ngọt', clueEn: 'Sweet red or green crisp fruit', emoji: '🍎', pairRightVi: 'Quả Táo', pairRightEn: 'Crisp Fruit' },
            { word: 'BANANA', clueVi: 'Quả chuối vỏ vàng cong cong', clueEn: 'Long curved yellow fruit rich in potassium', emoji: '🍌', pairRightVi: 'Quả Chuối', pairRightEn: 'Yellow Fruit' },
            { word: 'ORANGE', clueVi: 'Quả cam mọng nước nhiều vitamin C', clueEn: 'Round citrus fruit rich in Vitamin C', emoji: '🍊', pairRightVi: 'Quả Cam', pairRightEn: 'Citrus' },
            { word: 'GRAPE', clueVi: 'Chùm nho tím ngọt lịm', clueEn: 'Small round fruit growing in clusters', emoji: '🍇', pairRightVi: 'Quả Nho', pairRightEn: 'Cluster Fruit' },
            { word: 'WATERMELON', clueVi: 'Quả dưa hấu ruột đỏ vỏ xanh giải khát', clueEn: 'Large green fruit with sweet red pulp', emoji: '🍉', pairRightVi: 'Dưa Hấu', pairRightEn: 'Melon' },
            { word: 'MANGO', clueVi: 'Quả xoài thơm ngọt nhiệt đới', clueEn: 'Tropical sweet golden stone fruit', emoji: '🥭', pairRightVi: 'Quả Xoài', pairRightEn: 'Tropical' },
            { word: 'STRAWBERRY', clueVi: 'Quả dâu tây đỏ mọng có hạt li ti', clueEn: 'Sweet red berry with external seeds', emoji: '🍓', pairRightVi: 'Dâu Tây', pairRightEn: 'Berry' },
            { word: 'PINEAPPLE', clueVi: 'Quả dứa có nhiều mắt và lá nhọn', clueEn: 'Tropical fruit with spiky crown', emoji: '🍍', pairRightVi: 'Quả Dứa', pairRightEn: 'Ananas' },
            { word: 'CARROT', clueVi: 'Củ cà rốt màu cam tốt cho mắt', clueEn: 'Orange root vegetable loved by rabbits', emoji: '🥕', pairRightVi: 'Cà Rốt', pairRightEn: 'Root Vegetable' },
            { word: 'AVOCADO', clueVi: 'Quả bơ béo ngậy bổ dưỡng', clueEn: 'Creamy green fruit with a large pit', emoji: '🥑', pairRightVi: 'Quả Bơ', pairRightEn: 'Superfood' },
        ],
    },
    {
        id: 'school',
        icon: '🎒',
        nameVi: 'Đồ dùng học tập & Lớp học',
        nameEn: 'School & Classroom',
        words: [
            { word: 'BOOK', clueVi: 'Quyển sách chứa đựng tri thức', clueEn: 'Bound pages of reading material', emoji: '📖', pairRightVi: 'Quyển Sách', pairRightEn: 'Reading' },
            { word: 'PENCIL', clueVi: 'Bút chì dùng để viết và vẽ nét', clueEn: 'Graphite tool used for writing and drawing', emoji: '✏️', pairRightVi: 'Bút Chì', pairRightEn: 'Graphite' },
            { word: 'RULER', clueVi: 'Thước kẻ đo độ dài và kẻ đường thẳng', clueEn: 'Straight tool used for measuring length', emoji: '📏', pairRightVi: 'Thước Kẻ', pairRightEn: 'Measure' },
            { word: 'ERASER', clueVi: 'Cục tẩy dùng để xóa vết bút chì', clueEn: 'Rubber block used to rub out pencil marks', emoji: '🧼', pairRightVi: 'Cục Tẩy', pairRightEn: 'Rubber' },
            { word: 'BACKPACK', clueVi: 'Cặp sách đựng đồ dùng đến trường', clueEn: 'Bag carried on back for school supplies', emoji: '🎒', pairRightVi: 'Balo / Cặp Sách', pairRightEn: 'Bag' },
            { word: 'SCISSORS', clueVi: 'Cái kéo dùng để cắt giấy thủ công', clueEn: 'Cutting tool with two crossed blades', emoji: '✂️', pairRightVi: 'Cái Kéo', pairRightEn: 'Cutter' },
            { word: 'TEACHER', clueVi: 'Thầy cô giáo truyền dạy kiến thức', clueEn: 'Person who educates and guides students', emoji: '👩‍🏫', pairRightVi: 'Giáo Viên', pairRightEn: 'Educator' },
            { word: 'STUDENT', clueVi: 'Học sinh chăm chỉ học tập', clueEn: 'Person who is studying at school', emoji: '🧑‍🎓', pairRightVi: 'Học Sinh', pairRightEn: 'Learner' },
            { word: 'BOARD', clueVi: 'Bảng đen hoặc bảng trắng viết phấn/bút', clueEn: 'Surface at the front for writing lessons', emoji: '📋', pairRightVi: 'Bảng Lớp', pairRightEn: 'Blackboard' },
            { word: 'DESK', clueVi: 'Bàn học sinh ngồi làm bài', clueEn: 'Table where students sit to work', emoji: '🪑', pairRightVi: 'Bàn Học', pairRightEn: 'Work Table' },
        ],
    },
    {
        id: 'colors_shapes',
        icon: '🎨',
        nameVi: 'Màu sắc & Hình khối',
        nameEn: 'Colors & Shapes',
        words: [
            { word: 'RED', clueVi: 'Màu đỏ của hoa hồng và mặt trời', clueEn: 'Color of strawberries and rubies', emoji: '🔴', pairRightVi: 'Màu Đỏ', pairRightEn: 'Crimson' },
            { word: 'BLUE', clueVi: 'Màu xanh dương của biển cả và bầu trời', clueEn: 'Color of the ocean and clear sky', emoji: '🔵', pairRightVi: 'Màu Xanh Dương', pairRightEn: 'Azure' },
            { word: 'GREEN', clueVi: 'Màu xanh lá cây của cây cối', clueEn: 'Color of grass and lush leaves', emoji: '🟢', pairRightVi: 'Màu Xanh Lá', pairRightEn: 'Emerald' },
            { word: 'YELLOW', clueVi: 'Màu vàng tươi của ánh nắng ban mai', clueEn: 'Color of sunshine and ripe lemons', emoji: '🟡', pairRightVi: 'Màu Vàng', pairRightEn: 'Golden' },
            { word: 'CIRCLE', clueVi: 'Hình tròn trịa không có góc cạnh', clueEn: 'Round shape with no corners', emoji: '⭕', pairRightVi: 'Hình Tròn', pairRightEn: 'Round' },
            { word: 'SQUARE', clueVi: 'Hình vuông có 4 cạnh bằng nhau', clueEn: 'Shape with four equal straight sides', emoji: '⏹️', pairRightVi: 'Hình Vuông', pairRightEn: 'Four Sides' },
            { word: 'TRIANGLE', clueVi: 'Hình tam giác có 3 cạnh và 3 góc', clueEn: 'Shape with three sides and three angles', emoji: '🔺', pairRightVi: 'Hình Tam Giác', pairRightEn: 'Three Sides' },
            { word: 'STAR', clueVi: 'Ngôi sao 5 cánh lấp lánh trên trời', clueEn: 'Five-pointed glowing celestial shape', emoji: '⭐', pairRightVi: 'Hình Ngôi Sao', pairRightEn: 'Celestial' },
            { word: 'HEART', clueVi: 'Hình trái tim biểu tượng của yêu thương', clueEn: 'Symbol of love and affection', emoji: '❤️', pairRightVi: 'Hình Trái Tim', pairRightEn: 'Love Shape' },
            { word: 'DIAMOND', clueVi: 'Hình thoi / hình kim cương góc cạnh', clueEn: 'Rhombus shape like a shiny gem', emoji: '💎', pairRightVi: 'Hình Thoi', pairRightEn: 'Gem' },
        ],
    },
    {
        id: 'nature_weather',
        icon: '⛅',
        nameVi: 'Thời tiết & Thiên nhiên',
        nameEn: 'Weather & Nature',
        words: [
            { word: 'SUNNY', clueVi: 'Trời nắng vàng rực rỡ', clueEn: 'Full of bright sunshine', emoji: '☀️', pairRightVi: 'Nắng Ráo', pairRightEn: 'Sun' },
            { word: 'RAINY', clueVi: 'Trời mưa mang lại nước tưới cho cây', clueEn: 'Showers of water drops from clouds', emoji: '🌧️', pairRightVi: 'Trời Mưa', pairRightEn: 'Rain' },
            { word: 'CLOUDY', clueVi: 'Nhiều mây che bớt ánh nắng', clueEn: 'Sky covered with fluffy clouds', emoji: '☁️', pairRightVi: 'Nhiều Mây', pairRightEn: 'Overcast' },
            { word: 'WINDY', clueVi: 'Trời lộng gió làm bay lá rụng', clueEn: 'Strong moving air breezes', emoji: '💨', pairRightVi: 'Trời Gió', pairRightEn: 'Breeze' },
            { word: 'SNOWY', clueVi: 'Tuyết rơi trắng xóa mùa đông', clueEn: 'Frozen white flakes falling from sky', emoji: '❄️', pairRightVi: 'Có Tuyết', pairRightEn: 'Snow' },
            { word: 'RAINBOW', clueVi: 'Cầu vồng 7 sắc xuất hiện sau cơn mưa', clueEn: 'Arc of 7 spectral colors after rain', emoji: '🌈', pairRightVi: 'Cầu Vồng', pairRightEn: 'Arc of Light' },
            { word: 'MOUNTAIN', clueVi: 'Ngọn núi hùng vĩ cao vút', clueEn: 'High natural elevation of earth surface', emoji: '⛰️', pairRightVi: 'Ngọn Núi', pairRightEn: 'Peak' },
            { word: 'OCEAN', clueVi: 'Đại dương bao la xanh biếc', clueEn: 'Vast expanse of sea saltwater', emoji: '🌊', pairRightVi: 'Đại Dương', pairRightEn: 'Sea' },
            { word: 'RIVER', clueVi: 'Dòng sông êm đềm chảy ra biển', clueEn: 'Large natural stream of flowing water', emoji: '🏞️', pairRightVi: 'Dòng Sông', pairRightEn: 'Stream' },
            { word: 'FOREST', clueVi: 'Khu rừng rậm rạp nhiều cây cối', clueEn: 'Large area covered chiefly with trees', emoji: '🌲', pairRightVi: 'Khu Rừng', pairRightEn: 'Woods' },
        ],
    },
];
