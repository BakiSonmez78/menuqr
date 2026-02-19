// ============================================
// Dashboard - Restaurant Management Panel
// ============================================

import { localDB } from '../firebase';
import type { Restaurant, MenuCategory, MenuItem } from '../firebase';
import { router } from '../router';
import { showToast } from '../toast';
import { generateDescription } from '../ai';
import { menuTemplates, quickAddCatalog } from '../templates';
import type { MenuTemplate, DishTemplate } from '../templates';
// @ts-ignore
import QRCode from 'qrcode';

let currentUser = localDB.getCurrentUser();
let currentRestaurant: Restaurant | null = null;
let categories: MenuCategory[] = [];
let items: MenuItem[] = [];

function requireAuth(): boolean {
  currentUser = localDB.getCurrentUser();
  if (!currentUser) {
    router.navigate('/login');
    return false;
  }
  return true;
}

export async function renderDashboard(app: HTMLElement): Promise<void> {
  if (!requireAuth()) return;

  const restaurants = await localDB.getRestaurants(currentUser!.id);

  app.innerHTML = `
    <div class="dashboard">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="nav-logo">
            <span class="nav-logo-icon">📱</span>
            <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a href="#/dashboard" class="sidebar-link active">
            <span>🏠</span> Restoranlarım
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">${currentUser!.email[0].toUpperCase()}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${currentUser!.businessName}</div>
              <div class="sidebar-user-email">${currentUser!.email}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="logout-btn" style="width: 100%; margin-top: 0.5rem;">
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>
      <main class="dashboard-main">
        <header class="dashboard-header">
          <div>
            <h1 class="dashboard-title">Restoranlarım</h1>
            <p class="dashboard-subtitle">Restoranlarınızı ve menülerinizi yönetin</p>
          </div>
          <button class="btn btn-primary" id="add-restaurant-btn">
            <span>➕</span> Yeni Restoran
          </button>
        </header>
        <div class="dashboard-content" id="dashboard-content">
          ${restaurants.length === 0 ? `
            <div class="empty-state animate-fade-in-up">
              <div class="empty-icon">🍽️</div>
              <h3>Henüz restoranınız yok</h3>
              <p>İlk restoranınızı ekleyerek dijital menü oluşturmaya başlayın</p>
              <button class="btn btn-primary" id="empty-add-btn">
                <span>➕</span> Restoran Ekle
              </button>
            </div>
          ` : `
            <div class="restaurant-grid">
              ${restaurants.map(r => `
                <div class="restaurant-card card card-glow animate-fade-in-up" data-id="${r.id}">
                  <div class="restaurant-card-cover" style="background: linear-gradient(135deg, ${r.themeColor}33, ${r.themeColor}11);">
                    <div class="restaurant-card-emoji">🍽️</div>
                  </div>
                  <div class="restaurant-card-body">
                    <div class="restaurant-card-header">
                      <h3 class="restaurant-card-name">${r.name}</h3>
                      <span class="badge ${r.isActive ? 'badge-success' : 'badge-primary'}">${r.isActive ? 'Aktif' : 'Pasif'}</span>
                    </div>
                    <p class="restaurant-card-desc">${r.description || 'Açıklama eklenmemiş'}</p>
                    <div class="restaurant-card-actions">
                      <button class="btn btn-primary btn-sm manage-btn" data-id="${r.id}">
                        📋 Menüyü Yönet
                      </button>
                      <button class="btn btn-secondary btn-sm qr-btn" data-id="${r.id}" data-slug="${r.slug}">
                        📷 QR Kod
                      </button>
                      <button class="btn btn-ghost btn-sm preview-btn" data-slug="${r.slug}">
                        👁️ Önizle
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  // Event Listeners
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await localDB.logout();
    showToast('Çıkış yapıldı', 'info');
    router.navigate('/');
  });

  const addBtns = [document.getElementById('add-restaurant-btn'), document.getElementById('empty-add-btn')];
  addBtns.forEach(btn => {
    btn?.addEventListener('click', () => showAddRestaurantModal(app));
  });

  // Manage buttons
  document.querySelectorAll('.manage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id;
      if (id) router.navigate(`/dashboard/restaurant/${id}`);
    });
  });

  // QR buttons
  document.querySelectorAll('.qr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = (btn as HTMLElement).dataset.slug;
      if (slug) showQRModal(slug);
    });
  });

  // Preview buttons
  document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = (btn as HTMLElement).dataset.slug;
      if (slug) router.navigate(`/menu/${slug}`);
    });
  });
}

function showAddRestaurantModal(app: HTMLElement): void {
  let selectedTemplate: MenuTemplate | null = null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 640px;">
      <h2 class="modal-title">🍽️ Yeni Restoran Ekle</h2>
      
      <!-- Step 1: Template Selection -->
      <div id="step-template">
        <p style="color: var(--color-neutral-400); margin-bottom: 1rem; font-size: 0.9rem;">
          Hazır bir menü şablonu seçerek hızlıca başlayın veya sıfırdan oluşturun
        </p>
        <div class="template-grid">
          ${menuTemplates.map(t => `
            <button type="button" class="template-card" data-template-id="${t.id}">
              <span class="template-card-icon">${t.icon}</span>
              <span class="template-card-name">${t.name}</span>
              <span class="template-card-desc">${t.description}</span>
              ${t.categories.length > 0 ? `<span class="template-card-count">${t.categories.length} kategori, ${t.categories.reduce((s, c) => s + c.dishes.length, 0)} ürün</span>` : '<span class="template-card-count">Boş başla</span>'}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Step 2: Restaurant Details (hidden initially) -->
      <div id="step-details" style="display: none;">
        <div class="selected-template-badge" id="selected-template-label"></div>
        <form id="add-restaurant-form">
          <div class="form-group">
            <label class="form-label">Restoran Adı *</label>
            <input type="text" class="form-input" id="rest-name" placeholder="Örn: Lezzet Cafe" required>
          </div>
          <div class="form-group">
            <label class="form-label">Açıklama</label>
            <textarea class="form-input form-textarea" id="rest-desc" placeholder="Kısa bir açıklama..." rows="2"></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Telefon</label>
              <input type="tel" class="form-input" id="rest-phone" placeholder="0500 123 45 67">
            </div>
            <div class="form-group">
              <label class="form-label">Para Birimi</label>
              <select class="form-input form-select" id="rest-currency">
                <option value="₺">₺ Türk Lirası</option>
                <option value="$">$ Dolar</option>
                <option value="€">€ Euro</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Adres</label>
            <input type="text" class="form-input" id="rest-address" placeholder="Restoran adresi">
          </div>
          <div class="form-group">
            <label class="form-label">Tema Rengi</label>
            <input type="color" id="rest-color" value="#f97316" style="width: 60px; height: 40px; border: none; cursor: pointer; border-radius: 8px;">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="back-to-templates">← Geri</button>
            <button type="submit" class="btn btn-primary" id="save-restaurant">
              ${selectedTemplate ? '🚀 Oluştur ve Menüyü Kur' : '💾 Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Template selection
  overlay.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tid = (card as HTMLElement).dataset.templateId;
      selectedTemplate = menuTemplates.find(t => t.id === tid) || null;
      const stepTemplate = document.getElementById('step-template');
      const stepDetails = document.getElementById('step-details');
      const label = document.getElementById('selected-template-label');
      if (stepTemplate) stepTemplate.style.display = 'none';
      if (stepDetails) stepDetails.style.display = '';
      if (label && selectedTemplate) {
        label.innerHTML = `<span class="badge badge-primary">${selectedTemplate.icon} Şablon: ${selectedTemplate.name}</span>`;
      }
    });
  });

  // Back button
  document.getElementById('back-to-templates')?.addEventListener('click', () => {
    const stepTemplate = document.getElementById('step-template');
    const stepDetails = document.getElementById('step-details');
    if (stepTemplate) stepTemplate.style.display = '';
    if (stepDetails) stepDetails.style.display = 'none';
    selectedTemplate = null;
  });

  document.getElementById('cancel-add')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('add-restaurant-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-restaurant') as HTMLButtonElement;
    btn.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
    btn.disabled = true;
    try {
      const restaurant = await localDB.saveRestaurant({
        name: (document.getElementById('rest-name') as HTMLInputElement).value,
        description: (document.getElementById('rest-desc') as HTMLTextAreaElement).value,
        phone: (document.getElementById('rest-phone') as HTMLInputElement).value,
        address: (document.getElementById('rest-address') as HTMLInputElement).value,
        themeColor: (document.getElementById('rest-color') as HTMLInputElement).value,
        currency: (document.getElementById('rest-currency') as HTMLSelectElement).value,
        ownerId: currentUser!.id,
        isActive: true
      });

      // Apply template if selected
      if (selectedTemplate && selectedTemplate.categories.length > 0) {
        await applyTemplate(restaurant.id, selectedTemplate);
        showToast(`Restoran ve ${selectedTemplate.name} menüsü oluşturuldu! 🎉`, 'success');
      } else {
        showToast('Restoran eklendi! 🎉', 'success');
      }

      overlay.remove();
      router.navigate(`/dashboard/restaurant/${restaurant.id}`);
    } catch (err: any) {
      showToast(err.message || 'Hata oluştu', 'error');
      btn.innerHTML = '🚀 Oluştur';
      btn.disabled = false;
    }
  });
}

