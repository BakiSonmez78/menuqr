// ============================================
// Landing Page - Sales Page for Restaurant Owners
// ============================================

export function renderLanding(app: HTMLElement): void {
  app.innerHTML = `
    <!-- Navbar -->
    <nav class="landing-nav" id="landing-nav">
      <div class="container">
        <div class="nav-inner">
          <a href="#/" class="nav-logo">
            <span class="nav-logo-icon">📱</span>
            <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
          </a>
          <div class="nav-links">
            <a href="#features" class="nav-link">Özellikler</a>
            <a href="#pricing" class="nav-link">Fiyatlar</a>
            <a href="#faq" class="nav-link">SSS</a>
          </div>
          <div class="nav-actions">
            <a href="#/login" class="btn btn-ghost">Giriş Yap</a>
            <a href="#/register" class="btn btn-primary">Ücretsiz Başla</a>
          </div>
          <button class="nav-mobile-toggle" id="mobile-toggle" aria-label="Menü">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobile-menu">
      <a href="#features" class="mobile-menu-link">Özellikler</a>
      <a href="#pricing" class="mobile-menu-link">Fiyatlar</a>
      <a href="#faq" class="mobile-menu-link">SSS</a>
      <hr style="border-color: var(--surface-glass-border); margin: 0.5rem 0;">
      <a href="#/login" class="mobile-menu-link">Giriş Yap</a>
      <a href="#/register" class="btn btn-primary" style="margin-top: 0.5rem;">Ücretsiz Başla</a>
    </div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge animate-fade-in-up">
            <span class="badge badge-primary">🔥 Türkiye'nin #1 Dijital Menü Çözümü</span>
          </div>
          <h1 class="hero-title animate-fade-in-up stagger-1">
            Restoranınızı<br>
            <span class="text-gradient">Dijitalleştirin</span>
          </h1>
          <p class="hero-subtitle animate-fade-in-up stagger-2">
            QR kod ile müşterilerinize modern, hızlı ve hijyenik bir menü deneyimi sunun. 
            Kağıt menülere elveda deyin!
          </p>
          <div class="hero-actions animate-fade-in-up stagger-3">
            <a href="#/register" class="btn btn-primary btn-lg">
              <span>🚀</span> Ücretsiz Deneyin
            </a>
            <a href="#demo" class="btn btn-secondary btn-lg">
              <span>👁️</span> Demo Görün
            </a>
          </div>
          <div class="hero-stats animate-fade-in-up stagger-4">
            <div class="hero-stat">
              <span class="hero-stat-number">500+</span>
              <span class="hero-stat-label">Restoran</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-number">50K+</span>
              <span class="hero-stat-label">Menü Görüntüleme</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-number">%98</span>
              <span class="hero-stat-label">Müşteri Memnuniyeti</span>
            </div>
          </div>
        </div>
        <div class="hero-visual animate-fade-in-up stagger-3">
          <div class="hero-phone">
            <div class="hero-phone-notch"></div>
            <div class="hero-phone-screen">
              <div class="hero-mock-header">
                <div class="hero-mock-logo">🍽️ Lezzet Restoran</div>
              </div>
              <div class="hero-mock-categories">
                <span class="hero-mock-cat active">🥘 Ana Yemek</span>
                <span class="hero-mock-cat">🥗 Salata</span>
                <span class="hero-mock-cat">🍰 Tatlı</span>
              </div>
              <div class="hero-mock-items">
                <div class="hero-mock-item">
                  <div class="hero-mock-item-img">🍖</div>
                  <div class="hero-mock-item-info">
                    <div class="hero-mock-item-name">İskender Kebap</div>
                    <div class="hero-mock-item-desc">Döner, yoğurt, tereyağ</div>
                    <div class="hero-mock-item-price">₺185</div>
                  </div>
                </div>
                <div class="hero-mock-item">
                  <div class="hero-mock-item-img">🫕</div>
                  <div class="hero-mock-item-info">
                    <div class="hero-mock-item-name">Mantı</div>
                    <div class="hero-mock-item-desc">El yapımı, yoğurtlu</div>
                    <div class="hero-mock-item-price">₺145</div>
                  </div>
                </div>
                <div class="hero-mock-item">
                  <div class="hero-mock-item-img">🥙</div>
                  <div class="hero-mock-item-info">
                    <div class="hero-mock-item-name">Adana Kebap</div>
                    <div class="hero-mock-item-desc">Acılı, lavaş ekmek</div>
                    <div class="hero-mock-item-price">₺165</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-header">
          <span class="badge badge-accent animate-fade-in-up">✨ Özellikler</span>
          <h2 class="section-title animate-fade-in-up stagger-1">
            Neden <span class="text-gradient">MenüQR</span>?
          </h2>
          <p class="section-subtitle animate-fade-in-up stagger-2">
            Restoranınızı bir üst seviyeye taşıyacak özellikler
          </p>
        </div>
        <div class="features-grid">
          <div class="feature-card card card-glow animate-fade-in-up stagger-1">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Anında Kurulum</h3>
            <p class="feature-desc">5 dakikada menünüzü oluşturun, QR kodunuzu alın ve masalarınıza koyun.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up stagger-2">
            <div class="feature-icon">🛒</div>
            <h3 class="feature-title">Sipariş Alma</h3>
            <p class="feature-desc">Masadan, gel-al veya online sipariş alın. WhatsApp ile anında bildirim.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up stagger-3">
            <div class="feature-icon">🔔</div>
            <h3 class="feature-title">Garson Çağırma</h3>
            <p class="feature-desc">Her masaya özel QR kod. Müşteriler tek tuşla garson çağırabilir.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up stagger-4">
            <div class="feature-icon">🌍</div>
            <h3 class="feature-title">Çoklu Dil Desteği</h3>
            <p class="feature-desc">Türkçe, İngilizce, Arapça, Almanca, Fransızca, Rusça - sınırsız dil.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up stagger-5">
            <div class="feature-icon">⚠️</div>
            <h3 class="feature-title">Alerjen & Kalori</h3>
            <p class="feature-desc">Her ürüne alerjen bilgisi, kalori ve hazırlık süresi ekleyin.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up">
            <div class="feature-icon">🏷️</div>
            <h3 class="feature-title">Kampanya & İndirim</h3>
            <p class="feature-desc">İndirimli fiyatlar belirleyin, popüler ürünleri öne çıkarın.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up">
            <div class="feature-icon">📱</div>
            <h3 class="feature-title">WhatsApp Entegrasyonu</h3>
            <p class="feature-desc">Siparişler ve garson çağrıları anında WhatsApp'ınıza düşsün.</p>
          </div>
          <div class="feature-card card card-glow animate-fade-in-up">
            <div class="feature-icon">📷</div>
            <h3 class="feature-title">Fotoğraf Yükleme</h3>
            <p class="feature-desc">Yemek fotoğraflarını yükleyin, müşteriler görsün ve iştahı açılsın.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-header">
          <span class="badge badge-primary animate-fade-in-up">📋 Nasıl Çalışır?</span>
          <h2 class="section-title animate-fade-in-up stagger-1">
            3 Adımda <span class="text-gradient">Dijital Menü</span>
          </h2>
        </div>
        <div class="steps-grid">
          <div class="step-card animate-fade-in-up stagger-1">
            <div class="step-number">1</div>
            <div class="step-icon">📝</div>
            <h3 class="step-title">Menünüzü Oluşturun</h3>
            <p class="step-desc">Kategoriler ekleyin, yemeklerinizi fiyatlarıyla birlikte girin.</p>
          </div>
          <div class="step-connector animate-fade-in">→</div>
          <div class="step-card animate-fade-in-up stagger-2">
            <div class="step-number">2</div>
            <div class="step-icon">📷</div>
            <h3 class="step-title">QR Kodunuzu Alın</h3>
            <p class="step-desc">Otomatik oluşturulan QR kodu indirin ve yazdırın.</p>
          </div>
          <div class="step-connector animate-fade-in">→</div>
          <div class="step-card animate-fade-in-up stagger-3">
            <div class="step-number">3</div>
            <div class="step-icon">🎉</div>
            <h3 class="step-title">Kullanmaya Başlayın!</h3>
            <p class="step-desc">QR kodları masalara koyun, müşteriler telefondan menüye erişsin.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing" id="pricing">
      <div class="container">
        <div class="section-header">
          <span class="badge badge-accent animate-fade-in-up">💎 Fiyatlandırma</span>
          <h2 class="section-title animate-fade-in-up stagger-1">
            Her Bütçeye Uygun <span class="text-gradient">Planlar</span>
          </h2>
          <p class="section-subtitle animate-fade-in-up stagger-2">
            14 gün ücretsiz deneyin, memnun kalmazsanız ödeme yapmayın
          </p>
        </div>
        <div class="pricing-grid">
          <!-- Free Plan -->
          <div class="pricing-card card animate-fade-in-up stagger-1">
            <div class="pricing-header">
              <h3 class="pricing-name">Başlangıç</h3>
              <div class="pricing-price">
                <span class="pricing-amount">₺0</span>
                <span class="pricing-period">/ay</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✅ 1 Restoran</li>
              <li>✅ 5 Kategori</li>
              <li>✅ 20 Ürün</li>
              <li>✅ QR Kod</li>
              <li>✅ Mobil Uyumlu Menü</li>
              <li>❌ Sipariş Alma</li>
              <li>❌ Garson Çağırma</li>
              <li>❌ Çoklu Dil</li>
              <li>❌ WhatsApp Entegrasyonu</li>
            </ul>
            <a href="#/register" class="btn btn-secondary" style="width: 100%;">Ücretsiz Başla</a>
          </div>

          <!-- Pro Plan -->
          <div class="pricing-card pricing-card-featured card animate-fade-in-up stagger-2">
            <div class="pricing-popular">En Popüler ⭐</div>
            <div class="pricing-header">
              <h3 class="pricing-name">Profesyonel</h3>
              <div class="pricing-price">
                <span class="pricing-amount">₺149</span>
                <span class="pricing-period">/ay</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✅ 3 Restoran</li>
              <li>✅ Sınırsız Kategori & Ürün</li>
              <li>✅ QR Kod & Fotoğraf</li>
              <li>✅ 🛒 Sipariş Alma</li>
              <li>✅ 🔔 Garson Çağırma</li>
              <li>✅ 🌍 Çoklu Dil (6 dil)</li>
              <li>✅ 📱 WhatsApp Bildirim</li>
              <li>✅ ⚠️ Alerjen & Kalori</li>
              <li>✅ 🏷️ Kampanya & İndirim</li>
            </ul>
            <a href="#/register" class="btn btn-primary" style="width: 100%;">14 Gün Ücretsiz Dene</a>
          </div>

          <!-- Premium Plan -->
          <div class="pricing-card card animate-fade-in-up stagger-3">
            <div class="pricing-header">
              <h3 class="pricing-name">Premium</h3>
              <div class="pricing-price">
                <span class="pricing-amount">₺299</span>
                <span class="pricing-period">/ay</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✅ Sınırsız Restoran</li>
              <li>✅ Sınırsız Her Şey</li>
              <li>✅ Tüm Pro Özellikleri</li>
              <li>✅ 🪑 Masa Yönetimi</li>
              <li>✅ 📊 Sipariş İstatistikleri</li>
              <li>✅ 🎨 Özel Tema & Logo</li>
              <li>✅ 🔗 Sosyal Medya Entegrasyonu</li>
              <li>✅ 7/24 Öncelikli Destek</li>
            </ul>
            <a href="#/register" class="btn btn-accent" style="width: 100%;">Hemen Başla</a>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq" id="faq">
      <div class="container container-sm">
        <div class="section-header">
          <span class="badge badge-primary animate-fade-in-up">❓ SSS</span>
          <h2 class="section-title animate-fade-in-up stagger-1">
            Sıkça Sorulan <span class="text-gradient">Sorular</span>
          </h2>
        </div>
        <div class="faq-list">
          <div class="faq-item card animate-fade-in-up stagger-1" data-faq>
            <div class="faq-question" data-faq-toggle>
              <span>Kurulum zorluk mu?</span>
              <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-answer">
              Kesinlikle hayır! E-posta ile üye olun, menünüzü ekleyin ve QR kodunuzu alın. 
              Tüm süreç 5 dakikadan az sürer. Teknik bilgi gerektirmez.
            </div>
          </div>
          <div class="faq-item card animate-fade-in-up stagger-2" data-faq>
            <div class="faq-question" data-faq-toggle>
              <span>Müşterilerin uygulama indirmesi gerekiyor mu?</span>
              <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-answer">
              Hayır! Müşteriler sadece QR kodu telefonun kamerasıyla tarar ve menü direkt tarayıcıda açılır. 
              Hiçbir uygulama indirmek gerekmez.
            </div>
          </div>
          <div class="faq-item card animate-fade-in-up stagger-3" data-faq>
            <div class="faq-question" data-faq-toggle>
              <span>Fiyatları istediğim zaman değiştirebilir miyim?</span>
              <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-answer">
              Evet! Panel üzerinden fiyatları, ürün açıklamalarını ve kategorileri istediğiniz an güncelleyebilirsiniz.
              Değişiklikler anında müşterilerinize yansır.
            </div>
          </div>
          <div class="faq-item card animate-fade-in-up stagger-4" data-faq>
            <div class="faq-question" data-faq-toggle>
              <span>İptal edebilir miyim?</span>
              <span class="faq-arrow">▼</span>
            </div>
            <div class="faq-answer">
              Tabii ki! Herhangi bir taahhüt yoktur. İstediğiniz zaman iptal edebilirsiniz.
              14 günlük ücretsiz deneme süresinde ödeme alınmaz.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <div class="cta-content animate-fade-in-up">
          <h2 class="cta-title">
            Restoranınızı Dijitalleştirmeye<br>
            <span class="text-gradient">Hazır mısınız?</span>
          </h2>
          <p class="cta-subtitle">
            Hemen ücretsiz hesap oluşturun ve 5 dakikada dijital menünüzü yayınlayın
          </p>
          <a href="#/register" class="btn btn-primary btn-lg">
            <span>🚀</span> Ücretsiz Başlayın
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="nav-logo">
              <span class="nav-logo-icon">📱</span>
              <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
            </div>
            <p class="footer-desc">Restoranlar için modern dijital menü çözümü.</p>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h4>Ürün</h4>
              <a href="#features">Özellikler</a>
              <a href="#pricing">Fiyatlar</a>
              <a href="#faq">SSS</a>
            </div>
            <div class="footer-col">
              <h4>İletişim</h4>
              <a href="mailto:info@menuqr.com">info@menuqr.com</a>
              <a href="tel:+905001234567">0500 123 45 67</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 MenüQR. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  `;

  // FAQ Toggle
  document.querySelectorAll('[data-faq-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('[data-faq]');
      if (item) {
        item.classList.toggle('faq-open');
      }
    });
  });

  // Mobile menu toggle
  const toggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('mobile-menu-open');
      toggle.classList.toggle('active');
    });
  }

  // Navbar scroll effect
  const nav = document.getElementById('landing-nav');
  window.addEventListener('scroll', () => {
    if (nav) {
      if (window.scrollY > 50) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    }
  });
}
