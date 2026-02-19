// ============================================
// AI Engine - Smart Menu Intelligence
// ============================================
// Works 100% offline with built-in NLP rules.
// Can optionally connect to Gemini API if key is provided.
// ============================================

import type { MenuItem, MenuCategory, Restaurant } from './firebase';

// ============================================
// 1. AI Description Generator
// ============================================

const ADJECTIVES_TR: Record<string, string[]> = {
    kebap: ['lezzetli', 'közde pişirilmiş', 'geleneksel tarife göre hazırlanan', 'özenle marine edilmiş'],
    pizza: ['fırından yeni çıkmış', 'bol malzemeli', 'çıtır hamurlu', 'İtalyan usulü'],
    salata: ['taze', 'mevsim sebzeleriyle hazırlanan', 'hafif ve sağlıklı', 'vitamin deposu'],
    burger: ['el yapımı', 'ızgara köfteli', 'sulu ve lezzetli', 'özel soslu'],
    makarna: ['al dente pişirilmiş', 'ev yapımı soslu', 'İtalyan usulü', 'kremalı'],
    çorba: ['sıcacık', 'ev yapımı', 'geleneksel tarife göre hazırlanan', 'şifa kaynağı'],
    tatlı: ['ağızda eriyen', 'taze hazırlanan', 'ev yapımı', 'şefin özel tarifi'],
    kahve: ['taze çekilmiş', 'özenle demlenen', 'aromatik', 'zengin aromalı'],
    çay: ['demli', 'geleneksel', 'ince belli bardakta servis edilen', 'taze demlenen'],
    balık: ['taze', 'günlük taze temin edilen', 'mevsim balığından yapılan', 'ızgara'],
    et: ['yumuşacık', 'özenle pişirilen', 'dana etinden hazırlanan', 'lokum gibi'],
    tavuk: ['serbest gezen tavuktan', 'marine edilmiş', 'çıtır', 'ızgara'],
    default: ['özenle hazırlanan', 'lezzetli', 'şefin önerisi', 'enfes']
};

const ENDINGS_TR = [
    'Damak tadınıza hitap edecek.',
    'Mutlaka denemelisiniz!',
    'Tekrar tekrar sipariş vereceksiniz.',
    'Lezzet garantili.',
    'Favoriniz olacak.',
    'Vazgeçilmeziniz olacak.',
    'Bir kere deneyin, müdavimi olun.',
];