// Apply a menu template to a restaurant
async function applyTemplate(restaurantId: string, template: MenuTemplate): Promise<void> {
  for (let ci = 0; ci < template.categories.length; ci++) {
    const catTemplate = template.categories[ci];
    const category = await localDB.saveCategory({
      restaurantId,
      name: catTemplate.name,
      icon: catTemplate.icon,
      order: ci
    });
    for (let di = 0; di < catTemplate.dishes.length; di++) {
      const dish = catTemplate.dishes[di];
      await localDB.saveItem({
        categoryId: category.id,
        restaurantId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.image,
        isAvailable: true,
        isPopular: dish.isPopular,
        order: di
      });
    }
  }
}

async function showQRModal(slug: string): Promise<void> {
  const baseUrl = `${window.location.origin}${window.location.pathname}#/menu/${slug}`;
  const tableCount = currentRestaurant?.tableCount || 0;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="text-align: center; max-width: ${tableCount > 0 ? '700px' : '450px'}; max-height: 90vh; overflow-y: auto;">
      <h2 class="modal-title">📷 QR Kodları</h2>
      ${tableCount > 0 ? `
        <p style="color: var(--color-neutral-400); margin-bottom: 0.5rem; font-size: 0.9rem;">
          ${tableCount} masa için ayrı QR kodlar oluşturuldu
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" id="download-all-qr">📥 Tümünü İndir</button>
          <button class="btn btn-secondary btn-sm" id="download-general-qr">🔗 Genel QR İndir</button>
        </div>
        <div class="qr-tables-grid" id="qr-tables-grid">
          ${Array.from({ length: tableCount }, (_, i) => `
            <div class="qr-table-card" data-table="${i + 1}">
              <div class="qr-table-label">Masa ${i + 1}</div>
              <div class="qr-table-canvas" id="qr-canvas-${i + 1}">
                <div class="spinner" style="width: 20px; height: 20px;"></div>
              </div>
              <button class="btn btn-ghost btn-sm qr-table-download" data-table="${i + 1}" title="İndir">📥</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <p style="color: var(--color-neutral-400); margin-bottom: 1rem; font-size: 0.9rem;">
          Bu QR kodu yazdırıp masalarınıza koyun
        </p>
        <div id="qr-container" style="display: flex; justify-content: center; margin: 1.5rem 0;">
          <div class="spinner"></div>
        </div>
        <p style="font-size: 0.8rem; color: var(--color-neutral-500); word-break: break-all; margin-bottom: 1rem;">
          ${baseUrl}
        </p>
        <p style="font-size: 0.75rem; color: var(--color-neutral-600); margin-bottom: 1rem;">
          💡 Masa bazlı QR kodlar için <strong>Ayarlar</strong>'dan masa sayısını belirleyin
        </p>
        <div class="modal-actions" style="justify-content: center;">
          <button class="btn btn-primary" id="download-qr">📥 QR Kodu İndir</button>
          <button class="btn btn-ghost" id="close-qr">Kapat</button>
        </div>
      `}
      ${tableCount > 0 ? `
        <div class="modal-actions" style="justify-content: center; margin-top: 1rem;">
          <button class="btn btn-ghost" id="close-qr">Kapat</button>
        </div>
      ` : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  const qrCanvases: Map<number, HTMLCanvasElement> = new Map();

  if (tableCount > 0) {
    // Generate QR for each table
    for (let t = 1; t <= tableCount; t++) {
      const tableUrl = `${baseUrl}?table=${t}`;
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, tableUrl, {
          width: 150,
          margin: 1,
          color: { dark: '#1a1a24', light: '#ffffff' }
        });
        qrCanvases.set(t, canvas);
        const container = document.getElementById(`qr-canvas-${t}`);
        if (container) {
          container.innerHTML = '';
          container.appendChild(canvas);
        }
      } catch (err) {
        const container = document.getElementById(`qr-canvas-${t}`);
        if (container) container.innerHTML = '<span style="color: var(--color-error); font-size: 0.7rem;">Hata</span>';
      }
    }

    // Individual download buttons
    overlay.querySelectorAll('.qr-table-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const tableNum = parseInt((btn as HTMLElement).dataset.table!);
        const canvas = qrCanvases.get(tableNum);
        if (canvas) {
          // Create a branded version with table label
          const branded = createBrandedQR(canvas, `Masa ${tableNum}`, slug);
          const link = document.createElement('a');
          link.download = `menuqr-${slug}-masa-${tableNum}.png`;
          link.href = branded.toDataURL('image/png');
          link.click();
          showToast(`Masa ${tableNum} QR indirildi`, 'success');
        }
      });
    });

    // Download all as individual files
    document.getElementById('download-all-qr')?.addEventListener('click', () => {
      qrCanvases.forEach((canvas, tableNum) => {
        const branded = createBrandedQR(canvas, `Masa ${tableNum}`, slug);
        const link = document.createElement('a');
        link.download = `menuqr-${slug}-masa-${tableNum}.png`;
        link.href = branded.toDataURL('image/png');
        link.click();
      });
      showToast(`${tableCount} QR kod indirildi! 🎉`, 'success');
    });

    // Download general QR (no table)
    document.getElementById('download-general-qr')?.addEventListener('click', async () => {
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, baseUrl, {
          width: 280, margin: 2,
          color: { dark: '#1a1a24', light: '#ffffff' }
        });
        const link = document.createElement('a');
        link.download = `menuqr-${slug}-genel.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Genel QR kod indirildi', 'success');
      } catch (err) {
        showToast('QR oluşturulamadı', 'error');
      }
    });

  } else {
    // Single QR (no tables)
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, baseUrl, {
        width: 280, margin: 2,
        color: { dark: '#1a1a24', light: '#ffffff' }
      });
      const container = document.getElementById('qr-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(canvas);
      }
      document.getElementById('download-qr')?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `menuqr-${slug}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('QR kod indirildi!', 'success');
      });
    } catch (err) {
      const container = document.getElementById('qr-container');
      if (container) container.innerHTML = '<p style="color: var(--color-error);">QR kod oluşturulamadı</p>';
    }
  }

  document.getElementById('close-qr')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Creates a branded QR image with table label header
function createBrandedQR(qrCanvas: HTMLCanvasElement, label: string, slug: string): HTMLCanvasElement {
  const padding = 20;
  const headerHeight = 40;
  const footerHeight = 24;
  const totalWidth = qrCanvas.width + padding * 2;
  const totalHeight = qrCanvas.height + headerHeight + footerHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Header with restaurant name + table
  ctx.fillStyle = '#1a1a24';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, totalWidth / 2, headerHeight);

  // QR code
  ctx.drawImage(qrCanvas, padding, headerHeight + 5);

  // Footer with slug
  ctx.fillStyle = '#999999';
  ctx.font = '10px sans-serif';
  ctx.fillText(slug, totalWidth / 2, totalHeight - 8);

  return canvas;
}

// ============================================
// Restaurant Menu Editor
// ============================================

export async function renderMenuEditor(app: HTMLElement, restaurantId: string): Promise<void> {
  if (!requireAuth()) return;

  currentRestaurant = await localDB.getRestaurantById(restaurantId);
  if (!currentRestaurant) {
    showToast('Restoran bulunamadı', 'error');
    router.navigate('/dashboard');
    return;
  }

  categories = await localDB.getCategories(restaurantId);
  items = await localDB.getItems(restaurantId);

  app.innerHTML = `
    <div class="dashboard">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="nav-logo">
            <span class="nav-logo-icon">📱</span>
            <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a href="#/dashboard" class="sidebar-link">
            <span>←</span> Geri
          </a>
          <a href="#/dashboard/restaurant/${restaurantId}" class="sidebar-link active">
            <span>📋</span> Menü Düzenle
          </a>
          <a href="javascript:void(0)" class="sidebar-link" id="sidebar-settings-btn">
            <span>⚙️</span> Ayarlar
          </a>
          <a href="javascript:void(0)" class="sidebar-link" id="sidebar-orders-btn">
            <span>🧾</span> Siparişler
          </a>
          <a href="javascript:void(0)" class="sidebar-link" id="sidebar-tables-btn">
            <span>🪑</span> Masalar
          </a>
          <a href="javascript:void(0)" class="sidebar-link" id="sidebar-qr-btn">
            <span>📷</span> QR Kod
          </a>
          <a href="#/menu/${currentRestaurant.slug}" class="sidebar-link" target="_blank">
            <span>👁️</span> Önizleme
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-sm" id="logout-btn2" style="width: 100%;">
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>
      <main class="dashboard-main">
        <header class="dashboard-header">
          <div>
            <h1 class="dashboard-title">${currentRestaurant.name}</h1>
            <p class="dashboard-subtitle">Menü düzenleme paneli</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-accent btn-sm" id="quick-add-btn">
              <span>⚡</span> Katalogdan Ekle
            </button>
            <button class="btn btn-primary btn-sm" id="add-category-btn">
              <span>📂</span> Kategori Ekle
            </button>
            <button class="btn btn-danger btn-sm" id="delete-restaurant-btn" title="Restoranı Sil">
              🗑️
            </button>
          </div>
        </header>
        <div class="dashboard-content" id="menu-editor-content">
          ${categories.length === 0 ? `
            <div class="empty-state animate-fade-in-up">
              <div class="empty-icon">📂</div>
              <h3>Henüz kategori yok</h3>
              <p>Menünüze ilk kategoriyi ekleyin (Örn: Ana Yemekler, İçecekler, Tatlılar)</p>
              <button class="btn btn-primary" id="empty-cat-btn">
                <span>📂</span> Kategori Ekle
              </button>
            </div>
          ` : renderCategories()}
        </div>
      </main>
    </div>
  `;

  // Bind events
  document.getElementById('logout-btn2')?.addEventListener('click', async () => {
    await localDB.logout();
    router.navigate('/');
  });

  document.getElementById('sidebar-qr-btn')?.addEventListener('click', () => {
    showQRModal(currentRestaurant!.slug);
  });

  document.getElementById('sidebar-settings-btn')?.addEventListener('click', () => {
    showSettingsModal(app, restaurantId);
  });

  document.getElementById('sidebar-orders-btn')?.addEventListener('click', () => {
    showOrdersPanel(app, restaurantId);
  });

  document.getElementById('sidebar-tables-btn')?.addEventListener('click', () => {
    showTablesPanel(app, restaurantId);
  });

  [document.getElementById('add-category-btn'), document.getElementById('empty-cat-btn')].forEach(btn => {
    btn?.addEventListener('click', () => showCategoryModal(app, restaurantId));
  });

  document.getElementById('quick-add-btn')?.addEventListener('click', () => {
    showQuickAddCatalog(app, restaurantId);
  });

  document.getElementById('delete-restaurant-btn')?.addEventListener('click', () => {
    showDeleteConfirm('Bu restoranı ve tüm menüsünü silmek istediğinize emin misiniz?', async () => {
      await localDB.deleteRestaurant(restaurantId);
      showToast('Restoran silindi', 'info');
      router.navigate('/dashboard');
    });
  });

  bindMenuEditorEvents(app, restaurantId);
}

function renderCategories(): string {
  return categories.map(cat => {
    const catItems = items.filter(i => i.categoryId === cat.id);
    return `
      <div class="category-section animate-fade-in-up" data-cat-id="${cat.id}">
        <div class="category-header">
          <div class="category-info">
            <span class="category-icon">${cat.icon || '📁'}</span>
            <h3 class="category-name">${cat.name}</h3>
            <span class="badge badge-primary">${catItems.length} ürün</span>
          </div>
          <div class="category-actions">
            <button class="btn btn-primary btn-sm add-item-btn" data-cat-id="${cat.id}">
              ➕ Ürün Ekle
            </button>
            <button class="btn btn-ghost btn-sm edit-cat-btn" data-cat-id="${cat.id}">
              ✏️
            </button>
            <button class="btn btn-ghost btn-sm delete-cat-btn" data-cat-id="${cat.id}">
              🗑️
            </button>
          </div>
        </div>
        <div class="items-grid">
          ${catItems.length === 0 ? `
            <div class="empty-items">
              <p>Bu kategoride henüz ürün yok</p>
            </div>
          ` : catItems.map(item => `
            <div class="item-card card" data-item-id="${item.id}">
              <div class="item-card-top">
                ${item.image?.startsWith('data:') ? `<img src="${item.image}" alt="${item.name}" />` : `<div class="item-card-emoji">${item.image || '🍽️'}</div>`}
                ${item.isPopular ? '<span class="badge badge-primary" style="position:absolute;top:0.5rem;right:0.5rem;">⭐ Popüler</span>' : ''}
                ${item.discountPrice && item.discountPrice < item.price ? `<span class="item-card-discount">🏷️ %${Math.round((1 - item.discountPrice / item.price) * 100)}</span>` : ''}
              </div>
              <div class="item-card-body">
                <h4 class="item-card-name">${item.name}</h4>
                <p class="item-card-desc">${item.description || ''}</p>
                ${item.allergens && item.allergens.length > 0 ? `<div class="item-card-allergens">${item.allergens.map(a => { const icons: Record<string, string> = { gluten: '🌾', dairy: '🥛', eggs: '🥚', nuts: '🥜', soy: '🫘', fish: '🐟', shellfish: '🦐', spicy: '🌶️', vegan: '🌱', vegetarian: '🥗', halal: '☪️' }; return icons[a] || ''; }).join(' ')}</div>` : ''}
                <div class="item-card-footer">
                  ${item.discountPrice && item.discountPrice < item.price
        ? `<span class="item-card-price"><s style="color: var(--color-neutral-600); font-size: 0.7rem;">${currentRestaurant!.currency}${item.price.toFixed(2)}</s> ${currentRestaurant!.currency}${item.discountPrice.toFixed(2)}</span>`
        : `<span class="item-card-price">${currentRestaurant!.currency}${item.price.toFixed(2)}</span>`
      }
                  <div class="item-card-btns">
                    <button class="btn btn-ghost btn-icon edit-item-btn" data-item-id="${item.id}" title="Düzenle">✏️</button>
                    <button class="btn btn-ghost btn-icon toggle-item-btn ${!item.isAvailable ? 'item-unavailable' : ''}" data-item-id="${item.id}" title="${item.isAvailable ? 'Pasif Yap' : 'Aktif Yap'}">
                      ${item.isAvailable ? '✅' : '⛔'}
                    </button>
                    <button class="btn btn-ghost btn-icon delete-item-btn" data-item-id="${item.id}" title="Sil">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function bindMenuEditorEvents(app: HTMLElement, restaurantId: string): void {
  // Add item
  document.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = (btn as HTMLElement).dataset.catId;
      if (catId) showItemModal(app, restaurantId, catId);
    });
  });

  // Edit category
  document.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = (btn as HTMLElement).dataset.catId;
      const cat = categories.find(c => c.id === catId);
      if (cat) showCategoryModal(app, restaurantId, cat);
    });
  });

  // Delete category
  document.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = (btn as HTMLElement).dataset.catId;
      if (catId) {
        showDeleteConfirm('Bu kategoriyi ve tüm ürünlerini silmek istediğinize emin misiniz?', async () => {
          await localDB.deleteCategory(catId);
          showToast('Kategori silindi', 'info');
          renderMenuEditor(app, restaurantId);
        });
      }
    });
  });

  // Edit item
  document.querySelectorAll('.edit-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      const item = items.find(i => i.id === itemId);
      if (item) showItemModal(app, restaurantId, item.categoryId, item);
    });
  });

  // Toggle item availability
  document.querySelectorAll('.toggle-item-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      const item = items.find(i => i.id === itemId);
      if (item) {
        await localDB.updateItem(itemId!, { isAvailable: !item.isAvailable });
        showToast(item.isAvailable ? 'Ürün pasif yapıldı' : 'Ürün aktif yapıldı', 'info');
        renderMenuEditor(app, restaurantId);
      }
    });
  });

  // Delete item
  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      if (itemId) {
        showDeleteConfirm('Bu ürünü silmek istediğinize emin misiniz?', async () => {
          await localDB.deleteItem(itemId);
          showToast('Ürün silindi', 'info');
          renderMenuEditor(app, restaurantId);
        });
      }
    });
  });
}

function showCategoryModal(app: HTMLElement, restaurantId: string, existing?: MenuCategory): void {
  const isEdit = !!existing;
  const emojis = ['🥘', '🥗', '🍰', '🍕', '🍔', '🥙', '🍣', '🍜', '☕', '🥤', '🍺', '🧁', '🍝', '🌯', '🥩', '🐟', '🫕', '🍛'];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal-title">${isEdit ? '✏️ Kategori Düzenle' : '📂 Yeni Kategori'}</h2>
      <form id="category-form">
        <div class="form-group">
          <label class="form-label">Kategori Adı *</label>
          <input type="text" class="form-input" id="cat-name" placeholder="Örn: Ana Yemekler" value="${existing?.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">İkon</label>
          <div class="emoji-picker">
            ${emojis.map(e => `
              <button type="button" class="emoji-option ${existing?.icon === e ? 'selected' : ''}" data-emoji="${e}">${e}</button>
            `).join('')}
          </div>
          <input type="hidden" id="cat-icon" value="${existing?.icon || '🥘'}">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-cat">İptal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Ekle'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  // Emoji picker
  overlay.querySelectorAll('.emoji-option').forEach(opt => {
    opt.addEventListener('click', () => {
      overlay.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      (document.getElementById('cat-icon') as HTMLInputElement).value = (opt as HTMLElement).dataset.emoji!;
    });
  });

  document.getElementById('cancel-cat')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('cat-name') as HTMLInputElement).value;
    const icon = (document.getElementById('cat-icon') as HTMLInputElement).value;

    try {
      if (isEdit) {
        await localDB.updateCategory(existing!.id, { name, icon });
        showToast('Kategori güncellendi', 'success');
      } else {
        await localDB.saveCategory({
          restaurantId,
          name,
          icon,
          order: categories.length
        });
        showToast('Kategori eklendi! 🎉', 'success');
      }
      overlay.remove();
      renderMenuEditor(app, restaurantId);
    } catch (err: any) {
      showToast(err.message || 'Hata oluştu', 'error');
    }
  });
}

function showItemModal(app: HTMLElement, restaurantId: string, categoryId: string, existing?: MenuItem): void {
  const isEdit = !!existing;
  const foodEmojis = ['🍽️', '🍖', '🥩', '🍗', '🌯', '🥙', '🍕', '🍔', '🌭', '🍟', '🥗', '🫕', '🍛', '🍜', '🍝', '🍣', '🍱', '🐟', '🦐', '🧆', '🥘', '🍲', '☕', '🍵', '🥤', '🍺', '🥛', '🧃', '🍰', '🧁', '🍮', '🍩', '🫖', '🍋', '🍊'];
  const existingPhoto = existing?.image?.startsWith('data:') ? existing.image : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 550px; max-height: 90vh; overflow-y: auto;">
      <h2 class="modal-title">${isEdit ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}</h2>
      <form id="item-form">
        <div class="form-group">
          <label class="form-label">Ürün Adı *</label>
          <input type="text" class="form-input" id="item-name" placeholder="Örn: İskender Kebap" value="${existing?.name || ''}" required>
        </div>
        <div class="form-group">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <label class="form-label" style="margin-bottom: 0;">Açıklama</label>
            <button type="button" class="btn btn-sm" id="ai-desc-btn" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; font-size: 0.75rem; padding: 4px 10px; border-radius: 999px; display: flex; align-items: center; gap: 4px;">
              🤖 AI ile Yaz
            </button>
          </div>
          <textarea class="form-input form-textarea" id="item-desc" placeholder="Malzemeler, porsiyon bilgisi vb.">${existing?.description || ''}</textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Fiyat (${currentRestaurant!.currency}) *</label>
            <input type="number" step="0.01" min="0" class="form-input" id="item-price" placeholder="0.00" value="${existing?.price || ''}" required>
          </div>
          <div class="form-group" style="display: flex; flex-direction: column;">
            <label class="form-label">Popüler mi?</label>
            <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="item-popular" ${existing?.isPopular ? 'checked' : ''} style="width: 18px; height: 18px;">
              <span style="font-size: 0.9rem;">⭐ Popüler Ürün</span>
            </label>
          </div>
        </div>

        <!-- Discount, Calories, Prep Time -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
          <div class="form-group">
            <label class="form-label">🏷️ İndirimli Fiyat</label>
            <input type="number" step="0.01" min="0" class="form-input" id="item-discount" placeholder="Boş bırakın" value="${existing?.discountPrice || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">🔥 Kalori</label>
            <input type="number" min="0" class="form-input" id="item-calories" placeholder="kcal" value="${existing?.calories || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">⏱️ Süre (dk)</label>
            <input type="number" min="0" class="form-input" id="item-prep-time" placeholder="dk" value="${existing?.preparationTime || ''}">
          </div>
        </div>

        <!-- Allergens -->
        <div class="form-group">
          <label class="form-label">⚠️ Alerjen Bilgisi</label>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${Object.entries({
    gluten: '🌾 Gluten', dairy: '🥛 Süt', eggs: '🥚 Yumurta', nuts: '🥜 Kuruyemiş',
    soy: '🫘 Soya', fish: '🐟 Balık', shellfish: '🦐 Kabuklu', spicy: '🌶️ Acı',
    vegan: '🌱 Vegan', vegetarian: '🥗 Vejetaryen', halal: '☪️ Helal'
  }).map(([key, label]) => `
              <label style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--surface-glass); border-radius: var(--radius-full); border: 1px solid var(--surface-glass-border); cursor: pointer; font-size: 0.75rem;">
                <input type="checkbox" class="allergen-check" value="${key}" ${(existing?.allergens || []).includes(key) ? 'checked' : ''} style="width: 14px; height: 14px;">
                ${label}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Photo Upload -->
        <div class="form-group">
          <label class="form-label">📷 Ürün Fotoğrafı (opsiyonel)</label>
          <div class="photo-upload-area" id="photo-upload-area">
            <div class="photo-preview" id="photo-preview" style="${existingPhoto ? '' : 'display:none;'}">
              ${existingPhoto ? `<img src="${existingPhoto}" alt="Ürün" />` : ''}
              <button type="button" class="photo-remove" id="photo-remove">✕</button>
            </div>
            <div class="photo-upload-placeholder" id="photo-placeholder" style="${existingPhoto ? 'display:none;' : ''}">
              <span style="font-size: 2rem;">📷</span>
              <span style="font-size: 0.85rem; color: var(--color-neutral-500);">Fotoğraf yükle (tıkla veya sürükle)</span>
              <span style="font-size: 0.75rem; color: var(--color-neutral-600);">Büyük dosyalar otomatik optimize edilir</span>
            </div>
            <input type="file" id="photo-input" accept="image/*" style="display: none;">
          </div>
          <input type="hidden" id="item-photo-data" value="${existingPhoto || ''}">
        </div>

        <div class="form-group">
          <label class="form-label">Veya emoji ikon seçin</label>
          <div class="emoji-picker">
            ${foodEmojis.map(e => `
              <button type="button" class="emoji-option ${!existingPhoto && existing?.image === e ? 'selected' : ''}" data-emoji="${e}">${e}</button>
            `).join('')}
          </div>
          <input type="hidden" id="item-image" value="${(!existingPhoto && existing?.image) || '🍽️'}">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-item">İptal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Ekle'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  // AI Description Generator
  document.getElementById('ai-desc-btn')?.addEventListener('click', () => {
    const nameInput = document.getElementById('item-name') as HTMLInputElement;
    const descInput = document.getElementById('item-desc') as HTMLTextAreaElement;
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Önce ürün adını yazın', 'error');
      nameInput.focus();
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    const desc = generateDescription(name, cat?.name);
    // Typing animation
    descInput.value = '';
    let i = 0;
    const btn = document.getElementById('ai-desc-btn')!;
    btn.innerHTML = '⏳ Yazılıyor...';
    (btn as HTMLButtonElement).disabled = true;
    const interval = setInterval(() => {
      descInput.value += desc[i];
      i++;
      if (i >= desc.length) {
        clearInterval(interval);
        btn.innerHTML = '🤖 AI ile Yaz';
        (btn as HTMLButtonElement).disabled = false;
        showToast('AI açıklama oluşturuldu! ✨', 'success');
      }
    }, 25);
  });

  // Photo upload
  const photoArea = document.getElementById('photo-upload-area');
  const photoInput = document.getElementById('photo-input') as HTMLInputElement;
  const photoPreview = document.getElementById('photo-preview');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const photoDataInput = document.getElementById('item-photo-data') as HTMLInputElement;

  photoArea?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id !== 'photo-remove') photoInput?.click();
  });

  // Drag and drop
  photoArea?.addEventListener('dragover', (e) => { e.preventDefault(); photoArea.classList.add('drag-over'); });
  photoArea?.addEventListener('dragleave', () => { photoArea.classList.remove('drag-over'); });
  photoArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    photoArea.classList.remove('drag-over');
    const file = (e as DragEvent).dataTransfer?.files[0];
    if (file) handlePhotoFile(file);
  });

  photoInput?.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (file) handlePhotoFile(file);
  });

  function handlePhotoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen bir resim dosyası seçin', 'error');
      return;
    }

    const MAX_SIZE = 300 * 1024; // 300KB target
    const MAX_DIMENSION = 800;   // max width/height px

    const reader = new FileReader();
    reader.onload = (e) => {
      const originalDataUrl = e.target?.result as string;

      // If already small enough, use as-is
      if (file.size <= MAX_SIZE) {
        applyPhoto(originalDataUrl);
        return;
      }

      // Compress via Canvas
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if too large
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Try progressively lower quality until under target size
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length > MAX_SIZE * 1.37 && quality > 0.1) {
          // 1.37 factor: base64 is ~37% larger than binary
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        const savedPct = Math.round((1 - result.length / originalDataUrl.length) * 100);
        if (savedPct > 0) {
          showToast(`Fotoğraf optimize edildi (-%${savedPct} boyut)`, 'info');
        }
        applyPhoto(result);
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);

    function applyPhoto(dataUrl: string) {
      photoDataInput.value = dataUrl;
      if (photoPreview) {
        photoPreview.innerHTML = `<img src="${dataUrl}" alt="Ürün" /><button type="button" class="photo-remove" id="photo-remove">✕</button>`;
        photoPreview.style.display = '';
        document.getElementById('photo-remove')?.addEventListener('click', (ev) => {
          ev.stopPropagation();
          photoDataInput.value = '';
          if (photoPreview) photoPreview.style.display = 'none';
          if (photoPlaceholder) photoPlaceholder.style.display = '';
        });
      }
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
      // Deselect emoji
      overlay.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
    }
  }

  document.getElementById('photo-remove')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    photoDataInput.value = '';
    if (photoPreview) photoPreview.style.display = 'none';
    if (photoPlaceholder) photoPlaceholder.style.display = '';
  });

  // Emoji picker
  overlay.querySelectorAll('.emoji-option').forEach(opt => {
    opt.addEventListener('click', () => {
      overlay.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      (document.getElementById('item-image') as HTMLInputElement).value = (opt as HTMLElement).dataset.emoji!;
      // Clear photo if emoji selected
      photoDataInput.value = '';
      if (photoPreview) photoPreview.style.display = 'none';
      if (photoPlaceholder) photoPlaceholder.style.display = '';
    });
  });

  document.getElementById('cancel-item')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const photoData = (document.getElementById('item-photo-data') as HTMLInputElement).value;
    const emojiImage = (document.getElementById('item-image') as HTMLInputElement).value;
    const discountVal = (document.getElementById('item-discount') as HTMLInputElement).value;
    const caloriesVal = (document.getElementById('item-calories') as HTMLInputElement).value;
    const prepTimeVal = (document.getElementById('item-prep-time') as HTMLInputElement).value;
    const allergens: string[] = [];
    overlay.querySelectorAll('.allergen-check').forEach(cb => {
      if ((cb as HTMLInputElement).checked) allergens.push((cb as HTMLInputElement).value);
    });
    const data: any = {
      name: (document.getElementById('item-name') as HTMLInputElement).value,
      description: (document.getElementById('item-desc') as HTMLTextAreaElement).value,
      price: parseFloat((document.getElementById('item-price') as HTMLInputElement).value),
      isPopular: (document.getElementById('item-popular') as HTMLInputElement).checked,
      image: photoData || emojiImage,  // Photo takes priority over emoji
      allergens,
      discountPrice: discountVal ? parseFloat(discountVal) : undefined,
      calories: caloriesVal ? parseInt(caloriesVal) : undefined,
      preparationTime: prepTimeVal ? parseInt(prepTimeVal) : undefined,
    };

    try {
      if (isEdit) {
        await localDB.updateItem(existing!.id, data);
        showToast('Ürün güncellendi', 'success');
      } else {
        const catItems = items.filter(i => i.categoryId === categoryId);
        await localDB.saveItem({
          ...data,
          categoryId,
          restaurantId,
          isAvailable: true,
          order: catItems.length
        });
        showToast('Ürün eklendi! 🎉', 'success');
      }
      overlay.remove();
      renderMenuEditor(app, restaurantId);
    } catch (err: any) {
      showToast(err.message || 'Hata oluştu', 'error');
    }
  });
}

