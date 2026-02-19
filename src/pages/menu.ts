// ============================================
// Public Menu View - Customer Facing Page
// ============================================
// Müşterinin QR kodu okuttuğunda gördüğü sayfa
// Sipariş, garson çağırma, alerjen, çoklu dil, kampanya

import { localDB } from '../firebase';
import type { Restaurant, MenuCategory, MenuItem } from '../firebase';
import { MenuAssistant, getSmartRecommendations } from '../ai';
import type { ItemFeedbackData } from '../ai';

// ============================================
// Allergen Definitions
// ============================================
const ALLERGEN_LIST: Record<string, { icon: string; tr: string; en: string }> = {
  gluten: { icon: '🌾', tr: 'Gluten', en: 'Gluten' },
  dairy: { icon: '🥛', tr: 'Süt Ürünleri', en: 'Dairy' },
  eggs: { icon: '🥚', tr: 'Yumurta', en: 'Eggs' },
  nuts: { icon: '🥜', tr: 'Kuruyemiş', en: 'Nuts' },
  soy: { icon: '🫘', tr: 'Soya', en: 'Soy' },
  fish: { icon: '🐟', tr: 'Balık', en: 'Fish' },
  shellfish: { icon: '🦐', tr: 'Kabuklu Deniz Ürünü', en: 'Shellfish' },
  sesame: { icon: '🫗', tr: 'Susam', en: 'Sesame' },
  celery: { icon: '🥬', tr: 'Kereviz', en: 'Celery' },
  mustard: { icon: '🟡', tr: 'Hardal', en: 'Mustard' },
  spicy: { icon: '🌶️', tr: 'Acı', en: 'Spicy' },
  vegan: { icon: '🌱', tr: 'Vegan', en: 'Vegan' },
  vegetarian: { icon: '🥗', tr: 'Vejetaryen', en: 'Vegetarian' },
  halal: { icon: '☪️', tr: 'Helal', en: 'Halal' },
};

const LANG_LABELS: Record<string, string> = {
  tr: '🇹🇷 Türkçe',
  en: '🇬🇧 English',
  ar: '🇸🇦 العربية',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  ru: '🇷🇺 Русский',
};

// ============================================
// Cart State
// ============================================
interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

let cart: CartItem[] = [];
let currentLang = 'tr';
let currentTableNumber: number | null = null;

function getItemName(item: MenuItem): string {
  if (currentLang !== 'tr' && item.translations?.[currentLang]?.name) {
    return item.translations[currentLang].name;
  }
  return item.name;
}

function getItemDesc(item: MenuItem): string {
  if (currentLang !== 'tr' && item.translations?.[currentLang]?.description) {
    return item.translations[currentLang].description;
  }
  return item.description;
}

function getCatName(cat: MenuCategory): string {
  if (currentLang !== 'tr' && cat.translations?.[currentLang]) {
    return cat.translations[currentLang];
  }
  return cat.name;
}

// ============================================
// Main Render
// ============================================
export async function renderMenu(app: HTMLElement, slug: string): Promise<void> {
  // Parse table number from URL hash fragment: #/menu/slug?table=3
  const hashParts = location.hash.split('?');
  if (hashParts.length > 1) {
    const params = new URLSearchParams(hashParts[1]);
    const tableParam = params.get('table');
    if (tableParam) currentTableNumber = parseInt(tableParam);
  }

  // Show loading
  app.innerHTML = `
    <div class="menu-loading">
      <div class="spinner" style="width: 40px; height: 40px;"></div>
      <p style="margin-top: 1rem; color: var(--color-neutral-400);">Menü yükleniyor...</p>
    </div>
  `;

  const restaurant = await localDB.getRestaurantBySlug(slug);
  if (!restaurant) {
    app.innerHTML = `
      <div class="menu-error">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🍽️</div>
        <h2>Menü Bulunamadı</h2>
        <p style="color: var(--color-neutral-400); margin-top: 0.5rem;">Bu menü artık mevcut değil veya kaldırılmış olabilir.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 1.5rem;">Ana Sayfaya Dön</a>
      </div>
    `;
    return;
  }

  const categories = await localDB.getCategories(restaurant.id);
  const allItems = await localDB.getItems(restaurant.id);
  const availableItems = allItems.filter(i => i.isAvailable);
  const themeColor = restaurant.themeColor || '#f97316';

  // Reset cart for new menu
  cart = [];
  currentLang = 'tr';

  renderMenuPage(app, restaurant, categories, availableItems, themeColor);
}

// ============================================
// Build per-item feedback data for AI assistant
// ============================================
async function buildItemFeedbackData(restaurantId: string, items: MenuItem[]): Promise<ItemFeedbackData[]> {
  // Read feedbacks and orders from Firestore
  let feedbacks: any[] = [];
  let orders: any[] = [];
  try {
    feedbacks = await localDB.getFeedbacks(restaurantId);
    orders = await localDB.getOrders(restaurantId);
  } catch {
    return [];
  }

  if (feedbacks.length === 0) return [];

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  // Map orderId -> feedback
  const feedbackByOrder: Record<string, { rating: number; comment?: string }[]> = {};
  for (const fb of feedbacks) {
    if (!fb.orderId) continue;
    if (!feedbackByOrder[fb.orderId]) feedbackByOrder[fb.orderId] = [];
    feedbackByOrder[fb.orderId].push({ rating: fb.rating, comment: fb.comment });
  }

  // Map orderId -> order items
  const orderById: Record<string, any> = {};
  for (const order of orders) {
    orderById[order.id] = order;
  }

  // Build per-item stats
  const itemStats: Record<string, { ratings: number[]; comments: string[]; weekOrders: number; monthOrders: number }> = {};

  // Initialize all items
  for (const item of items) {
    itemStats[item.id] = { ratings: [], comments: [], weekOrders: 0, monthOrders: 0 };
  }

  // Count orders per item (weekly/monthly)
  for (const order of orders) {
    const age = now - (order.createdAt || 0);
    if (order.items) {
      for (const oi of order.items) {
        const matchedItem = items.find(i => i.name === oi.name);
        if (matchedItem && itemStats[matchedItem.id]) {
          if (age <= oneWeek) itemStats[matchedItem.id].weekOrders += oi.quantity || 1;
          if (age <= oneMonth) itemStats[matchedItem.id].monthOrders += oi.quantity || 1;
        }
      }
    }
  }

  // Apply feedback ratings to items via orders
  for (const [orderId, fbs] of Object.entries(feedbackByOrder)) {
    const order = orderById[orderId];
    if (!order || !order.items) continue;

    for (const fb of fbs) {
      for (const oi of order.items) {
        const matchedItem = items.find(i => i.name === oi.name);
        if (matchedItem && itemStats[matchedItem.id]) {
          itemStats[matchedItem.id].ratings.push(fb.rating);
          if (fb.comment) itemStats[matchedItem.id].comments.push(fb.comment);
        }
      }
    }
  }

  // Convert to ItemFeedbackData array
  const result: ItemFeedbackData[] = [];
  for (const item of items) {
    const stats = itemStats[item.id];
    if (stats.ratings.length > 0 || stats.weekOrders > 0 || stats.monthOrders > 0) {
      const avg = stats.ratings.length > 0
        ? stats.ratings.reduce((s, r) => s + r, 0) / stats.ratings.length
        : 0;
      result.push({
        itemId: item.id,
        itemName: item.name,
        avgRating: avg,
        reviewCount: stats.ratings.length,
        recentComments: stats.comments.slice(-3),
        thisWeekOrders: stats.weekOrders,
        thisMonthOrders: stats.monthOrders,
      });
    }
  }

  return result;
}

