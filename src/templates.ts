// ============================================
// Menu Templates & Dish Catalog
// ============================================
// Pre-built menu templates and popular Turkish dishes
// for quick menu creation

export interface DishTemplate {
    name: string;
    description: string;
    price: number;
    image: string;
    isPopular: boolean;
}

export interface CategoryTemplate {
    name: string;
    icon: string;
    dishes: DishTemplate[];
}

export interface MenuTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    categories: CategoryTemplate[];
}

// ============================================
// Hazır Menü Şablonları
// ============================================

export const menuTemplates: MenuTemplate[] = [
    {
        id: 'turkish',
        name: 'Türk Mutfağı',
        description: 'Geleneksel Türk yemekleri ve kebaplar',
        icon: '🥘',
        categories: [
            {
                name: 'Çorbalar',
                icon: '🍲',
                dishes: [
                    { name: 'Mercimek Çorbası', description: 'Kırmızı mercimek, havuç, soğan ile', price: 65, image: '🍲', isPopular: true },
                    { name: 'Ezogelin Çorbası', description: 'Mercimek, bulgur, nane', price: 65, image: '🍲', isPopular: false },
                    { name: 'İşkembe Çorbası', description: 'Geleneksel tarif, sarımsaklı sirke ile', price: 85, image: '🫕', isPopular: false },
                    { name: 'Tarhana Çorbası', description: 'Ev yapımı tarhana', price: 60, image: '🍲', isPopular: false },
                    { name: 'Yayla Çorbası', description: 'Yoğurtlu, naneli', price: 65, image: '🥣', isPopular: false },
                ]
            },
            {
                name: 'Başlangıçlar & Mezeler',
                icon: '🥗',
                dishes: [
                    { name: 'Humus', description: 'Nohut ezmesi, tahin, zeytinyağı', price: 75, image: '🧆', isPopular: false },
                    { name: 'Sigara Böreği', description: 'Peynirli, el açması (4 adet)', price: 85, image: '🌯', isPopular: true },
                    { name: 'Patlıcan Salatası', description: 'Közlenmiş patlıcan, sarımsak, tahin', price: 70, image: '🍆', isPopular: false },
                    { name: 'Acılı Ezme', description: 'Biber, domates, maydanoz', price: 55, image: '🌶️', isPopular: false },
                    { name: 'Haydari', description: 'Süzme yoğurt, dereotu, sarımsak', price: 65, image: '🥣', isPopular: false },
                    { name: 'Çiğ Köfte', description: 'Lavaş ve nar ekşisi ile (porsiyon)', price: 80, image: '🧆', isPopular: true },
                    { name: 'Yaprak Sarma', description: 'Zeytinyağlı, pirinçli (8 adet)', price: 90, image: '🫔', isPopular: false },
                ]
            },
            {
                name: 'Ana Yemekler',
                icon: '🥘',
                dishes: [
                    { name: 'İskender Kebap', description: 'Döner, yoğurt, tereyağlı domates sosu, pide', price: 220, image: '🍖', isPopular: true },
                    { name: 'Adana Kebap', description: 'Acılı el kıyması, lavaş, közlenmiş domates-biber', price: 200, image: '🥙', isPopular: true },
                    { name: 'Urfa Kebap', description: 'Acısız el kıyması, lavaş ekmek', price: 200, image: '🥙', isPopular: false },
                    { name: 'Kuzu Tandır', description: 'Fırında kuzu, pilav ile servis', price: 280, image: '🍖', isPopular: true },
                    { name: 'Mantı', description: 'El yapımı, yoğurt ve naneli tereyağı', price: 165, image: '🫕', isPopular: true },
                    { name: 'Karnıyarık', description: 'Patlıcan, kıyma, domates sosu, pilav ile', price: 155, image: '🍆', isPopular: false },
                    { name: 'Ali Nazik', description: 'Közlenmiş patlıcan, yoğurt, kuşbaşı et', price: 210, image: '🥘', isPopular: false },
                    { name: 'Hünkar Beğendi', description: 'Kuşbaşı et, patlıcan beşamel', price: 220, image: '🍖', isPopular: false },
                    { name: 'Izgara Köfte', description: '4 adet köfte, pilav, salata', price: 175, image: '🍔', isPopular: false },
                    { name: 'Tavuk Şiş', description: 'Marine tavuk, pilav, közlenmiş sebze', price: 160, image: '🍗', isPopular: false },
                ]
            },
            {
                name: 'Pide & Lahmacun',
                icon: '🫓',
                dishes: [
                    { name: 'Kıymalı Pide', description: 'Kıyma, domates, biber', price: 140, image: '🫓', isPopular: true },
                    { name: 'Kaşarlı Pide', description: 'Kaşar peyniri', price: 130, image: '🫓', isPopular: false },
                    { name: 'Kuşbaşılı Pide', description: 'Kuşbaşı et, domates, biber', price: 165, image: '🫓', isPopular: false },
                    { name: 'Karışık Pide', description: 'Kıyma, kuşbaşı, kaşar, sucuk', price: 175, image: '🫓', isPopular: true },
                    { name: 'Lahmacun', description: 'İnce hamur, kıyma, maydanoz, limon', price: 70, image: '🫓', isPopular: true },
                ]
            },
            {
                name: 'Salatalar',
                icon: '🥗',
                dishes: [
                    { name: 'Çoban Salata', description: 'Domates, salatalık, biber, soğan', price: 60, image: '🥗', isPopular: false },
                    { name: 'Mevsim Salata', description: 'Mevsim yeşillikleri, nar ekşisi sos', price: 65, image: '🥗', isPopular: false },
                    { name: 'Sezar Salata', description: 'Marul, kruton, parmesan, tavuk', price: 95, image: '🥗', isPopular: false },
                ]
            },
            {
                name: 'Tatlılar',
                icon: '🍰',
                dishes: [
                    { name: 'Künefe', description: 'Kadayıf, peynir, şerbet, antep fıstığı', price: 120, image: '🍮', isPopular: true },
                    { name: 'Baklava', description: '4 dilim, antep fıstıklı (Gaziantep)', price: 130, image: '🍰', isPopular: true },
                    { name: 'Sütlaç', description: 'Fırın sütlaç, tarçınlı', price: 75, image: '🍮', isPopular: false },
                    { name: 'Kazandibi', description: 'Karamellenmiş muhallebi', price: 75, image: '🍮', isPopular: false },
                    { name: 'Kadayıf', description: 'Tel kadayıf, cevizli, şerbetli', price: 100, image: '🍰', isPopular: false },
                ]
            },
            {
                name: 'İçecekler',
                icon: '🥤',
                dishes: [
                    { name: 'Ayran', description: 'Ev yapımı ayran', price: 25, image: '🥛', isPopular: true },
                    { name: 'Çay', description: 'Demli Türk çayı', price: 20, image: '🍵', isPopular: false },
                    { name: 'Türk Kahvesi', description: 'Orta/sade/şekerli', price: 45, image: '☕', isPopular: false },
                    { name: 'Şalgam', description: 'Acılı/acısız', price: 30, image: '🥤', isPopular: false },
                    { name: 'Limonata', description: 'Taze sıkılmış, naneli', price: 45, image: '🍋', isPopular: false },
                    { name: 'Kola', description: '330ml kutu', price: 35, image: '🥤', isPopular: false },
                    { name: 'Su', description: '0.5L', price: 10, image: '💧', isPopular: false },
                ]
            }
        ]
    },
    {
        id: 'cafe',
        name: 'Kafe & Kahvaltı',
        description: 'Kahve çeşitleri, kahvaltı ve hafif yemekler',
        icon: '☕',
        categories: [
            {
                name: 'Kahve Çeşitleri',
                icon: '☕',
                dishes: [
                    { name: 'Espresso', description: 'Çift shot espresso', price: 50, image: '☕', isPopular: false },
                    { name: 'Americano', description: 'Espresso + sıcak su', price: 55, image: '☕', isPopular: false },
                    { name: 'Latte', description: 'Espresso + köpüklü süt', price: 70, image: '☕', isPopular: true },
                    { name: 'Cappuccino', description: 'Espresso + süt köpüğü', price: 70, image: '☕', isPopular: true },
                    { name: 'Flat White', description: 'Çift shot + ipeksi süt', price: 75, image: '☕', isPopular: false },
                    { name: 'Mocha', description: 'Espresso + çikolata + süt', price: 80, image: '☕', isPopular: false },
                    { name: 'Caramel Macchiato', description: 'Vanilyalı süt, espresso, karamel sos', price: 85, image: '☕', isPopular: true },
                    { name: 'Türk Kahvesi', description: 'Geleneksel pişirme, lokumlu', price: 50, image: '☕', isPopular: true },
                    { name: 'Filtre Kahve', description: 'V60 / Chemex seçenekleri', price: 65, image: '☕', isPopular: false },
                    { name: 'Ice Latte', description: 'Buzlu latte', price: 80, image: '🧊', isPopular: true },
                ]
            },
            {
                name: 'Soğuk İçecekler',
                icon: '🧊',
                dishes: [
                    { name: 'Smoothie (Mango)', description: 'Taze mango, muz, yoğurt', price: 85, image: '🥭', isPopular: true },
                    { name: 'Smoothie (Berry)', description: 'Karışık orman meyveli', price: 85, image: '🫐', isPopular: false },
                    { name: 'Taze Portakal Suyu', description: 'Sıkma portakal suyu', price: 65, image: '🍊', isPopular: false },
                    { name: 'Limonata', description: 'Ev yapımı naneli limonata', price: 55, image: '🍋', isPopular: false },
                    { name: 'Ice Tea', description: 'Şeftali / Limon', price: 45, image: '🧊', isPopular: false },
                    { name: 'Milkshake', description: 'Çikolata / Vanilya / Çilek', price: 80, image: '🥛', isPopular: false },
                ]
            },
            {
                name: 'Kahvaltı',
                icon: '🍳',
                dishes: [
                    { name: 'Serpme Kahvaltı (2 Kişilik)', description: 'Peynir, zeytin, bal, kaymak, yumurta, sosis, domates, salatalık, reçel çeşitleri', price: 450, image: '🍳', isPopular: true },
                    { name: 'Tek Kişilik Kahvaltı', description: 'Klasik kahvaltı tabağı', price: 180, image: '🍳', isPopular: true },
                    { name: 'Menemen', description: 'Domates, biber, yumurta, kaşar', price: 95, image: '🍳', isPopular: true },
                    { name: 'Sucuklu Yumurta', description: 'Sucuk, yumurta, tereyağ', price: 100, image: '🍳', isPopular: false },
                    { name: 'Omlet', description: 'Kaşarlı veya sebzeli', price: 85, image: '🥚', isPopular: false },
                    { name: 'Granola Bowl', description: 'Granola, yoğurt, mevsim meyveleri, bal', price: 95, image: '🥣', isPopular: false },
                    { name: 'Avokadolu Tost', description: 'Ekşi maya ekmek, avokado, poşe yumurta', price: 110, image: '🥑', isPopular: true },
                ]
            },
            {
                name: 'Sandviç & Tost',
                icon: '🥪',
                dishes: [
                    { name: 'Kulüp Sandviç', description: 'Tavuk, marul, domates, mayonez', price: 120, image: '🥪', isPopular: true },
                    { name: 'Tuna Sandviç', description: 'Ton balığı, marul, mayonez', price: 110, image: '🥪', isPopular: false },
                    { name: 'Karışık Tost', description: 'Kaşar, sucuk, domates', price: 80, image: '🧀', isPopular: true },
                    { name: 'Kaşarlı Tost', description: 'Kaşar peyniri', price: 60, image: '🧀', isPopular: false },
                    { name: 'Bazlama Tost', description: 'Bazlama, kaşar, domates', price: 90, image: '🫓', isPopular: false },
                ]
            },
            {
                name: 'Tatlılar & Pasta',
                icon: '🍰',
                dishes: [
                    { name: 'San Sebastian Cheesecake', description: 'Dilim, karamel sos', price: 110, image: '🍰', isPopular: true },
                    { name: 'Tiramisu', description: 'İtalyan tatlısı', price: 100, image: '🍰', isPopular: true },
                    { name: 'Brownie', description: 'Dondurma ve çikolata sos ile', price: 95, image: '🍫', isPopular: false },
                    { name: 'Cookie', description: 'Taze fırın, çikolata parçalı', price: 45, image: '🍪', isPopular: false },
                    { name: 'Waffle', description: 'Meyve, çikolata, dondurma ile', price: 120, image: '🧇', isPopular: true },
                ]
            }
        ]
    },
    {
        id: 'fastfood',
        name: 'Fast Food & Burger',
        description: 'Burger, pizza, tavuk ve yan ürünler',
        icon: '🍔',
        categories: [
            {
                name: 'Burgerler',
                icon: '🍔',
                dishes: [
                    { name: 'Klasik Burger', description: '150gr köfte, marul, domates, turşu, sos', price: 140, image: '🍔', isPopular: true },
                    { name: 'Cheese Burger', description: '150gr köfte, cheddar, marul, domates', price: 155, image: '🍔', isPopular: true },
                    { name: 'Double Burger', description: '2x150gr köfte, cheddar, özel sos', price: 200, image: '🍔', isPopular: true },
                    { name: 'Tavuk Burger', description: 'Çıtır tavuk, marul, mayo', price: 135, image: '🍔', isPopular: false },
                    { name: 'BBQ Burger', description: '150gr köfte, BBQ sos, soğan halkası, cheddar', price: 170, image: '🍔', isPopular: false },
                    { name: 'Mushroom Burger', description: '150gr köfte, mantar, cheddar', price: 165, image: '🍔', isPopular: false },
                ]
            },
            {
                name: 'Pizzalar',
                icon: '🍕',
                dishes: [
                    { name: 'Margarita', description: 'Domates sos, mozzarella, fesleğen', price: 130, image: '🍕', isPopular: false },
                    { name: 'Karışık Pizza', description: 'Sucuk, sosis, biber, mantar, zeytin', price: 165, image: '🍕', isPopular: true },
                    { name: 'Pepperoni Pizza', description: 'Bol pepperoni, mozzarella', price: 155, image: '🍕', isPopular: true },
                    { name: 'Ton Balıklı Pizza', description: 'Ton balığı, soğan, mısır', price: 160, image: '🍕', isPopular: false },
                    { name: 'Vejeteryan Pizza', description: 'Sebzeli, mantarlı, zeytinli', price: 145, image: '🍕', isPopular: false },
                ]
            },
            {
                name: 'Tavuk',
                icon: '🍗',
                dishes: [
                    { name: 'Çıtır Tavuk (6 Parça)', description: 'Baharatlı tavuk, sos seçimi', price: 130, image: '🍗', isPopular: true },
                    { name: 'Çıtır Tavuk (10 Parça)', description: 'Baharatlı tavuk, sos seçimi', price: 190, image: '🍗', isPopular: false },
                    { name: 'Chicken Wrap', description: 'Tavuk, marul, domates, sos', price: 120, image: '🌯', isPopular: false },
                    { name: 'Nuggets (8 Adet)', description: 'Tavuk nugget, sos ile', price: 95, image: '🍗', isPopular: false },
                ]
            },
            {
                name: 'Yan Ürünler',
                icon: '🍟',
                dishes: [
                    { name: 'Patates Kızartması', description: 'Çıtır patates, ketçap ile', price: 55, image: '🍟', isPopular: true },
                    { name: 'Soğan Halkası', description: '8 adet, sos ile', price: 65, image: '🧅', isPopular: false },
                    { name: 'Mozzarella Stick', description: '6 adet, ranch sos', price: 80, image: '🧀', isPopular: false },
                    { name: 'Coleslaw', description: 'Lahana salatası', price: 35, image: '🥗', isPopular: false },
                ]
            },
            {
                name: 'İçecekler',
                icon: '🥤',
                dishes: [
                    { name: 'Kola', description: '330ml', price: 30, image: '🥤', isPopular: false },
                    { name: 'Fanta', description: '330ml', price: 30, image: '🥤', isPopular: false },
                    { name: 'Sprite', description: '330ml', price: 30, image: '🥤', isPopular: false },
                    { name: 'Ayran', description: '300ml', price: 20, image: '🥛', isPopular: false },
                    { name: 'Su', description: '0.5L', price: 10, image: '💧', isPopular: false },
                ]
            }
        ]
    },
    {
        id: 'seafood',
        name: 'Balık & Deniz Ürünleri',
        description: 'Taze balık ve deniz ürünleri restoranı',
        icon: '🐟',
        categories: [
            {
                name: 'Başlangıçlar',
                icon: '🥗',
                dishes: [
                    { name: 'Deniz Mahsullü Salata', description: 'Karışık deniz ürünleri, yeşillik', price: 130, image: '🥗', isPopular: true },
                    { name: 'Karidesli Güveç', description: 'Karides, domates, biber, kaşar', price: 140, image: '🦐', isPopular: true },
                    { name: 'Kalamar Tava', description: 'Çıtır kalamar, tarator sos', price: 120, image: '🦑', isPopular: true },
                    { name: 'Midye Tava', description: 'Çıtır midye, tarator sos', price: 100, image: '🐚', isPopular: false },
                    { name: 'Ahtapot Salatası', description: 'Marine ahtapot, zeytinyağı, limon', price: 150, image: '🐙', isPopular: false },
                ]
            },
            {
                name: 'Balıklar',
                icon: '🐟',
                dishes: [
                    { name: 'Levrek Izgara', description: 'Taze levrek, limon, salata ile', price: 280, image: '🐟', isPopular: true },
                    { name: 'Çipura Izgara', description: 'Taze çipura, pilav ile', price: 270, image: '🐟', isPopular: true },
                    { name: 'Somon Izgara', description: 'Norveç somonu, sebze garnisi', price: 300, image: '🐟', isPopular: true },
                    { name: 'Hamsi Tava', description: 'Mevsim hamsi, mısır unlu', price: 140, image: '🐟', isPopular: false },
                    { name: 'Palamut Izgara', description: 'Taze palamut, salata ile', price: 200, image: '🐟', isPopular: false },
                    { name: 'Balık Ekmek', description: 'Izgara balık, marul, soğan', price: 100, image: '🐟', isPopular: true },
                ]
            },
            {
                name: 'Tatlılar',
                icon: '🍰',
                dishes: [
                    { name: 'Profiterol', description: 'Çikolata soslu', price: 90, image: '🍫', isPopular: true },
                    { name: 'Muhallebi', description: 'Geleneksel sütlü tatlı', price: 70, image: '🍮', isPopular: false },
                    { name: 'Mevsim Meyve Tabağı', description: 'Karışık taze meyveler', price: 100, image: '🍇', isPopular: false },
                ]
            },
            {
                name: 'İçecekler',
                icon: '🥤',
                dishes: [
                    { name: 'Rakı (Tek)', description: '4cl Yeni Rakı', price: 80, image: '🥃', isPopular: true },
                    { name: 'Beyaz Şarap (Kadeh)', description: 'Ev şarabı', price: 90, image: '🍷', isPopular: false },
                    { name: 'Bira', description: 'Efes Pilsen 50cl', price: 70, image: '🍺', isPopular: false },
                    { name: 'Ayran', description: 'Ev yapımı', price: 25, image: '🥛', isPopular: false },
                    { name: 'Su', description: '0.5L', price: 10, image: '💧', isPopular: false },
                ]
            }
        ]
    },
    {
        id: 'empty',
        name: 'Boş Menü',
        description: 'Sıfırdan kendi menünüzü oluşturun',
        icon: '📝',
        categories: []
    }
];