// ============================================
// Quick Add Catalog - Browse & add dishes
// ============================================

function showQuickAddCatalog(app: HTMLElement, restaurantId: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column;">
      <h2 class="modal-title">⚡ Katalogdan Hızlı Ekle</h2>
      <p style="color: var(--color-neutral-400); font-size: 0.9rem; margin-bottom: 1rem;">
        Popüler yemekleri seçin, kategori belirleyin ve tek tıkla menünüze ekleyin
      </p>

      <!-- Category selector -->
      <div class="form-group" style="margin-bottom: 1rem;">
        <label class="form-label">Eklenecek Kategori *</label>
        <select class="form-input form-select" id="qa-target-category">
          <option value="">-- Kategori seçin veya yeni oluşturun --</option>
          ${categories.map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('')}
          <option value="__new__">➕ Yeni Kategori Oluştur</option>
        </select>
        <div id="qa-new-cat-fields" style="display: none; margin-top: 0.5rem;">
          <input type="text" class="form-input" id="qa-new-cat-name" placeholder="Yeni kategori adı" style="margin-bottom: 0.5rem;">
        </div>
      </div>

      <!-- Catalog tabs -->
      <div class="catalog-tabs" id="catalog-tabs">
        ${quickAddCatalog.map((cat, idx) => `
          <button type="button" class="catalog-tab ${idx === 0 ? 'active' : ''}" data-idx="${idx}">${cat.name}</button>
        `).join('')}
      </div>

      <!-- Dish list -->
      <div class="catalog-dishes" id="catalog-dishes" style="flex: 1; overflow-y: auto; max-height: 400px;">
        ${renderCatalogDishes(0)}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-glass-border);">
        <span id="qa-selected-count" style="font-size: 0.9rem; color: var(--color-neutral-400);">0 ürün seçili</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-ghost" id="qa-cancel">İptal</button>
          <button class="btn btn-primary" id="qa-add-selected">✅ Seçilenleri Ekle</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const selectedDishes: DishTemplate[] = [];

  // New category toggle
  document.getElementById('qa-target-category')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const fields = document.getElementById('qa-new-cat-fields');
    if (fields) fields.style.display = val === '__new__' ? '' : 'none';
  });

  // Tab switching
  overlay.querySelectorAll('.catalog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.catalog-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const idx = parseInt((tab as HTMLElement).dataset.idx || '0');
      const container = document.getElementById('catalog-dishes');
      if (container) container.innerHTML = renderCatalogDishes(idx);
      bindCatalogCheckboxes();
    });
  });

  function bindCatalogCheckboxes() {
    overlay.querySelectorAll('.catalog-dish-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = parseInt((cb as HTMLInputElement).dataset.catalogIdx || '0');
        const dishIdx = parseInt((cb as HTMLInputElement).dataset.dishIdx || '0');
        const dish = quickAddCatalog[idx].dishes[dishIdx];
        if ((cb as HTMLInputElement).checked) {
          selectedDishes.push(dish);
        } else {
          const i = selectedDishes.findIndex(d => d.name === dish.name);
          if (i >= 0) selectedDishes.splice(i, 1);
        }
        const countEl = document.getElementById('qa-selected-count');
        if (countEl) countEl.textContent = `${selectedDishes.length} ürün seçili`;
      });
    });
  }
  bindCatalogCheckboxes();

  // Cancel
  document.getElementById('qa-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Add selected
  document.getElementById('qa-add-selected')?.addEventListener('click', async () => {
    if (selectedDishes.length === 0) {
      showToast('En az bir ürün seçin', 'error');
      return;
    }
    const catSelect = document.getElementById('qa-target-category') as HTMLSelectElement;
    let targetCatId = catSelect.value;

    if (!targetCatId) {
      showToast('Lütfen bir kategori seçin', 'error');
      return;
    }

    if (targetCatId === '__new__') {
      const newName = (document.getElementById('qa-new-cat-name') as HTMLInputElement).value.trim();
      if (!newName) {
        showToast('Kategori adı girin', 'error');
        return;
      }
      const newCat = await localDB.saveCategory({ restaurantId, name: newName, icon: '📁', order: categories.length });
      targetCatId = newCat.id;
    }

    const btn = document.getElementById('qa-add-selected') as HTMLButtonElement;
    btn.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
    btn.disabled = true;

    const existingItems = await localDB.getItems(restaurantId);
    const count = existingItems.filter(i => i.categoryId === targetCatId).length;

    for (let i = 0; i < selectedDishes.length; i++) {
      const d = selectedDishes[i];
      await localDB.saveItem({
        categoryId: targetCatId,
        restaurantId,
        name: d.name,
        description: d.description,
        price: d.price,
        image: d.image,
        isAvailable: true,
        isPopular: d.isPopular,
        order: count + i
      });
    }

    overlay.remove();
    showToast(`${selectedDishes.length} ürün eklendi! 🎉`, 'success');
    renderMenuEditor(app, restaurantId);
  });
}