function renderMenuPage(
  app: HTMLElement,
  restaurant: Restaurant,
  categories: MenuCategory[],
  availableItems: MenuItem[],
  themeColor: string
): void {
  const langs = restaurant.languages && restaurant.languages.length > 1 ? restaurant.languages : null;
  const hasOrdering = restaurant.enableOrdering;
  const hasWaiterCall = restaurant.enableWaiterCall;
  const popularItems = availableItems.filter(i => i.isPopular);

  app.innerHTML = `
    <div class="menu-page" style="--menu-theme: ${themeColor}; --menu-theme-light: ${themeColor}22; --menu-theme-mid: ${themeColor}44;">
      
      <!-- Menu Header -->
      <header class="menu-header">
        <div class="menu-header-bg" style="background: linear-gradient(135deg, ${themeColor}33, ${themeColor}11, var(--surface-bg));"></div>
        <div class="menu-header-content">
          ${langs ? `
            <div class="menu-lang-switcher" id="lang-switcher">
              ${langs.map(l => `
                <button class="menu-lang-btn ${l === currentLang ? 'active' : ''}" data-lang="${l}" style="--tab-color: ${themeColor};">${LANG_LABELS[l] || l}</button>
              `).join('')}
            </div>
          ` : ''}
          <div class="menu-logo-area">
            <div class="menu-restaurant-logo" style="background: ${themeColor}22; border-color: ${themeColor}44;">
              🍽️
            </div>
            <h1 class="menu-restaurant-name">${restaurant.name}</h1>
            ${restaurant.description ? `<p class="menu-restaurant-desc">${restaurant.description}</p>` : ''}
          </div>
          <div class="menu-restaurant-info">
            ${restaurant.phone ? `<a href="tel:${restaurant.phone}" class="menu-info-item menu-info-link">📞 ${restaurant.phone}</a>` : ''}
            ${restaurant.address ? `<span class="menu-info-item">📍 ${restaurant.address}</span>` : ''}
            ${restaurant.workingHours ? `<span class="menu-info-item">🕐 ${restaurant.workingHours}</span>` : ''}
          </div>
          ${restaurant.socialLinks ? `
            <div class="menu-social-links">
              ${restaurant.socialLinks.instagram ? `<a href="https://instagram.com/${restaurant.socialLinks.instagram}" target="_blank" class="menu-social-btn" title="Instagram">📸</a>` : ''}
              ${restaurant.socialLinks.facebook ? `<a href="${restaurant.socialLinks.facebook}" target="_blank" class="menu-social-btn" title="Facebook">📘</a>` : ''}
              ${restaurant.socialLinks.website ? `<a href="${restaurant.socialLinks.website}" target="_blank" class="menu-social-btn" title="Web Sitesi">🌐</a>` : ''}
            </div>
          ` : ''}

          <!-- Action Buttons: Waiter Call + Table -->
          ${hasWaiterCall && currentTableNumber ? `
            <button class="menu-waiter-btn" id="call-waiter-btn" style="background: ${themeColor};">
              🔔 Garson Çağır (Masa ${currentTableNumber})
            </button>
          ` : ''}
        </div>
      </header>

      <!-- Category Tabs -->
      ${categories.length > 0 ? `
        <nav class="menu-category-nav" id="category-nav">
          <div class="menu-category-tabs" id="category-tabs">
            <button class="menu-cat-tab active" data-cat="all" style="--tab-color: ${themeColor};">
              🍽️ ${currentLang === 'tr' ? 'Tümü' : 'All'}
            </button>
            ${popularItems.length > 0 ? `
              <button class="menu-cat-tab" data-cat="popular" style="--tab-color: ${themeColor};">
                ⭐ ${currentLang === 'tr' ? 'Popüler' : 'Popular'}
              </button>
            ` : ''}
            ${categories.map(cat => `
              <button class="menu-cat-tab" data-cat="${cat.id}" style="--tab-color: ${themeColor};">
                ${cat.icon || '📁'} ${getCatName(cat)}
              </button>
            `).join('')}
          </div>
        </nav>
      ` : ''}

      <!-- Search Bar -->
      <div class="menu-search-bar">
        <div class="menu-search-input-wrap" style="--search-theme: ${themeColor};">
          <span class="menu-search-icon">🔍</span>
          <input type="text" class="menu-search-input" id="menu-search" placeholder="${currentLang === 'tr' ? 'Yemek ara...' : 'Search...'}" autocomplete="off">
        </div>
      </div>

      <!-- Menu Items -->
      <main class="menu-items-container">
        <!-- AI Smart Recommendations -->
        ${(() => {
      const recs = getSmartRecommendations(availableItems, categories, restaurant, 4);
      if (recs.length === 0 || recs[0].score < 5) return '';
      return `
          <section class="menu-section ai-recs-section" data-section="ai-recs">
            <div class="menu-section-header">
              <span class="menu-section-icon">🤖</span>
              <h2 class="menu-section-title">${currentLang === 'tr' ? 'Size Özel Öneriler' : 'Recommendations for You'}</h2>
              <div class="menu-section-line" style="background: linear-gradient(90deg, #8b5cf6, ${themeColor});"></div>
            </div>
            <div class="ai-recs-scroll">
              ${recs.map(r => `
                <div class="ai-rec-card menu-item" data-item-id="${r.item.id}" data-name="${getItemName(r.item)}" data-desc="${getItemDesc(r.item)}" style="--rec-color: ${themeColor};">
                  <div class="ai-rec-image">
                    ${r.item.image?.startsWith('data:') ? `<img src="${r.item.image}" alt="${r.item.name}" />` : `<span class="ai-rec-emoji">${r.item.image || '🍽️'}</span>`}
                  </div>
                  <div class="ai-rec-info">
                    <div class="ai-rec-reason">${r.reason}</div>
                    <div class="ai-rec-name">${getItemName(r.item)}</div>
                    <div class="ai-rec-price" style="color: ${themeColor};">${r.item.discountPrice ? `<s style="color:var(--color-neutral-500);font-size:0.7rem;">${restaurant.currency}${r.item.price.toFixed(2)}</s> ` : ''}${restaurant.currency}${(r.item.discountPrice || r.item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
          `;
    })()}

        <!-- Popular Section -->
        ${popularItems.length > 0 ? `
          <section class="menu-section" data-section="popular">
            <div class="menu-section-header">
              <span class="menu-section-icon">⭐</span>
              <h2 class="menu-section-title">${currentLang === 'tr' ? 'Popüler Ürünler' : 'Popular Items'}</h2>
              <div class="menu-section-line" style="background: ${themeColor}33;"></div>
            </div>
            <div class="menu-items-list">
              ${popularItems.map(item => renderMenuItem(item, restaurant, themeColor, hasOrdering)).join('')}
            </div>
          </section>
        ` : ''}

        ${categories.length === 0 ? `
          <div class="menu-empty">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <p>Menü henüz hazırlanıyor...</p>
          </div>
        ` : ''}

        ${categories.map(cat => {
      const catItems = availableItems.filter(i => i.categoryId === cat.id);
      if (catItems.length === 0) return '';
      return `
            <section class="menu-section" data-section="${cat.id}">
              <div class="menu-section-header">
                <span class="menu-section-icon">${cat.icon || '📁'}</span>
                <h2 class="menu-section-title">${getCatName(cat)}</h2>
                <div class="menu-section-line" style="background: ${themeColor}33;"></div>
              </div>
              <div class="menu-items-list">
                ${catItems.map(item => renderMenuItem(item, restaurant, themeColor, hasOrdering)).join('')}
              </div>
            </section>
          `;
    }).join('')}
      </main>

      <!-- Cart Floating Button -->
      ${hasOrdering ? `
        <div class="menu-cart-fab" id="cart-fab" style="display: none; background: ${themeColor};">
          🛒 <span id="cart-count">0</span> ${currentLang === 'tr' ? 'ürün' : 'items'} - <span id="cart-total">₺0.00</span>
        </div>
      ` : ''}

      <!-- Hesap / Ödeme Button - shown after ordering -->
      <button class="request-bill-fab" id="request-bill-fab" style="display: none; --bill-color: ${themeColor};">
        💳 ${currentLang === 'tr' ? 'Hesap / Ödeme' : 'Pay / Bill'}
      </button>

      <!-- AI Chat FAB -->
      <button class="ai-chat-fab" id="ai-chat-fab" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);" title="AI Menü Asistanı">
        🤖
      </button>

      <!-- AI Chat Drawer -->
      <div class="ai-chat-drawer" id="ai-chat-drawer">
        <div class="ai-chat-header" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);">
          <div class="ai-chat-header-info">
            <span style="font-size: 1.5rem;">🤖</span>
            <div>
              <div class="ai-chat-header-title">AI Menü Asistanı</div>
              <div class="ai-chat-header-sub">${restaurant.name}</div>
            </div>
          </div>
          <button class="ai-chat-close" id="ai-chat-close">✕</button>
        </div>
        <div class="ai-chat-messages" id="ai-chat-messages"></div>
        <div class="ai-chat-input-area">
          <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="${currentLang === 'tr' ? 'Örn: Acısız bir şey öner...' : 'Ask about the menu...'}" autocomplete="off">
          <button class="ai-chat-send" id="ai-chat-send" style="background: ${themeColor};">➤</button>
        </div>
      </div>

      <!-- Powered by footer -->
      <footer class="menu-footer">
        <a href="#/" class="menu-powered-by">
          Powered by <strong>Menü<span style="color: ${themeColor};">QR</span></strong> · AI Destekli
        </a>
      </footer>

      <!-- Cart Drawer (hidden) -->
      ${hasOrdering ? renderCartDrawer(restaurant, themeColor) : ''}
    </div>
  `;

  // ============================================
  // Bind Events
  // ============================================

  // Category tabs
  const tabs = document.querySelectorAll('.menu-cat-tab');
  const sections = document.querySelectorAll('.menu-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const catId = (tab as HTMLElement).dataset.cat;
      if (catId === 'all') {
        sections.forEach(s => (s as HTMLElement).style.display = '');
      } else {
        sections.forEach(s => {
          (s as HTMLElement).style.display = (s as HTMLElement).dataset.section === catId ? '' : 'none';
        });
      }
    });
  });

  // Sticky nav shadow
  const nav = document.getElementById('category-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('menu-nav-sticky', window.scrollY > 200);
    });
  }

  // Search
  const searchInput = document.getElementById('menu-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      document.querySelectorAll('.menu-item').forEach(el => {
        const name = el.getAttribute('data-name')?.toLowerCase() || '';
        const desc = el.getAttribute('data-desc')?.toLowerCase() || '';
        (el as HTMLElement).style.display = (!query || name.includes(query) || desc.includes(query)) ? '' : 'none';
      });
      // Show all sections when searching
      if (query) {
        sections.forEach(s => (s as HTMLElement).style.display = '');
        tabs.forEach(t => t.classList.remove('active'));
      }
    });
  }

  // Language switcher
  document.querySelectorAll('.menu-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = (btn as HTMLElement).dataset.lang || 'tr';
      renderMenuPage(app, restaurant, categories, availableItems, themeColor);
    });
  });

  // Waiter call
  document.getElementById('call-waiter-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('call-waiter-btn')!;
    btn.innerHTML = '✅ Garson Çağrıldı!';
    btn.classList.add('waiter-called');
    (btn as HTMLButtonElement).disabled = true;
    await localDB.callWaiter(restaurant.id, currentTableNumber!);
    // Send WhatsApp notification if configured
    if (restaurant.whatsappNumber && (restaurant.orderNotifyType === 'whatsapp' || restaurant.orderNotifyType === 'both')) {
      const msg = `🔔 Masa ${currentTableNumber} garson çağırıyor! - ${restaurant.name}`;
      window.open(`https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    setTimeout(() => {
      btn.innerHTML = `🔔 Garson Çağır (Masa ${currentTableNumber})`;
      btn.classList.remove('waiter-called');
      (btn as HTMLButtonElement).disabled = false;
    }, 30000);
  });

  // Add to cart buttons
  if (hasOrdering) {
    document.querySelectorAll('.menu-add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = (btn as HTMLElement).dataset.itemId!;
        const item = availableItems.find(i => i.id === itemId);
        if (!item) return;
        addToCart(item, restaurant);
      });
    });

    // Cart FAB
    document.getElementById('cart-fab')?.addEventListener('click', () => {
      document.getElementById('cart-drawer')?.classList.add('open');
    });
  }

  // Item detail modal
  document.querySelectorAll('.menu-item').forEach(el => {
    el.addEventListener('click', () => {
      const itemId = (el as HTMLElement).dataset.itemId;
      const item = availableItems.find(i => i.id === itemId);
      if (item) showItemDetail(item, restaurant, themeColor, hasOrdering);
    });
  });

  // Cart drawer events
  if (hasOrdering) {
    bindCartDrawerEvents(restaurant);
  }

  // ============================================
  // AI Chat Assistant (with feedback awareness)
  // ============================================
  let assistant = new MenuAssistant(availableItems, categories, restaurant);
  // Load feedback data async and update assistant
  (async () => {
    try {
      const feedbackData = await buildItemFeedbackData(restaurant.id, availableItems);
      assistant.setFeedbackData(feedbackData);
    } catch { /* feedback data is optional */ }
  })();
  const chatDrawer = document.getElementById('ai-chat-drawer');
  const chatMessages = document.getElementById('ai-chat-messages');
  const chatInput = document.getElementById('ai-chat-input') as HTMLInputElement;
  const chatFab = document.getElementById('ai-chat-fab');

  // Show greeting when opened
  let chatOpened = false;

  function addChatMessage(text: string, role: 'user' | 'assistant') {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `ai-chat-msg ai-chat-msg-${role}`;
    // Simple markdown-like formatting
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n/g, '<br>');
    div.innerHTML = formatted;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatFab?.addEventListener('click', () => {
    chatDrawer?.classList.toggle('open');
    if (!chatOpened && chatMessages) {
      chatOpened = true;
      addChatMessage(assistant.getGreeting(), 'assistant');
    }
    setTimeout(() => chatInput?.focus(), 300);
  });

  document.getElementById('ai-chat-close')?.addEventListener('click', () => {
    chatDrawer?.classList.remove('open');
  });

  function sendChatMessage() {
    const text = chatInput?.value.trim();
    if (!text) return;
    addChatMessage(text, 'user');
    chatInput.value = '';

    // Simulate typing delay
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-chat-msg ai-chat-msg-assistant ai-chat-typing';
    typingDiv.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
    chatMessages?.appendChild(typingDiv);
    chatMessages!.scrollTop = chatMessages!.scrollHeight;

    setTimeout(() => {
      typingDiv.remove();
      const response = assistant.chat(text);
      addChatMessage(response, 'assistant');
    }, 400 + Math.random() * 600);
  }

  document.getElementById('ai-chat-send')?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  // ============================================
  // "Hesap / Ödeme" → Payment Modal → Feedback
  // ============================================
  document.getElementById('request-bill-fab')?.addEventListener('click', () => {
    const billBtn = document.getElementById('request-bill-fab') as HTMLButtonElement;
    if (!billBtn || billBtn.disabled) return;

    const slug = location.hash.match(/#\/menu\/([^?]+)/)?.[1] || '';
    const raw = localStorage.getItem(`pending_feedback_${slug}`);
    if (!raw) return;
    const pending = JSON.parse(raw);

    // Calculate total from last order
    const allOrders = JSON.parse(localStorage.getItem('mqr_orders') || '[]');
    const order = allOrders.find((o: any) => o.id === pending.orderId);
    const total = order?.total || 0;
    const items = order?.items || [];

    showPaymentModal(total, items, pending.orderId, pending.restaurantId, billBtn);
  });

  // ============================================
  // Check for pending feedback on page load
  // ============================================
  const menuSlug = location.hash.match(/#\/menu\/([^?]+)/)?.[1] || '';
  const pendingRaw = localStorage.getItem(`pending_feedback_${menuSlug}`);
  if (pendingRaw) {
    (async () => {
      try {
        const pending = JSON.parse(pendingRaw);
        const billBtn = document.getElementById('request-bill-fab');
        if (billBtn) billBtn.style.display = 'flex';

        const feedbacks = await localDB.getFeedbacks(pending.restaurantId);
        const alreadyRated = feedbacks.some(f => f.orderId === pending.orderId);
        if (alreadyRated) {
          localStorage.removeItem(`pending_feedback_${menuSlug}`);
          if (billBtn) billBtn.style.display = 'none';
        }
      } catch {
        localStorage.removeItem(`pending_feedback_${menuSlug}`);
      }
    })();
  }
}

// ============================================
// Render Single Menu Item
// ============================================
function renderMenuItem(item: MenuItem, restaurant: Restaurant, themeColor: string, hasOrdering?: boolean): string {
  const name = getItemName(item);
  const desc = getItemDesc(item);
  const hasDiscount = item.discountPrice && item.discountPrice < item.price;
  const allergenTags = item.allergens?.map(a => ALLERGEN_LIST[a]?.icon || '').filter(Boolean).join(' ') || '';

  return `
    <div class="menu-item ${item.isPopular ? 'menu-item-popular' : ''}" style="--item-theme: ${themeColor};" data-item-id="${item.id}" data-name="${name}" data-desc="${desc}">
      ${item.image?.startsWith('data:') ? `<img class="menu-item-photo" src="${item.image}" alt="${name}" />` : `<div class="menu-item-emoji">${item.image || '🍽️'}</div>`}
      <div class="menu-item-content">
        <div class="menu-item-header">
          <h3 class="menu-item-name">
            ${name}
            ${item.isPopular ? `<span class="menu-item-badge" style="background: ${themeColor}22; color: ${themeColor};">⭐</span>` : ''}
          </h3>
          <div class="menu-item-price-area">
            ${hasDiscount ? `
              <span class="menu-item-old-price">${restaurant.currency}${item.price.toFixed(2)}</span>
              <span class="menu-item-price menu-item-discount-price" style="color: ${themeColor};">${restaurant.currency}${item.discountPrice!.toFixed(2)}</span>
            ` : `
              <span class="menu-item-price" style="color: ${themeColor};">${restaurant.currency}${item.price.toFixed(2)}</span>
            `}
          </div>
        </div>
        ${desc ? `<p class="menu-item-desc">${desc}</p>` : ''}
        <div class="menu-item-meta">
          ${allergenTags ? `<span class="menu-item-allergens">${allergenTags}</span>` : ''}
          ${item.calories ? `<span class="menu-item-calories">🔥 ${item.calories} kcal</span>` : ''}
          ${item.preparationTime ? `<span class="menu-item-prep-time">⏱️ ${item.preparationTime} dk</span>` : ''}
        </div>
      </div>
      ${hasOrdering ? `
        <button class="menu-add-to-cart" data-item-id="${item.id}" style="background: ${themeColor};" title="Sepete Ekle">
          +
        </button>
      ` : ''}
    </div>
  `;
}

// ============================================
// Item Detail Modal
// ============================================
function showItemDetail(item: MenuItem, restaurant: Restaurant, themeColor: string, hasOrdering?: boolean): void {
  const name = getItemName(item);
  const desc = getItemDesc(item);
  const hasDiscount = item.discountPrice && item.discountPrice < item.price;
  const effectivePrice = hasDiscount ? item.discountPrice! : item.price;

  const overlay = document.createElement('div');
  overlay.className = 'menu-detail-overlay';
  overlay.innerHTML = `
    <div class="menu-detail-modal" style="--detail-theme: ${themeColor};">
      <button class="menu-detail-close" id="close-detail">✕</button>
      ${item.image?.startsWith('data:') ? `
        <div class="menu-detail-image">
          <img src="${item.image}" alt="${name}" />
        </div>
      ` : `
        <div class="menu-detail-emoji-area">${item.image || '🍽️'}</div>
      `}
      <div class="menu-detail-body">
        <h2 class="menu-detail-name">${name}</h2>
        <div class="menu-detail-price-row">
          ${hasDiscount ? `
            <span class="menu-detail-old-price">${restaurant.currency}${item.price.toFixed(2)}</span>
            <span class="menu-detail-price" style="color: ${themeColor};">${restaurant.currency}${effectivePrice.toFixed(2)}</span>
            <span class="menu-detail-discount-badge" style="background: ${themeColor};">%${Math.round((1 - effectivePrice / item.price) * 100)} İndirim</span>
          ` : `
            <span class="menu-detail-price" style="color: ${themeColor};">${restaurant.currency}${item.price.toFixed(2)}</span>
          `}
        </div>
        ${desc ? `<p class="menu-detail-desc">${desc}</p>` : ''}
        
        ${item.allergens && item.allergens.length > 0 ? `
          <div class="menu-detail-section">
            <h4 class="menu-detail-section-title">⚠️ ${currentLang === 'tr' ? 'Alerjen Bilgisi' : 'Allergen Info'}</h4>
            <div class="menu-detail-allergens">
              ${item.allergens.map(a => {
    const info = ALLERGEN_LIST[a];
    return info ? `<span class="menu-detail-allergen-tag">${info.icon} ${currentLang === 'tr' ? info.tr : info.en}</span>` : '';
  }).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="menu-detail-info-row">
          ${item.calories ? `<span class="menu-detail-info-item">🔥 ${item.calories} kcal</span>` : ''}
          ${item.preparationTime ? `<span class="menu-detail-info-item">⏱️ ${item.preparationTime} ${currentLang === 'tr' ? 'dakika' : 'min'}</span>` : ''}
        </div>

        ${hasOrdering ? `
          <div class="menu-detail-order-area">
            <div class="menu-detail-qty">
              <button class="menu-detail-qty-btn" id="detail-qty-minus">−</button>
              <span id="detail-qty-value">1</span>
              <button class="menu-detail-qty-btn" id="detail-qty-plus">+</button>
            </div>
            <button class="menu-detail-add-btn" id="detail-add-to-cart" style="background: ${themeColor};">
              ${currentLang === 'tr' ? 'Sepete Ekle' : 'Add to Cart'} - ${restaurant.currency}${effectivePrice.toFixed(2)}
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let qty = 1;

  document.getElementById('close-detail')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('detail-qty-minus')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (qty > 1) { qty--; updateDetailQty(qty, effectivePrice, restaurant.currency); }
  });
  document.getElementById('detail-qty-plus')?.addEventListener('click', (e) => {
    e.stopPropagation();
    qty++; updateDetailQty(qty, effectivePrice, restaurant.currency);
  });

  document.getElementById('detail-add-to-cart')?.addEventListener('click', (e) => {
    e.stopPropagation();
    for (let i = 0; i < qty; i++) addToCart(item, restaurant);
    overlay.remove();
  });
}

function updateDetailQty(qty: number, price: number, currency: string): void {
  const valEl = document.getElementById('detail-qty-value');
  const btnEl = document.getElementById('detail-add-to-cart');
  if (valEl) valEl.textContent = qty.toString();
  if (btnEl) btnEl.textContent = `${currentLang === 'tr' ? 'Sepete Ekle' : 'Add to Cart'} - ${currency}${(price * qty).toFixed(2)}`;
}

// ============================================
// Cart Functions
// ============================================
function addToCart(item: MenuItem, restaurant: Restaurant): void {
  const existing = cart.find(c => c.item.id === item.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ item, quantity: 1 });
  }
  updateCartUI(restaurant);
  showAddedAnimation();
}

function updateCartUI(restaurant: Restaurant): void {
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => {
    const price = c.item.discountPrice && c.item.discountPrice < c.item.price ? c.item.discountPrice : c.item.price;
    return s + price * c.quantity;
  }, 0);

  const fab = document.getElementById('cart-fab');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');

  if (fab) fab.style.display = totalItems > 0 ? '' : 'none';
  if (countEl) countEl.textContent = totalItems.toString();
  if (totalEl) totalEl.textContent = `${restaurant.currency}${totalPrice.toFixed(2)}`;

  // Update drawer
  const drawerItems = document.getElementById('cart-drawer-items');
  const drawerTotal = document.getElementById('cart-drawer-total');
  const emptyMsg = document.getElementById('cart-empty-msg');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (drawerItems) {
    if (totalItems === 0) {
      drawerItems.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = '';
      if (checkoutBtn) (checkoutBtn as HTMLButtonElement).disabled = true;
    } else {
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (checkoutBtn) (checkoutBtn as HTMLButtonElement).disabled = false;
      drawerItems.innerHTML = cart.map((c, idx) => {
        const price = c.item.discountPrice && c.item.discountPrice < c.item.price ? c.item.discountPrice : c.item.price;
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">${getItemName(c.item)}</span>
              <span class="cart-item-price">${restaurant.currency}${(price * c.quantity).toFixed(2)}</span>
            </div>
            <div class="cart-item-actions">
              <button class="cart-qty-btn" data-action="minus" data-idx="${idx}">−</button>
              <span class="cart-qty-value">${c.quantity}</span>
              <button class="cart-qty-btn" data-action="plus" data-idx="${idx}">+</button>
              <button class="cart-remove-btn" data-idx="${idx}">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      // Rebind cart item events
      drawerItems.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt((btn as HTMLElement).dataset.idx || '0');
          const action = (btn as HTMLElement).dataset.action;
          if (action === 'plus') cart[idx].quantity++;
          else if (action === 'minus' && cart[idx].quantity > 1) cart[idx].quantity--;
          updateCartUI(restaurant);
        });
      });
      drawerItems.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt((btn as HTMLElement).dataset.idx || '0');
          cart.splice(idx, 1);
          updateCartUI(restaurant);
        });
      });
    }
  }
  if (drawerTotal) drawerTotal.textContent = `${restaurant.currency}${totalPrice.toFixed(2)}`;
}

function showAddedAnimation(): void {
  const fab = document.getElementById('cart-fab');
  if (fab) {
    fab.classList.add('cart-bounce');
    setTimeout(() => fab.classList.remove('cart-bounce'), 300);
  }
}

// ============================================
// Cart Drawer
// ============================================
function renderCartDrawer(restaurant: Restaurant, themeColor: string): string {
  return `
    <div class="cart-drawer-overlay" id="cart-drawer">
      <div class="cart-drawer">
        <div class="cart-drawer-header">
          <h3>🛒 ${currentLang === 'tr' ? 'Sepetim' : 'My Cart'}</h3>
          <button class="cart-drawer-close" id="close-cart">✕</button>
        </div>
        <div class="cart-drawer-body">
          <p class="cart-empty-msg" id="cart-empty-msg">${currentLang === 'tr' ? 'Sepetiniz boş' : 'Your cart is empty'}</p>
          <div id="cart-drawer-items"></div>
        </div>
        <div class="cart-drawer-footer">
          <div class="cart-drawer-total-row">
            <span>${currentLang === 'tr' ? 'Toplam' : 'Total'}:</span>
            <span class="cart-drawer-total-price" id="cart-drawer-total">${restaurant.currency}0.00</span>
          </div>
          ${currentTableNumber ? `<p class="cart-table-info">📍 Masa ${currentTableNumber}</p>` : ''}
          <div class="cart-order-type" id="order-type-area">
            <label class="cart-order-type-option">
              <input type="radio" name="order-type" value="dine-in" checked> 🍽️ ${currentLang === 'tr' ? 'Masada Yemek' : 'Dine In'}
            </label>
            <label class="cart-order-type-option">
              <input type="radio" name="order-type" value="takeaway"> 📦 ${currentLang === 'tr' ? 'Gel Al' : 'Take Away'}
            </label>
          </div>
          <div class="form-group" style="margin-bottom: 0.5rem;">
            <input type="text" class="form-input cart-input" id="customer-name-input" placeholder="${currentLang === 'tr' ? 'Adınız (opsiyonel)' : 'Your name (optional)'}">
          </div>
          <div class="form-group" style="margin-bottom: 0.5rem;">
            <textarea class="form-input cart-input" id="order-notes-input" placeholder="${currentLang === 'tr' ? 'Sipariş notu (opsiyonel)' : 'Order notes (optional)'}" rows="2"></textarea>
          </div>
          <button class="cart-checkout-btn" id="checkout-btn" style="background: ${themeColor};" disabled>
            ${currentLang === 'tr' ? '✅ Siparişi Gönder' : '✅ Place Order'}
          </button>
          ${restaurant.whatsappNumber ? `
            <button class="cart-whatsapp-btn" id="whatsapp-order-btn">
              📱 WhatsApp ile Sipariş
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Called after cart drawer is rendered to bind its events
function bindCartDrawerEvents(restaurant: Restaurant): void {
  document.getElementById('close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-drawer')?.classList.remove('open');
  });
  document.getElementById('cart-drawer')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'cart-drawer') {
      document.getElementById('cart-drawer')?.classList.remove('open');
    }
  });

  document.getElementById('checkout-btn')?.addEventListener('click', async () => {
    if (cart.length === 0) return;
    const btn = document.getElementById('checkout-btn') as HTMLButtonElement;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div>';
    btn.disabled = true;

    const orderType = (document.querySelector('input[name="order-type"]:checked') as HTMLInputElement)?.value as 'dine-in' | 'takeaway' || 'dine-in';
    const customerName = (document.getElementById('customer-name-input') as HTMLInputElement)?.value || '';
    const notes = (document.getElementById('order-notes-input') as HTMLTextAreaElement)?.value || '';

    const orderItems = cart.map(c => ({
      itemId: c.item.id,
      name: getItemName(c.item),
      price: c.item.discountPrice && c.item.discountPrice < c.item.price ? c.item.discountPrice : c.item.price,
      quantity: c.quantity,
    }));

    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const savedOrder = await localDB.saveOrder({
      restaurantId: restaurant.id,
      tableNumber: currentTableNumber || undefined,
      orderType,
      items: orderItems,
      total,
      status: 'pending',
      customerName,
      notes,
    });

    // WhatsApp notification
    if (restaurant.whatsappNumber && (restaurant.orderNotifyType === 'whatsapp' || restaurant.orderNotifyType === 'both')) {
      sendWhatsAppOrder(restaurant, orderItems, total, orderType, currentTableNumber, customerName, notes);
    }

    cart = [];
    updateCartUI(restaurant);
    document.getElementById('cart-drawer')?.classList.remove('open');

    // Success message + start watching for delivery
    showOrderSuccess(savedOrder.id, restaurant.id);
    btn.innerHTML = currentLang === 'tr' ? '✅ Siparişi Gönder' : '✅ Place Order';
    btn.disabled = false;
  });

  // WhatsApp order button
  document.getElementById('whatsapp-order-btn')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const orderType = (document.querySelector('input[name="order-type"]:checked') as HTMLInputElement)?.value || 'dine-in';
    const customerName = (document.getElementById('customer-name-input') as HTMLInputElement)?.value || '';
    const notes = (document.getElementById('order-notes-input') as HTMLTextAreaElement)?.value || '';

    const orderItems = cart.map(c => ({
      itemId: c.item.id,
      name: getItemName(c.item),
      price: c.item.discountPrice && c.item.discountPrice < c.item.price ? c.item.discountPrice : c.item.price,
      quantity: c.quantity,
    }));
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

    sendWhatsAppOrder(restaurant, orderItems, total, orderType, currentTableNumber, customerName, notes);
  });
}

function sendWhatsAppOrder(
  restaurant: Restaurant,
  items: { name: string; price: number; quantity: number; }[],
  total: number,
  orderType: string,
  tableNumber: number | null,
  customerName: string,
  notes: string
): void {
  let msg = `🍽️ *${restaurant.name} - Yeni Sipariş*\n`;
  msg += `📋 Tip: ${orderType === 'dine-in' ? 'Masada Yemek' : orderType === 'takeaway' ? 'Gel Al' : 'Teslimat'}\n`;
  if (tableNumber) msg += `📍 Masa: ${tableNumber}\n`;
  if (customerName) msg += `👤 Müşteri: ${customerName}\n`;
  msg += `\n---\n`;
  items.forEach(i => {
    msg += `${i.quantity}x ${i.name} - ${restaurant.currency}${(i.price * i.quantity).toFixed(2)}\n`;
  });
  msg += `---\n💰 *Toplam: ${restaurant.currency}${total.toFixed(2)}*\n`;
  if (notes) msg += `\n📝 Not: ${notes}`;

  window.open(`https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

function showOrderSuccess(orderId: string, restaurantId: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'order-success-overlay';
  overlay.innerHTML = `
    <div class="order-success-modal">
      <div class="order-success-icon">✅</div>
      <h3>${currentLang === 'tr' ? 'Siparişiniz Alındı!' : 'Order Received!'}</h3>
      <p>${currentLang === 'tr' ? 'Siparişiniz en kısa sürede hazırlanacaktır.' : 'Your order will be prepared shortly.'}</p>
      <p style="font-size: 0.75rem; color: var(--color-neutral-500); margin-top: 0.5rem;">
        ${currentLang === 'tr' ? '💳 Yemek sonrası "Hesap İste" butonunu kullanabilirsiniz' : '💳 Use "Request Bill" button after your meal'}
      </p>
      <button class="btn btn-primary" id="close-success">Tamam</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('close-success')?.addEventListener('click', () => overlay.remove());
  setTimeout(() => { if (overlay.parentElement) overlay.remove(); }, 6000);

  // Save pending feedback to localStorage (survives page close)
  const slug = location.hash.match(/#\/menu\/([^?]+)/)?.[1] || '';
  localStorage.setItem(`pending_feedback_${slug}`, JSON.stringify({
    orderId, restaurantId, createdAt: Date.now()
  }));

  // Show "Hesap İste" button
  const billBtn = document.getElementById('request-bill-fab');
  if (billBtn) billBtn.style.display = 'flex';

  // Start watching order status (visual tracker only)
  watchOrderStatus(orderId, restaurantId);
}

// Visual order status tracker only (no feedback trigger)
let orderWatchInterval: ReturnType<typeof setInterval> | null = null;

function watchOrderStatus(orderId: string, restaurantId: string): void {
  const tracker = document.createElement('div');
  tracker.id = 'order-status-tracker';
  tracker.className = 'order-status-tracker';
  tracker.innerHTML = getStatusTrackerHTML('pending');
  document.body.appendChild(tracker);

  if (orderWatchInterval) clearInterval(orderWatchInterval);
  orderWatchInterval = setInterval(async () => {
    try {
      const orders = await localDB.getOrders(restaurantId);
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        clearInterval(orderWatchInterval!);
        tracker.remove();
        return;
      }

      tracker.innerHTML = getStatusTrackerHTML(order.status);

      // Remove tracker when delivered (customer will use Hesap İste for feedback)
      if (order.status === 'delivered') {
        clearInterval(orderWatchInterval!);
        setTimeout(() => tracker.remove(), 5000);
      } else if (order.status === 'cancelled') {
        clearInterval(orderWatchInterval!);
        tracker.innerHTML = `<span style="color: var(--color-error); padding: 0.75rem;">❌ ${currentLang === 'tr' ? 'Sipariş iptal edildi' : 'Order cancelled'}</span>`;
        setTimeout(() => tracker.remove(), 5000);
        // Remove pending feedback
        const slug = location.hash.match(/#\/menu\/([^?]+)/)?.[1] || '';
        localStorage.removeItem(`pending_feedback_${slug}`);
      }
    } catch {
      // Ignore polling errors
    }
  }, 5000);
}

function getStatusTrackerHTML(status: string): string {
  const STEPS = [
    { key: 'pending', icon: '📋', tr: 'Alındı', en: 'Received' },
    { key: 'confirmed', icon: '✅', tr: 'Onaylandı', en: 'Confirmed' },
    { key: 'preparing', icon: '👨‍🍳', tr: 'Hazırlanıyor', en: 'Preparing' },
    { key: 'ready', icon: '🔔', tr: 'Hazır', en: 'Ready' },
    { key: 'delivered', icon: '🎉', tr: 'Teslim Edildi', en: 'Delivered' },
  ];
  const currentIdx = STEPS.findIndex(s => s.key === status);

  return `
    <div class="status-tracker-inner">
      ${STEPS.map((step, i) => {
    const state = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending';
    return `<div class="status-step status-step-${state}">
          <span class="status-step-icon">${step.icon}</span>
          <span class="status-step-label">${currentLang === 'tr' ? step.tr : step.en}</span>
        </div>`;
  }).join('<div class="status-step-line"></div>')}
    </div>
  `;
}

// ============================================
// Payment Modal
// ============================================
function showPaymentModal(
  total: number,
  items: { name: string; price: number; quantity: number }[],
  orderId: string,
  restaurantId: string,
  billBtn: HTMLButtonElement
): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'payment-overlay';
  overlay.style.cssText = 'z-index: 9999;';
  overlay.innerHTML = `
    <div class="payment-modal">
      <div class="payment-header">
        <h3>💳 ${currentLang === 'tr' ? 'Hesap & Ödeme' : 'Bill & Payment'}</h3>
        <button class="payment-close" id="payment-close">✕</button>
      </div>
      <div class="payment-items">
        ${items.map((it: any) => `
          <div class="payment-item-row">
            <span>${it.name} × ${it.quantity}</span>
            <span>₺${(it.price * it.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="payment-total-row">
          <strong>${currentLang === 'tr' ? 'Toplam' : 'Total'}</strong>
          <strong>₺${total.toFixed(2)}</strong>
        </div>
      </div>
      <div class="payment-methods">
        <button class="payment-method-btn payment-card-btn" id="pay-card">
          <span class="payment-method-icon">💳</span>
          <span>${currentLang === 'tr' ? 'Kartla Öde' : 'Pay by Card'}</span>
        </button>
        <button class="payment-method-btn payment-cash-btn" id="pay-cash">
          <span class="payment-method-icon">💵</span>
          <span>${currentLang === 'tr' ? 'Nakit Öde' : 'Pay Cash'}</span>
        </button>
      </div>
      <div class="payment-card-form" id="payment-card-form" style="display: none;">
        <div class="card-form-group">
          <label>${currentLang === 'tr' ? 'Kart Numarası' : 'Card Number'}</label>
          <input type="text" id="card-number" class="card-input" placeholder="•••• •••• •••• ••••" maxlength="19" autocomplete="cc-number">
        </div>
        <div class="card-form-row">
          <div class="card-form-group">
            <label>${currentLang === 'tr' ? 'Son Kullanma' : 'Expiry'}</label>
            <input type="text" id="card-expiry" class="card-input" placeholder="AA/YY" maxlength="5" autocomplete="cc-exp">
          </div>
          <div class="card-form-group">
            <label>CVC</label>
            <input type="text" id="card-cvc" class="card-input" placeholder="•••" maxlength="3" autocomplete="cc-csc">
          </div>
        </div>
        <button class="btn btn-primary payment-submit-btn" id="payment-submit" style="width: 100%;">
          ${currentLang === 'tr' ? `₺${total.toFixed(2)} Öde` : `Pay ₺${total.toFixed(2)}`}
        </button>
        <p class="payment-secure-note">🔒 ${currentLang === 'tr' ? '256-bit SSL ile güvenli ödeme' : 'Secure payment with 256-bit SSL'}</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close
  document.getElementById('payment-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Card number formatting
  document.getElementById('card-number')?.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    input.value = v;
  });

  // Expiry formatting
  document.getElementById('card-expiry')?.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
    input.value = v;
  });

  // Show card form
  document.getElementById('pay-card')?.addEventListener('click', () => {
    const form = document.getElementById('payment-card-form');
    if (form) {
      form.style.display = 'block';
      form.style.animation = 'chatMsgIn 0.3s ease-out';
      (document.getElementById('card-number') as HTMLInputElement)?.focus();
    }
    document.querySelector('.payment-methods')?.classList.add('method-selected');
    document.getElementById('pay-card')?.classList.add('selected');
    document.getElementById('pay-cash')?.classList.remove('selected');
  });

  // Cash payment
  document.getElementById('pay-cash')?.addEventListener('click', () => {
    // Mark bill requested (cash)
    const allOrders = JSON.parse(localStorage.getItem('mqr_orders') || '[]');
    const idx = allOrders.findIndex((o: any) => o.id === orderId);
    if (idx >= 0) {
      allOrders[idx].billRequested = true;
      allOrders[idx].billRequestedAt = Date.now();
      localStorage.setItem('mqr_orders', JSON.stringify(allOrders));
    }

    billBtn.disabled = true;
    billBtn.innerHTML = `✅ ${currentLang === 'tr' ? 'Nakit Ödeme' : 'Cash Payment'}`;
    billBtn.classList.add('bill-requested');
    overlay.remove();

    // Show feedback
    setTimeout(() => showFeedbackModal(orderId, restaurantId), 500);
  });

  // Card payment submit
  document.getElementById('payment-submit')?.addEventListener('click', () => {
    const cardNum = (document.getElementById('card-number') as HTMLInputElement)?.value.replace(/\s/g, '');
    const expiry = (document.getElementById('card-expiry') as HTMLInputElement)?.value;
    const cvc = (document.getElementById('card-cvc') as HTMLInputElement)?.value;

    if (cardNum.length < 16 || !expiry || expiry.length < 5 || !cvc || cvc.length < 3) {
      const submitBtn = document.getElementById('payment-submit');
      if (submitBtn) {
        submitBtn.style.animation = 'shake 0.4s ease';
        setTimeout(() => submitBtn.style.animation = '', 400);
      }
      return;
    }

    // Simulate payment processing
    const submitBtn = document.getElementById('payment-submit')!;
    submitBtn.innerHTML = `<span class="payment-spinner"></span> ${currentLang === 'tr' ? 'İşleniyor...' : 'Processing...'}`;
    (submitBtn as HTMLButtonElement).disabled = true;

    setTimeout(() => {
      // Mark as paid
      const allOrders = JSON.parse(localStorage.getItem('mqr_orders') || '[]');
      const idx = allOrders.findIndex((o: any) => o.id === orderId);
      if (idx >= 0) {
        allOrders[idx].status = 'paid';
        allOrders[idx].billRequested = true;
        allOrders[idx].billRequestedAt = Date.now();
        allOrders[idx].paymentMethod = 'card';
        localStorage.setItem('mqr_orders', JSON.stringify(allOrders));
      }

      billBtn.disabled = true;
      billBtn.innerHTML = `✅ ${currentLang === 'tr' ? 'Ödendi' : 'Paid'}`;
      billBtn.classList.add('bill-requested');

      // Show success in modal
      overlay.innerHTML = `
        <div class="payment-modal">
          <div class="payment-success">
            <div class="payment-success-icon">✅</div>
            <h3>${currentLang === 'tr' ? 'Ödeme Başarılı!' : 'Payment Successful!'}</h3>
            <p>₺${total.toFixed(2)}</p>
            <p class="payment-success-sub">${currentLang === 'tr' ? 'Kartınızdan tahsil edildi' : 'Charged to your card'}</p>
          </div>
        </div>
      `;

      // Show feedback after payment success
      setTimeout(() => {
        overlay.remove();
        showFeedbackModal(orderId, restaurantId);
      }, 2000);
    }, 2000); // Simulate 2s processing
  });
}

function showFeedbackModal(orderId: string, restaurantId: string): void {
  if (document.getElementById('feedback-overlay')) return;

  const EMOJIS = [
    { emoji: '😠', label: currentLang === 'tr' ? 'Çok Kötü' : 'Terrible', value: 1 },
    { emoji: '😕', label: currentLang === 'tr' ? 'Kötü' : 'Bad', value: 2 },
    { emoji: '😐', label: currentLang === 'tr' ? 'Orta' : 'Okay', value: 3 },
    { emoji: '😊', label: currentLang === 'tr' ? 'İyi' : 'Good', value: 4 },
    { emoji: '🤩', label: currentLang === 'tr' ? 'Harika' : 'Amazing', value: 5 },
  ];

  const overlay = document.createElement('div');
  overlay.id = 'feedback-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10000;';
  overlay.innerHTML = `
    <div class="feedback-modal">
      <div class="feedback-header">
        <span class="feedback-sparkle">✨</span>
        <h3>${currentLang === 'tr' ? 'Afiyet Olsun! Deneyiminiz Nasıldı?' : 'How Was Your Experience?'}</h3>
        <p>${currentLang === 'tr' ? 'Geri bildiriminiz bizim için çok değerli' : 'Your feedback means a lot to us'}</p>
      </div>
      <div class="feedback-emojis" id="feedback-emojis">
        ${EMOJIS.map(e => `
          <button class="feedback-emoji-btn" data-rating="${e.value}" title="${e.label}">
            <span class="feedback-emoji">${e.emoji}</span>
            <span class="feedback-emoji-label">${e.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="feedback-comment-area" id="feedback-comment-area" style="display: none;">
        <textarea class="feedback-comment" id="feedback-comment" 
          placeholder="${currentLang === 'tr' ? 'Eklemek istediğiniz bir şey var mı? (opsiyonel)' : 'Any additional comments? (optional)'}"
          rows="3"></textarea>
        <button class="btn btn-primary feedback-submit" id="feedback-submit" style="width: 100%; margin-top: 0.75rem;">
          ${currentLang === 'tr' ? '📩 Gönder' : '📩 Submit'}
        </button>
      </div>
      <button class="feedback-skip" id="feedback-skip">
        ${currentLang === 'tr' ? 'Şimdi değil' : 'Not now'}
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedRating = 0;

  overlay.querySelectorAll('.feedback-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt((btn as HTMLElement).dataset.rating!);
      overlay.querySelectorAll('.feedback-emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const commentArea = document.getElementById('feedback-comment-area');
      if (commentArea) {
        commentArea.style.display = 'block';
        commentArea.style.animation = 'chatMsgIn 0.3s ease-out';
      }
    });
  });

  document.getElementById('feedback-submit')?.addEventListener('click', async () => {
    if (selectedRating === 0) return;
    const comment = (document.getElementById('feedback-comment') as HTMLTextAreaElement)?.value.trim();

    await localDB.saveFeedback({
      restaurantId,
      rating: selectedRating,
      comment: comment || undefined,
      tableNumber: currentTableNumber || undefined,
      orderId,
    });

    // Clear pending feedback
    const slug = location.hash.match(/#\/menu\/([^?]+)/)?.[1] || '';
    localStorage.removeItem(`pending_feedback_${slug}`);
    const billBtn = document.getElementById('request-bill-fab');
    if (billBtn) billBtn.style.display = 'none';

    overlay.innerHTML = `
      <div class="feedback-modal">
        <div class="feedback-thankyou">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🙏</div>
          <h3>${currentLang === 'tr' ? 'Teşekkür Ederiz!' : 'Thank You!'}</h3>
          <p>${currentLang === 'tr' ? 'Geri bildiriminiz restoranımızı geliştirmemize yardımcı oluyor.' : 'Your feedback helps us improve.'}</p>
          <div class="feedback-stars-sent">${'⭐'.repeat(selectedRating)}</div>
        </div>
      </div>
    `;
    setTimeout(() => overlay.remove(), 3000);
  });

  document.getElementById('feedback-skip')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