// ============================================
// Hızlı Ekleme Kataloğu - Popüler Türk Yemekleri
// ============================================

export interface QuickAddCategory {
    name: string;
    icon: string;
    dishes: DishTemplate[];
}

export const quickAddCatalog: QuickAddCategory[] = [
    {
        name: '🥘 Kebaplar & Izgara',
        icon: '🥘',
        dishes: [
            { name: 'İskender Kebap', description: 'Döner, yoğurt, tereyağlı sos, pide', price: 220, image: '🍖', isPopular: true },
            { name: 'Adana Kebap', description: 'Acılı el kıyması, lavaş, közlenmiş sebze', price: 200, image: '🥙', isPopular: true },
            { name: 'Urfa Kebap', description: 'Acısız el kıyması, lavaş', price: 200, image: '🥙', isPopular: false },
            { name: 'Beyti Kebap', description: 'Kıyma, lavaş sarma, yoğurt, sos', price: 210, image: '🌯', isPopular: false },
            { name: 'Patlıcan Kebap', description: 'Kıyma, patlıcan, biber', price: 195, image: '🍆', isPopular: false },
            { name: 'Tavuk Şiş', description: 'Marine tavuk, pilav, sebze', price: 160, image: '🍗', isPopular: false },
            { name: 'Kuzu Şiş', description: 'Marine kuzu, pilav, közlenmiş sebze', price: 240, image: '🍖', isPopular: false },
            { name: 'Ciğer Kebap', description: 'Arnavut ciğeri, soğan, maydanoz', price: 170, image: '🍖', isPopular: false },
            { name: 'Izgara Köfte', description: '4 adet köfte, pilav, salata', price: 175, image: '🍔', isPopular: false },
            { name: 'Karışık Izgara', description: 'Adana, tavuk şiş, köfte, kanat', price: 280, image: '🥩', isPopular: true },
        ]
    },
    {
        name: '🍲 Çorbalar',
        icon: '🍲',
        dishes: [
            { name: 'Mercimek Çorbası', description: 'Kırmızı mercimek, havuç, soğan', price: 65, image: '🍲', isPopular: true },
            { name: 'Ezogelin Çorbası', description: 'Mercimek, bulgur, nane', price: 65, image: '🍲', isPopular: false },
            { name: 'Domates Çorbası', description: 'Kremalı domates', price: 60, image: '🍅', isPopular: false },
            { name: 'Tavuk Suyu Çorbası', description: 'Şehriyeli tavuk suyu', price: 65, image: '🍲', isPopular: false },
            { name: 'İşkembe Çorbası', description: 'Geleneksel, sarımsaklı sirke', price: 85, image: '🫕', isPopular: false },
            { name: 'Tarhana Çorbası', description: 'Ev yapımı tarhana', price: 60, image: '🍲', isPopular: false },
        ]
    },
    {
        name: '🫓 Pide & Lahmacun',
        icon: '🫓',
        dishes: [
            { name: 'Kıymalı Pide', description: 'Kıyma, domates, biber', price: 140, image: '🫓', isPopular: true },
            { name: 'Kaşarlı Pide', description: 'Kaşar peyniri', price: 130, image: '🫓', isPopular: false },
            { name: 'Kuşbaşılı Pide', description: 'Kuşbaşı et, domates, biber', price: 165, image: '🫓', isPopular: false },
            { name: 'Sucuklu Pide', description: 'Sucuk, kaşar peyniri', price: 145, image: '🫓', isPopular: false },
            { name: 'Lahmacun', description: 'İnce hamur, kıyma, maydanoz, limon', price: 70, image: '🫓', isPopular: true },
        ]
    },
    {
        name: '☕ Sıcak İçecekler',
        icon: '☕',
        dishes: [
            { name: 'Çay', description: 'Demli Türk çayı', price: 20, image: '🍵', isPopular: false },
            { name: 'Türk Kahvesi', description: 'Orta / sade / şekerli', price: 45, image: '☕', isPopular: false },
            { name: 'Latte', description: 'Espresso + köpüklü süt', price: 70, image: '☕', isPopular: true },
            { name: 'Cappuccino', description: 'Espresso + süt köpüğü', price: 70, image: '☕', isPopular: false },
            { name: 'Americano', description: 'Espresso + sıcak su', price: 55, image: '☕', isPopular: false },
            { name: 'Sıcak Çikolata', description: 'Bol köpüklü, fındıklı', price: 65, image: '🍫', isPopular: false },
            { name: 'Sahlep', description: 'Geleneksel, tarçınlı', price: 55, image: '🥛', isPopular: false },
        ]
    },
    {
        name: '🥤 Soğuk İçecekler',
        icon: '🥤',
        dishes: [
            { name: 'Ayran', description: 'Ev yapımı', price: 25, image: '🥛', isPopular: true },
            { name: 'Kola', description: '330ml', price: 30, image: '🥤', isPopular: false },
            { name: 'Fanta', description: '330ml', price: 30, image: '🥤', isPopular: false },
            { name: 'Limonata', description: 'Taze, naneli', price: 45, image: '🍋', isPopular: false },
            { name: 'Şalgam', description: 'Acılı / acısız', price: 30, image: '🥤', isPopular: false },
            { name: 'Taze Portakal Suyu', description: 'Sıkma', price: 65, image: '🍊', isPopular: false },
            { name: 'Su', description: '0.5L', price: 10, image: '💧', isPopular: false },
        ]
    },
    {
        name: '🍰 Tatlılar',
        icon: '🍰',
        dishes: [
            { name: 'Künefe', description: 'Kadayıf, peynir, şerbet, antep fıstığı', price: 120, image: '🍮', isPopular: true },
            { name: 'Baklava', description: 'Antep fıstıklı, 4 dilim', price: 130, image: '🍰', isPopular: true },
            { name: 'Sütlaç', description: 'Fırın sütlaç', price: 75, image: '🍮', isPopular: false },
            { name: 'Kazandibi', description: 'Karamellenmiş muhallebi', price: 75, image: '🍮', isPopular: false },
            { name: 'Kadayıf', description: 'Tel kadayıf, cevizli', price: 100, image: '🍰', isPopular: false },
            { name: 'Profiterol', description: 'Çikolata soslu', price: 90, image: '🍫', isPopular: false },
            { name: 'Dondurma', description: 'Maraş usulü, 2 top', price: 60, image: '🍦', isPopular: false },
        ]
    },
    {
        name: '🥗 Salatalar & Mezeler',
        icon: '🥗',
        dishes: [
            { name: 'Çoban Salata', description: 'Domates, salatalık, biber, soğan', price: 60, image: '🥗', isPopular: false },
            { name: 'Mevsim Salata', description: 'Yeşillikler, nar ekşisi sos', price: 65, image: '🥗', isPopular: false },
            { name: 'Sigara Böreği', description: 'Peynirli, 4 adet', price: 85, image: '🌯', isPopular: true },
            { name: 'Humus', description: 'Nohut ezmesi, tahin, zeytinyağı', price: 75, image: '🧆', isPopular: false },
            { name: 'Acılı Ezme', description: 'Biber, domates, maydanoz', price: 55, image: '🌶️', isPopular: false },
            { name: 'Çiğ Köfte', description: 'Lavaş ve nar ekşisi ile', price: 80, image: '🧆', isPopular: true },
        ]
    }
];