function renderCatalogDishes(catIdx: number): string {
  const cat = quickAddCatalog[catIdx];
  return cat.dishes.map((d, di) => `
    <label class="catalog-dish-row">
      <input type="checkbox" class="catalog-dish-check" data-catalog-idx="${catIdx}" data-dish-idx="${di}">
      <span class="catalog-dish-emoji">${d.image}</span>
      <div class="catalog-dish-info">
        <span class="catalog-dish-name">${d.name}</span>
        <span class="catalog-dish-desc">${d.description}</span>
      </div>
      <span class="catalog-dish-price">₺${d.price}</span>
    </label>
  `).join('');
}

function showDeleteConfirm(message: string, onConfirm: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="modal-title">⚠️ Emin misiniz?</h2>
      <p style="color: var(--color-neutral-400); margin-bottom: 1rem;">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancel-delete">İptal</button>
        <button class="btn btn-danger" id="confirm-delete">Sil</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('cancel-delete')?.addEventListener('click', () => overlay.remove());
  document.getElementById('confirm-delete')?.addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================
// Settings Modal
// ============================================
function showSettingsModal(app: HTMLElement, restaurantId: string): void {
  const r = currentRestaurant!;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 620px; max-height: 90vh; overflow-y: auto;">
      <h2 class="modal-title">⚙️ Restoran Ayarları</h2>
      <form id="settings-form">
        <div class="form-group">
          <label class="form-label">Restoran Adı *</label>
          <input type="text" class="form-input" id="set-name" value="${r.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Açıklama</label>
          <textarea class="form-input form-textarea" id="set-desc" rows="2">${r.description || ''}</textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Telefon</label>
            <input type="tel" class="form-input" id="set-phone" value="${r.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Para Birimi</label>
            <select class="form-input form-select" id="set-currency">
              <option value="₺" ${r.currency === '₺' ? 'selected' : ''}>₺ Türk Lirası</option>
              <option value="$" ${r.currency === '$' ? 'selected' : ''}>$ Dolar</option>
              <option value="€" ${r.currency === '€' ? 'selected' : ''}>€ Euro</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Adres</label>
          <input type="text" class="form-input" id="set-address" value="${r.address || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Çalışma Saatleri</label>
          <input type="text" class="form-input" id="set-hours" value="${r.workingHours || ''}" placeholder="Örn: 09:00 - 22:00">
        </div>
        <div class="form-group">
          <label class="form-label">Tema Rengi</label>
          <input type="color" id="set-color" value="${r.themeColor}" style="width: 60px; height: 40px; border: none; cursor: pointer; border-radius: 8px;">
        </div>

        <h3 style="color: var(--color-neutral-200); font-size: 1rem; margin: 1.5rem 0 0.5rem; font-family: var(--font-heading);">📱 Sipariş ve Garson</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; background: var(--surface-glass); border-radius: var(--radius-md); border: 1px solid var(--surface-glass-border);">
            <input type="checkbox" id="set-ordering" ${r.enableOrdering ? 'checked' : ''} style="width: 18px; height: 18px;">
            <span style="font-size: 0.9rem; color: var(--color-neutral-300);">🛒 Sipariş Alma</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; background: var(--surface-glass); border-radius: var(--radius-md); border: 1px solid var(--surface-glass-border);">
            <input type="checkbox" id="set-waiter" ${r.enableWaiterCall ? 'checked' : ''} style="width: 18px; height: 18px;">
            <span style="font-size: 0.9rem; color: var(--color-neutral-300);">🔔 Garson Çağır</span>
          </label>
        </div>
        
        <div class="form-group" style="margin-top: 0.5rem;">
          <label class="form-label">WhatsApp Numarası (Bildirimler için)</label>
          <input type="text" class="form-input" id="set-whatsapp" value="${r.whatsappNumber || ''}" placeholder="905001234567 (ülke kodu ile)">
        </div>
        <div class="form-group">
          <label class="form-label">Sipariş Bildirim Yöntemi</label>
          <select class="form-input form-select" id="set-notify-type">
            <option value="panel" ${r.orderNotifyType === 'panel' ? 'selected' : ''}>📊 Sadece Panel</option>
            <option value="whatsapp" ${r.orderNotifyType === 'whatsapp' ? 'selected' : ''}>📱 Sadece WhatsApp</option>
            <option value="both" ${r.orderNotifyType === 'both' ? 'selected' : ''}>📊+📱 İkisi Birden</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Masa Sayısı</label>
          <input type="number" class="form-input" id="set-tables" min="0" max="200" value="${r.tableCount || 0}" placeholder="0">
          <small style="color: var(--color-neutral-600); font-size: 0.75rem;">Her masa için ayrı QR kod üretilir</small>
        </div>

        <h3 style="color: var(--color-neutral-200); font-size: 1rem; margin: 1.5rem 0 0.5rem; font-family: var(--font-heading);">🌍 Çoklu Dil</h3>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${['tr', 'en', 'ar', 'de', 'fr', 'ru'].map(l => `
            <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 0.4rem 0.7rem; background: var(--surface-glass); border-radius: var(--radius-full); border: 1px solid var(--surface-glass-border); font-size: 0.8rem;">
              <input type="checkbox" class="lang-check" value="${l}" ${(r.languages || ['tr']).includes(l) ? 'checked' : ''} style="width: 14px; height: 14px;">
              ${{ tr: '🇹🇷 Türkçe', en: '🇬🇧 English', ar: '🇸🇦 العربية', de: '🇩🇪 Deutsch', fr: '🇫🇷 Français', ru: '🇷🇺 Русский' }[l]}
            </label>
          `).join('')}
        </div>

        <h3 style="color: var(--color-neutral-200); font-size: 1rem; margin: 1.5rem 0 0.5rem; font-family: var(--font-heading);">🔗 Sosyal Medya</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div class="form-group">
            <label class="form-label">📸 Instagram</label>
            <input type="text" class="form-input" id="set-instagram" value="${r.socialLinks?.instagram || ''}" placeholder="kullaniciadi">
          </div>
          <div class="form-group">
            <label class="form-label">🌐 Web Sitesi</label>
            <input type="text" class="form-input" id="set-website" value="${r.socialLinks?.website || ''}" placeholder="https://...">
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 1.5rem;">
          <button type="button" class="btn btn-ghost" id="cancel-settings">İptal</button>
          <button type="submit" class="btn btn-primary">💾 Kaydet</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('cancel-settings')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const langs: string[] = [];
    overlay.querySelectorAll('.lang-check').forEach(cb => {
      if ((cb as HTMLInputElement).checked) langs.push((cb as HTMLInputElement).value);
    });
    if (langs.length === 0) langs.push('tr');

    const tableCount = parseInt((document.getElementById('set-tables') as HTMLInputElement).value) || 0;

    await localDB.updateRestaurant(restaurantId, {
      name: (document.getElementById('set-name') as HTMLInputElement).value,
      description: (document.getElementById('set-desc') as HTMLTextAreaElement).value,
      phone: (document.getElementById('set-phone') as HTMLInputElement).value,
      address: (document.getElementById('set-address') as HTMLInputElement).value,
      themeColor: (document.getElementById('set-color') as HTMLInputElement).value,
      currency: (document.getElementById('set-currency') as HTMLSelectElement).value,
      workingHours: (document.getElementById('set-hours') as HTMLInputElement).value,
      enableOrdering: (document.getElementById('set-ordering') as HTMLInputElement).checked,
      enableWaiterCall: (document.getElementById('set-waiter') as HTMLInputElement).checked,
      whatsappNumber: (document.getElementById('set-whatsapp') as HTMLInputElement).value,
      orderNotifyType: (document.getElementById('set-notify-type') as HTMLSelectElement).value as 'panel' | 'whatsapp' | 'both',
      tableCount,
      languages: langs,
      socialLinks: {
        instagram: (document.getElementById('set-instagram') as HTMLInputElement).value,
        website: (document.getElementById('set-website') as HTMLInputElement).value,
      },
    });

    // Setup tables if count changed
    if (tableCount > 0 && tableCount !== (currentRestaurant?.tableCount || 0)) {
      await localDB.setupTables(restaurantId, tableCount);
    }

    showToast('Ayarlar kaydedildi! ✅', 'success');
    overlay.remove();
    renderMenuEditor(app, restaurantId);
  });
}