export function generateDescription(name: string, categoryName?: string): string {
    const lower = name.toLowerCase();
    const catLower = (categoryName || '').toLowerCase();

    // Find matching adjective category
    let adjectives = ADJECTIVES_TR.default;
    for (const [key, adjs] of Object.entries(ADJECTIVES_TR)) {
        if (lower.includes(key) || catLower.includes(key)) {
            adjectives = adjs;
            break;
        }
    }

    // Also check common subcategories
    if (catLower.includes('içecek') || catLower.includes('drink')) {
        adjectives = ADJECTIVES_TR.kahve;
    } else if (catLower.includes('ana') || catLower.includes('main')) {
        adjectives = ADJECTIVES_TR.et;
    } else if (catLower.includes('tatlı') || catLower.includes('dessert')) {
        adjectives = ADJECTIVES_TR.tatlı;
    }

    const adj1 = adjectives[Math.floor(Math.random() * adjectives.length)];
    let adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    while (adj2 === adj1 && adjectives.length > 1) {
        adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    }

    const ending = ENDINGS_TR[Math.floor(Math.random() * ENDINGS_TR.length)];

    return `${capitalize(adj1)}, ${adj2} ${name.toLowerCase()}. ${ending}`;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================
// 2. Smart Recommendations Engine
// ============================================

interface Recommendation {
    item: MenuItem;
    reason: string;
    score: number;
}

export function getSmartRecommendations(
    items: MenuItem[],
    _categories: MenuCategory[],
    _restaurant: Restaurant,
    maxCount: number = 4
): Recommendation[] {
    if (items.length === 0) return [];

    const hour = new Date().getHours();
    const recommendations: Recommendation[] = [];

    for (const item of items) {
        let score = 0;
        let reason = '';
        const lower = item.name.toLowerCase();
        const descLower = (item.description || '').toLowerCase();

        // Time-based scoring
        if (hour >= 6 && hour < 11) {
            // Breakfast time
            if (lower.includes('kahvaltı') || lower.includes('omlet') || lower.includes('börek') ||
                lower.includes('simit') || lower.includes('kahve') || lower.includes('çay') ||
                lower.includes('menemen') || lower.includes('toast') || lower.includes('krep') ||
                lower.includes('pancake') || lower.includes('yumurta')) {
                score += 30;
                reason = '☀️ Sabah kahvaltısı için ideal';
            }
        } else if (hour >= 11 && hour < 14) {
            // Lunch
            if (lower.includes('tabak') || lower.includes('döner') || lower.includes('kebap') ||
                lower.includes('pide') || lower.includes('lahmacun') || lower.includes('makarna') ||
                lower.includes('pilav') || lower.includes('tavuk') || lower.includes('salata') ||
                lower.includes('çorba') || lower.includes('burger') || lower.includes('pizza')) {
                score += 25;
                reason = '🍽️ Öğle yemeği favorisi';
            }
        } else if (hour >= 14 && hour < 17) {
            // Afternoon snack
            if (lower.includes('tatlı') || lower.includes('pasta') || lower.includes('kahve') ||
                lower.includes('çay') || lower.includes('kek') || lower.includes('waffle') ||
                lower.includes('dondurma') || lower.includes('cheesecake') || lower.includes('brownie')) {
                score += 25;
                reason = '🍰 İkindi molası için harika';
            }
        } else if (hour >= 17 && hour < 22) {
            // Dinner
            if (lower.includes('et') || lower.includes('steak') || lower.includes('kebap') ||
                lower.includes('balık') || lower.includes('karides') || lower.includes('biftek') ||
                lower.includes('izgara') || lower.includes('karışık')) {
                score += 25;
                reason = '🌙 Akşam yemeği için mükemmel';
            }
        } else {
            // Late night
            if (lower.includes('burger') || lower.includes('pizza') || lower.includes('tost') ||
                lower.includes('sandviç') || lower.includes('wrap')) {
                score += 20;
                reason = '🌃 Gece atıştırmalığı';
            }
        }

        // Popularity bonus
        if (item.isPopular) {
            score += 20;
            if (!reason) reason = '🔥 En çok tercih edilen';
        }

        // Discount bonus
        if (item.discountPrice && item.discountPrice < item.price) {
            const pct = Math.round((1 - item.discountPrice / item.price) * 100);
            score += 15;
            if (!reason) reason = `🏷️ %${pct} indirimli fırsat`;
        }

        // Calorie info bonus (health-conscious)
        if (item.calories && item.calories < 400) {
            score += 5;
            if (!reason) reason = '🥗 Hafif ve sağlıklı seçim';
        }

        // Prep time bonus (fast)
        if (item.preparationTime && item.preparationTime <= 10) {
            score += 5;
            if (!reason) reason = '⚡ Hızlı hazırlanan';
        }

        // Description richness
        if (descLower.length > 20) score += 3;

        // Image bonus
        if (item.image) score += 5;

        // Default reason
        if (!reason && score > 0) reason = '👨‍🍳 Şef önerisi';
        if (!reason) {
            reason = '✨ Keşfetmeniz için';
            score = 1; // minimum score so everything has a chance
        }

        recommendations.push({ item, reason, score });
    }

    // Sort by score, pick top N
    recommendations.sort((a, b) => b.score - a.score);

    // Don't show if max score is too low (nothing relevant)
    const topItems = recommendations.slice(0, maxCount);
    return topItems.filter(r => r.score >= 1);
}

// ============================================
// 3. AI Chat Assistant
// ============================================

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

// Per-item feedback stats for AI recommendations
export interface ItemFeedbackData {
    itemId: string;
    itemName: string;
    avgRating: number;
    reviewCount: number;
    recentComments: string[];  // last few comments
    thisWeekOrders: number;
    thisMonthOrders: number;
}

export class MenuAssistant {
    private items: MenuItem[];
    private categories: MenuCategory[];
    private restaurant: Restaurant;
    private history: ChatMessage[] = [];
    private feedbackData: ItemFeedbackData[] = [];

    constructor(items: MenuItem[], categories: MenuCategory[], restaurant: Restaurant, feedbackData?: ItemFeedbackData[]) {
        this.items = items.filter(i => i.isAvailable);
        this.categories = categories;
        this.restaurant = restaurant;
        if (feedbackData) this.feedbackData = feedbackData;
    }

    setFeedbackData(data: ItemFeedbackData[]): void {
        this.feedbackData = data;
    }

    getHistory(): ChatMessage[] {
        return this.history;
    }

    getGreeting(): string {
        const hour = new Date().getHours();
        let greeting = 'Merhaba';
        if (hour < 12) greeting = 'Günaydın';
        else if (hour < 18) greeting = 'İyi günler';
        else greeting = 'İyi akşamlar';

        const reviewInfo = this.feedbackData.length > 0
            ? `\n\n📊 Müşteri yorumlarına göre de önerilerde bulunabilirim!`
            : '';

        return `${greeting}! 🤖 Ben ${this.restaurant.name}'ın AI menü asistanıyım. Size yemek seçiminde yardımcı olabilirim!${reviewInfo}\n\n` +
            `Örneğin:\n• "En beğenilen yemekler hangileri?"\n• "Acı olmayan bir şey öner"\n• "Bu hafta en çok ne sipariş edilmiş?"\n• "Glütensiz seçenekler var mı?"\n• "Bana tatlı öner"`;
    }

    chat(userMessage: string): string {
        this.history.push({ role: 'user', text: userMessage });
        const msg = userMessage.toLowerCase().trim();

        let response = '';

        // Greeting detection
        if (msg.match(/^(merhaba|selam|hey|hi|hello|günaydın|iyi günler|nasılsın)/)) {
            response = this.handleGreeting();
        }
        // Price queries
        else if (msg.match(/(ucuz|uygun|ekonomik|bütçe|en ucuz|fiyat|pahalı|en pahalı)/)) {
            response = this.handlePriceQuery(msg);
        }
        // Allergen queries
        else if (msg.match(/(alerj|glüten|süt|laktoz|fıstık|fındık|yumurta|soya|balık|kabuk|vegan|vejetaryen|vejeteryan|helal|gluten)/)) {
            response = this.handleAllergenQuery(msg);
        }
        // Speed queries 
        else if (msg.match(/(hızlı|çabuk|acele|beklemek istemiyorum|kısa süre|hazırlan)/)) {
            response = this.handleSpeedQuery();
        }
        // Spicy queries
        else if (msg.match(/(acı|baharatlı|acısız|acı olmayan|hafif|yakıcı)/)) {
            response = this.handleSpicyQuery(msg);
        }
        // Category/type queries
        else if (msg.match(/(et|tavuk|balık|kebap|pizza|makarna|salata|çorba|tatlı|kahve|içecek|burger|döner|pide)/)) {
            response = this.handleCategoryQuery(msg);
        }
        // Feedback/review queries
        else if (msg.match(/(yorum|değerlendir|puan|rating|review|müşteri ne|beğen|favori|en iyi|bu hafta|bu ay|trend|ne sipariş)/)) {
            response = this.handleFeedbackQuery(msg);
        }
        // Popular queries
        else if (msg.match(/(popüler|tavsiye|öner|ne yesem|kararsız|seç)/)) {
            response = this.handleRecommendation();
        }
        // Calorie queries
        else if (msg.match(/(kalori|diyet|sağlıklı|hafif|düşük kalori|az kalori|fit|light)/)) {
            response = this.handleCalorieQuery();
        }
        // Campaign/discount queries 
        else if (msg.match(/(indirim|kampanya|fırsat|promosyon|ucuzluk)/)) {
            response = this.handleDiscountQuery();
        }
        // Menu overview
        else if (msg.match(/(menü|ne var|neler var|tüm|hepsi|kategori|bölüm)/)) {
            response = this.handleMenuOverview();
        }
        // Thanks
        else if (msg.match(/(teşekkür|sağol|eywallah|eyv|thanks|mersi)/)) {
            response = 'Rica ederim! 😊 Afiyet olsun! Başka bir konuda yardımcı olabilir miyim?';
        }
        // Fallback
        else {
            response = this.handleFallback(msg);
        }

        this.history.push({ role: 'assistant', text: response });
        return response;
    }

    private handleGreeting(): string {
        const itemCount = this.items.length;
        const catCount = this.categories.length;
        return `Hoş geldiniz! 😊 ${this.restaurant.name} menüsünde ${catCount} kategori ve ${itemCount} çeşit ürün bulunuyor. Ne tür bir şey arıyorsunuz?`;
    }

    private handlePriceQuery(msg: string): string {
        const sorted = [...this.items].sort((a, b) => {
            const pa = a.discountPrice || a.price;
            const pb = b.discountPrice || b.price;
            return pa - pb;
        });

        if (msg.match(/(pahalı|en pahalı)/)) {
            const top = sorted.slice(-3).reverse();
            return `💎 En premium ürünlerimiz:\n\n${this.formatItems(top)}`;
        }

        const cheap = sorted.slice(0, 3);
        return `💰 En uygun fiyatlı seçenekler:\n\n${this.formatItems(cheap)}\n\nBütçe dostu ve lezzetli!`;
    }

    private handleAllergenQuery(msg: string): string {
        let allergenKey = '';
        let label = '';

        if (msg.match(/(glüten|gluten)/)) { allergenKey = 'gluten'; label = 'glütensiz'; }
        else if (msg.match(/(süt|laktoz)/)) { allergenKey = 'dairy'; label = 'süt ürünü içermeyen'; }
        else if (msg.match(/(yumurta)/)) { allergenKey = 'eggs'; label = 'yumurta içermeyen'; }
        else if (msg.match(/(fıstık|fındık|ceviz)/)) { allergenKey = 'nuts'; label = 'kuruyemiş içermeyen'; }
        else if (msg.match(/(soya)/)) { allergenKey = 'soy'; label = 'soya içermeyen'; }
        else if (msg.match(/(balık)/)) { allergenKey = 'fish'; label = 'balık içermeyen'; }
        else if (msg.match(/(kabuk)/)) { allergenKey = 'shellfish'; label = 'kabuklu deniz ürünü içermeyen'; }
        else if (msg.match(/(vegan)/)) { allergenKey = 'vegan'; label = 'vegan'; }
        else if (msg.match(/(vejetaryen|vejeteryan)/)) { allergenKey = 'vegetarian'; label = 'vejetaryen'; }
        else if (msg.match(/(helal)/)) { allergenKey = 'halal'; label = 'helal'; }

        if (['vegan', 'vegetarian', 'halal'].includes(allergenKey)) {
            // These are "has" filters
            const matched = this.items.filter(i => i.allergens?.includes(allergenKey));
            if (matched.length === 0) {
                return `😔 Maalesef menüde "${label}" olarak işaretlenmiş bir ürün bulamadım. Restoran sahibinden bu bilgileri eklemesini isteyebilirsiniz.`;
            }
            return `${allergenKey === 'vegan' ? '🌱' : allergenKey === 'vegetarian' ? '🥗' : '☪️'} ${capitalize(label)} seçenekler:\n\n${this.formatItems(matched)}`;
        }

        if (allergenKey) {
            // These are "doesn't have" filters
            const safe = this.items.filter(i => !i.allergens?.includes(allergenKey));
            const unsafe = this.items.filter(i => i.allergens?.includes(allergenKey));

            if (unsafe.length === 0) {
                return `✅ Menüdeki hiçbir üründe ${allergenKey} alerjeni işaretlenmemiş. Ancak yine de garsonunuzla teyit etmenizi öneriyoruz.`;
            }

            const safeTop = safe.slice(0, 5);
            return `⚠️ ${capitalize(label)} ürünler:\n\n${this.formatItems(safeTop)}\n\n⚠️ Dikkat: ${unsafe.length} üründe ${allergenKey} bulunuyor. Alerjiniz varsa lütfen garsonunuzla da teyit edin.`;
        }

        return 'Hangi alerjeniniz var? Glüten, süt, yumurta, kuruyemiş, soya, balık gibi belirtirseniz size uygun seçenekleri bulabilirim.';
    }

    private handleSpeedQuery(): string {
        const fast = this.items
            .filter(i => i.preparationTime && i.preparationTime <= 15)
            .sort((a, b) => (a.preparationTime || 99) - (b.preparationTime || 99));

        if (fast.length === 0) {
            return '⏱️ Hazırlık süresi bilgisi henüz eklenmemiş ürünler var. Garsonunuza en hızlı hazırlanan yemekleri sorabilirsiniz!';
        }

        return `⚡ En hızlı hazırlanan lezzetler:\n\n${this.formatItems(fast.slice(0, 4))}\n\nBeklemeden lezzete ulaşın!`;
    }

    private handleSpicyQuery(msg: string): string {
        const isWantSpicy = msg.match(/(acı|baharatlı|yakıcı)/) && !msg.match(/(acısız|acı olmayan|acı istemiyorum)/);

        if (isWantSpicy) {
            const spicy = this.items.filter(i => i.allergens?.includes('spicy'));
            if (spicy.length > 0) {
                return `🌶️ Acılı lezzetlerimiz:\n\n${this.formatItems(spicy)}\n\nAteşli bir tercih! 🔥`;
            }
            return '🌶️ Menüde acılı olarak işaretlenmiş ürün bulamadım, ama garsonunuzdan acılı seçenekleri sorabilirsiniz!';
        }

        // Non-spicy
        const nonSpicy = this.items.filter(i => !i.allergens?.includes('spicy'));
        return `😌 Acı olmayan seçenekler:\n\n${this.formatItems(nonSpicy.slice(0, 5))}\n\nBunlar hafif ve lezzetli!`;
    }

    private handleCategoryQuery(msg: string): string {
        // Find matching items by keyword
        const keywords: Record<string, string[]> = {
            'et': ['et', 'steak', 'biftek', 'köfte', 'kuzu'],
            'tavuk': ['tavuk', 'chicken', 'piliç', 'kanat'],
            'balık': ['balık', 'somon', 'levrek', 'çipura', 'hamsi', 'fish'],
            'kebap': ['kebap', 'kebab', 'adana', 'urfa', 'iskender'],
            'pizza': ['pizza'],
            'makarna': ['makarna', 'pasta', 'spagetti', 'penne'],
            'salata': ['salata', 'salad'],
            'çorba': ['çorba', 'soup'],
            'tatlı': ['tatlı', 'dessert', 'pasta', 'baklava', 'künefe', 'sütlaç', 'cheesecake'],
            'kahve': ['kahve', 'coffee', 'latte', 'espresso', 'americano', 'cappuccino'],
            'içecek': ['içecek', 'drink', 'su', 'kola', 'ayran', 'meyve suyu', 'smoothie'],
            'burger': ['burger', 'hamburger'],
            'döner': ['döner', 'doner'],
            'pide': ['pide', 'lahmacun'],
        };

        for (const [key, terms] of Object.entries(keywords)) {
            if (msg.includes(key)) {
                const matched = this.items.filter(item => {
                    const n = item.name.toLowerCase();
                    const d = (item.description || '').toLowerCase();
                    return terms.some(t => n.includes(t) || d.includes(t));
                });

                // Also check category names
                const catMatched = this.categories
                    .filter(c => terms.some(t => c.name.toLowerCase().includes(t)))
                    .flatMap(c => this.items.filter(i => i.categoryId === c.id));

                const all = [...new Map([...matched, ...catMatched].map(i => [i.id, i])).values()];

                if (all.length === 0) {
                    return `😔 "${key}" ile ilgili bir ürün bulamadım. Ama menüde başka harika seçenekler var! Ne tür bir şey istersiniz?`;
                }

                return `🍴 "${capitalize(key)}" seçeneklerimiz:\n\n${this.formatItems(all.slice(0, 5))}${all.length > 5 ? `\n\n...ve ${all.length - 5} ürün daha!` : ''}`;
            }
        }

        return this.handleRecommendation();
    }

    private handleFeedbackQuery(msg: string): string {
        if (this.feedbackData.length === 0) {
            return '📊 Henüz yeterli müşteri değerlendirmesi yok. Ama popüler ürünlerimize bakabilirsiniz! "Ne önerirsin?" yazın.';
        }

        const isWeekly = msg.match(/(bu hafta|haftalık|son hafta)/);
        const isMonthly = msg.match(/(bu ay|aylık|son ay)/);

        // Sort by rating
        const sorted = [...this.feedbackData]
            .filter(f => f.reviewCount > 0)
            .sort((a, b) => {
                // Weighted: rating × log(reviewCount+1)
                const sa = a.avgRating * Math.log(a.reviewCount + 1);
                const sb = b.avgRating * Math.log(b.reviewCount + 1);
                return sb - sa;
            });

        if (sorted.length === 0) {
            return '📊 Henüz değerlendirme yapılmamış. İlk değerlendirmeyi siz yapabilirsiniz! 😊';
        }

        const top = sorted.slice(0, 5);
        const period = isWeekly ? 'Bu hafta' : isMonthly ? 'Bu ay' : 'Son dönemde';

        let response = `⭐ ${period} en beğenilen ürünlerimiz:\n\n`;
        top.forEach((f, i) => {
            const stars = '⭐'.repeat(Math.round(f.avgRating));
            const orderInfo = isWeekly && f.thisWeekOrders > 0
                ? ` · ${f.thisWeekOrders} sipariş`
                : isMonthly && f.thisMonthOrders > 0
                    ? ` · ${f.thisMonthOrders} sipariş`
                    : '';
            response += `${i + 1}. **${f.itemName}** ${stars} (${f.avgRating.toFixed(1)}/5 · ${f.reviewCount} değerlendirme${orderInfo})\n`;

            // Show a recent comment if available
            if (f.recentComments.length > 0) {
                response += `   💬 "${f.recentComments[0]}"\n`;
            }
            response += '\n';
        });

        response += 'Müşterilerimizin favorileri! Hangisini denemek istersiniz?';
        return response;
    }

    private handleRecommendation(): string {
        const recs = getSmartRecommendations(this.items, this.categories, this.restaurant, 4);
        if (recs.length === 0) return 'Menü bilgileri yükleniyor...';

        let response = '🎯 Size özel önerilerim:\n\n';
        recs.forEach((r, i) => {
            const price = r.item.discountPrice || r.item.price;
            // Add feedback info if available
            const fb = this.feedbackData.find(f => f.itemId === r.item.id);
            const ratingInfo = fb && fb.reviewCount > 0
                ? ` · ⭐${fb.avgRating.toFixed(1)} (${fb.reviewCount} yorum)`
                : '';
            response += `${i + 1}. **${r.item.name}** - ${this.restaurant.currency}${price.toFixed(2)}${ratingInfo}\n   ${r.reason}\n\n`;
        });
        response += 'Hangisi ilginizi çekti? Detay için ürün adını yazabilirsiniz!';
        return response;
    }

    private handleCalorieQuery(): string {
        const withCalories = this.items.filter(i => i.calories);
        if (withCalories.length === 0) {
            return '📊 Henüz kalori bilgisi eklenmiş ürün bulamadım. Sağlıklı seçenekler için salata veya ızgara ürünleri deneyebilirsiniz!';
        }

        const low = withCalories.filter(i => i.calories! < 400).sort((a, b) => a.calories! - b.calories!);
        if (low.length > 0) {
            return `🥗 Düşük kalorili seçenekler (400 kcal altı):\n\n${this.formatItems(low.slice(0, 4))}\n\nHafif ve fit! 💪`;
        }

        const sorted = [...withCalories].sort((a, b) => a.calories! - b.calories!);
        return `📊 En düşük kalorili ürünlerimiz:\n\n${this.formatItems(sorted.slice(0, 4))}`;
    }

    private handleDiscountQuery(): string {
        const discounted = this.items.filter(i => i.discountPrice && i.discountPrice < i.price);
        if (discounted.length === 0) {
            return '🏷️ Şu anda aktif kampanya bulunmuyor. Ama en uygun fiyatlı seçenekler için "ucuz" yazabilirsiniz!';
        }

        let response = '🏷️ Aktif kampanyalar:\n\n';
        discounted.forEach(item => {
            const pct = Math.round((1 - item.discountPrice! / item.price) * 100);
            response += `• **${item.name}** ~~${this.restaurant.currency}${item.price.toFixed(2)}~~ → ${this.restaurant.currency}${item.discountPrice!.toFixed(2)} (-%${pct})\n`;
        });
        response += '\nFırsatı kaçırmayın! 🔥';
        return response;
    }

    private handleMenuOverview(): string {
        let response = `📋 ${this.restaurant.name} Menüsü:\n\n`;
        this.categories.forEach(cat => {
            const catItems = this.items.filter(i => i.categoryId === cat.id);
            if (catItems.length > 0) {
                response += `${cat.icon || '📁'} **${cat.name}** (${catItems.length} çeşit)\n`;
            }
        });
        response += `\nToplam ${this.items.length} ürün. Hangi kategoriyi incelemek istersiniz?`;
        return response;
    }

    private handleFallback(msg: string): string {
        // Try to find items matching the query text
        const matched = this.items.filter(item => {
            const n = item.name.toLowerCase();
            const d = (item.description || '').toLowerCase();
            return msg.split(' ').some(w => w.length > 2 && (n.includes(w) || d.includes(w)));
        });

        if (matched.length > 0) {
            return `🔍 Aradığınızla eşleşen ürünler:\n\n${this.formatItems(matched.slice(0, 4))}`;
        }

        return `Tam anlayamadım 😅 Ama size yardımcı olmaya çalışayım!\n\nŞunları sorabilirsiniz:\n• "Ne önerirsin?"\n• "Acısız bir şey istiyorum"\n• "Glütensiz seçenekler"\n• "En ucuz ne var?"\n• "Hızlı ne hazırlanır?"`;
    }

    private formatItems(items: MenuItem[]): string {
        return items.map(item => {
            const price = item.discountPrice || item.price;
            const originalPrice = item.discountPrice ? ` ~~${this.restaurant.currency}${item.price.toFixed(2)}~~` : '';
            const calories = item.calories ? ` · ${item.calories} kcal` : '';
            const prep = item.preparationTime ? ` · ⏱️${item.preparationTime}dk` : '';
            // Add rating if available
            const fb = this.feedbackData.find(f => f.itemId === item.id);
            const rating = fb && fb.reviewCount > 0 ? ` · ⭐${fb.avgRating.toFixed(1)}` : '';
            return `• **${item.name}** - ${this.restaurant.currency}${price.toFixed(2)}${originalPrice}${calories}${prep}${rating}\n  ${item.description || ''}`;
        }).join('\n\n');
    }
}