// ============================================
// Orders Panel
// ============================================
async function showOrdersPanel(app: HTMLElement, restaurantId: string): Promise<void> {
  const orders = await localDB.getOrders(restaurantId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
      <h2 class="modal-title">🧾 Siparişler</h2>
      ${orders.length === 0 ? `
        <div style="text-align: center; padding: 2rem; color: var(--color-neutral-500);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
          <p>Henüz sipariş yok</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem;">Sipariş almayı açmak için <strong>Ayarlar</strong>'a gidin</p>
        </div>
      ` : `
        <div class="orders-list">
          ${orders.map(order => {
    const statusColors: Record<string, string> = {
      pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
      ready: '#22c55e', delivered: '#6b7280', cancelled: '#ef4444'
    };
    const statusLabels: Record<string, string> = {
      pending: '⏳ Bekliyor', confirmed: '✅ Onaylandı', preparing: '👨‍🍳 Hazırlanıyor',
      ready: '🔔 Hazır', delivered: '📦 Teslim', cancelled: '❌ İptal'
    };
    const time = new Date(order.createdAt);
    return `
              <div class="order-card" style="border-left: 3px solid ${statusColors[order.status] || '#666'};">
                <div class="order-card-header">
                  <div>
                    <strong>#${order.id.slice(-6).toUpperCase()}</strong>
                    ${order.tableNumber ? `<span class="badge" style="margin-left: 0.5rem;">Masa ${order.tableNumber}</span>` : ''}
                    <span class="badge" style="margin-left: 0.25rem;">${order.orderType === 'dine-in' ? '🍽️ Masada' : '📦 Gel Al'}</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--color-neutral-500);">${time.toLocaleDateString('tr')} ${time.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="order-card-items">
                  ${order.items.map(i => `<span class="order-item-tag">${i.quantity}x ${i.name}</span>`).join('')}
                </div>
                ${order.customerName ? `<p style="font-size: 0.8rem; color: var(--color-neutral-500);">👤 ${order.customerName}</p>` : ''}
                ${order.notes ? `<p style="font-size: 0.8rem; color: var(--color-neutral-500);">📝 ${order.notes}</p>` : ''}
                <div class="order-card-footer">
                  <span style="font-weight: 700; color: var(--color-primary-400);">${currentRestaurant!.currency}${order.total.toFixed(2)}</span>
                  <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <span class="order-status-badge" style="background: ${statusColors[order.status]}22; color: ${statusColors[order.status]};">${statusLabels[order.status]}</span>
                    <select class="order-status-select" data-order-id="${order.id}" style="font-size: 0.75rem; padding: 2px 4px; background: var(--surface-glass); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-md); color: var(--color-neutral-300);">
                      <option value="">Durumunu Değiştir</option>
                      <option value="confirmed">✅ Onayla</option>
                      <option value="preparing">👨‍🍳 Hazırlanıyor</option>
                      <option value="ready">🔔 Hazır</option>
                      <option value="delivered">📦 Teslim Edildi</option>
                      <option value="cancelled">❌ İptal</option>
                    </select>
                  </div>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      `}
      <div class="modal-actions">
        <button class="btn btn-ghost" id="close-orders">Kapat</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('close-orders')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Status change
  overlay.querySelectorAll('.order-status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const orderId = (sel as HTMLElement).dataset.orderId!;
      const newStatus = (sel as HTMLSelectElement).value;
      if (!newStatus) return;
      await localDB.updateOrder(orderId, { status: newStatus as any });
      showToast('Sipariş durumu güncellendi', 'success');
      overlay.remove();
      showOrdersPanel(app, restaurantId);
    });
  });
}

// ============================================
// Tables Panel (Garson Çağırma Yönetimi)
// ============================================
async function showTablesPanel(app: HTMLElement, restaurantId: string): Promise<void> {
  const tables = await localDB.getTables(restaurantId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <h2 class="modal-title">🪑 Masa Yönetimi</h2>
      ${tables.length === 0 ? `
        <div style="text-align: center; padding: 2rem; color: var(--color-neutral-500);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🪑</div>
          <p>Henüz masa kurulmamış</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem;"><strong>Ayarlar</strong>'dan masa sayısını belirleyin</p>
        </div>
      ` : `
        <p style="color: var(--color-neutral-400); font-size: 0.85rem; margin-bottom: 1rem;">
          Her masa için ayrı QR kod oluşturulur. Müşteriler QR kodu okuttuğunda masa numarası otomatik tanınır.
        </p>
        <div class="tables-grid">
          ${tables.map(t => `
            <div class="table-card ${t.hasActiveCall ? 'table-calling' : ''}">
              <div class="table-number">Masa ${t.number}</div>
              ${t.hasActiveCall ? `
                <div class="table-call-alert">
                  🔔 Garson Çağırıyor!
                  <span style="font-size: 0.7rem; display: block;">${t.callTime ? new Date(t.callTime).toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <button class="btn btn-primary btn-sm dismiss-call-btn" data-table-id="${t.id}">✅ Yanıtla</button>
              ` : `
                <div style="font-size: 0.8rem; color: var(--color-neutral-600);">Aktif çağrı yok</div>
              `}
              <a href="#/menu/${currentRestaurant!.slug}?table=${t.number}" class="table-qr-link" title="Bu masanın menü linki">🔗 QR Link</a>
            </div>
          `).join('')}
        </div>
      `}
      <div class="modal-actions">
        <button class="btn btn-ghost" id="close-tables">Kapat</button>
        ${tables.length > 0 ? `<button class="btn btn-primary" id="refresh-tables">🔄 Yenile</button>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('close-tables')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('refresh-tables')?.addEventListener('click', () => {
    overlay.remove();
    showTablesPanel(app, restaurantId);
  });

  overlay.querySelectorAll('.dismiss-call-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tableId = (btn as HTMLElement).dataset.tableId!;
      await localDB.dismissWaiterCall(tableId);
      showToast('Garson çağrısı yanıtlandı', 'success');
      overlay.remove();
      showTablesPanel(app, restaurantId);
    });
  });
}
