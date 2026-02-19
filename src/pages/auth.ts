// ============================================
// Auth Pages (Login + Register)
// ============================================

import { localDB } from '../firebase';
import { router } from '../router';
import { showToast } from '../toast';

export function renderLogin(app: HTMLElement): void {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
      </div>
      <div class="auth-container animate-scale-in">
        <a href="#/" class="auth-back">← Ana Sayfa</a>
        <div class="auth-header">
          <div class="nav-logo" style="justify-content: center; margin-bottom: 1rem;">
            <span class="nav-logo-icon">📱</span>
            <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
          </div>
          <h1 class="auth-title">Hoş Geldiniz</h1>
          <p class="auth-subtitle">Hesabınıza giriş yapın</p>
        </div>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label class="form-label">E-posta</label>
            <input type="email" class="form-input" id="login-email" placeholder="ornek@email.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Şifre</label>
            <div style="position: relative;">
              <input type="password" class="form-input" id="login-password" placeholder="••••••••" required style="padding-right: 2.5rem;">
              <button type="button" class="password-toggle" id="login-pw-toggle" tabindex="-1" aria-label="Şifreyi göster" style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 4px; opacity: 0.5; transition: opacity 0.2s;">👁️</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" id="login-btn">
            Giriş Yap
          </button>
        </form>
        <div class="auth-footer">
          Hesabınız yok mu? <a href="#/register" class="auth-link">Ücretsiz Kaydolun</a>
        </div>
        <p style="font-size: 0.7rem; color: var(--color-neutral-600); text-align: center; margin-top: 0.75rem; line-height: 1.4;">
          💡 Demo mod: Veriler cihazınızda saklanır. Farklı cihazdan girişte aynı bilgilerle otomatik hesap oluşturulur.
        </p>
      </div>
    </div>
  `;

  // Password toggle
  bindPasswordToggle('login-pw-toggle', 'login-password');

  const form = document.getElementById('login-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('login-email') as HTMLInputElement).value;
    const password = (document.getElementById('login-password') as HTMLInputElement).value;
    const btn = document.getElementById('login-btn') as HTMLButtonElement;

    btn.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
    btn.disabled = true;

    try {
      await localDB.login(email, password);
      showToast('Giriş başarılı!', 'success');
      router.navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Giriş başarısız', 'error');
      btn.innerHTML = 'Giriş Yap';
      btn.disabled = false;
    }
  });
}

export function renderRegister(app: HTMLElement): void {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
      </div>
      <div class="auth-container animate-scale-in">
        <a href="#/" class="auth-back">← Ana Sayfa</a>
        <div class="auth-header">
          <div class="nav-logo" style="justify-content: center; margin-bottom: 1rem;">
            <span class="nav-logo-icon">📱</span>
            <span class="nav-logo-text">Menü<span class="text-gradient">QR</span></span>
          </div>
          <h1 class="auth-title">Ücretsiz Hesap Oluşturun</h1>
          <p class="auth-subtitle">14 gün ücretsiz deneyin</p>
        </div>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label class="form-label">İşletme Adı</label>
            <input type="text" class="form-input" id="reg-business" placeholder="Restoranınızın adı" required>
          </div>
          <div class="form-group">
            <label class="form-label">E-posta</label>
            <input type="email" class="form-input" id="reg-email" placeholder="ornek@email.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Telefon</label>
            <input type="tel" class="form-input" id="reg-phone" placeholder="0500 123 45 67" required>
          </div>
          <div class="form-group">
            <label class="form-label">Şifre</label>
            <div style="position: relative;">
              <input type="password" class="form-input" id="reg-password" placeholder="En az 6 karakter" required minlength="6" style="padding-right: 2.5rem;">
              <button type="button" class="password-toggle" id="reg-pw-toggle" tabindex="-1" aria-label="Şifreyi göster" style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 4px; opacity: 0.5; transition: opacity 0.2s;">👁️</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" id="reg-btn">
            🚀 Ücretsiz Başla
          </button>
        </form>
        <div class="auth-footer">
          Zaten hesabınız var mı? <a href="#/login" class="auth-link">Giriş Yapın</a>
        </div>
      </div>
    </div>
  `;

  // Password toggle
  bindPasswordToggle('reg-pw-toggle', 'reg-password');

  const form = document.getElementById('register-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const business = (document.getElementById('reg-business') as HTMLInputElement).value;
    const email = (document.getElementById('reg-email') as HTMLInputElement).value;
    const phone = (document.getElementById('reg-phone') as HTMLInputElement).value;
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const btn = document.getElementById('reg-btn') as HTMLButtonElement;

    btn.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
    btn.disabled = true;

    try {
      await localDB.register(email, password, business, phone);
      showToast('Hesabınız oluşturuldu! 🎉', 'success');
      router.navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Kayıt başarısız', 'error');
      btn.innerHTML = '🚀 Ücretsiz Başla';
      btn.disabled = false;
    }
  });
}

function bindPasswordToggle(toggleId: string, inputId: string): void {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.textContent = isHidden ? '🙈' : '👁️';
    toggle.style.opacity = isHidden ? '0.8' : '0.5';
    input.focus();
  });

  toggle.addEventListener('mouseenter', () => { toggle.style.opacity = '0.8'; });
  toggle.addEventListener('mouseleave', () => {
    toggle.style.opacity = input.type === 'text' ? '0.8' : '0.5';
  });
}
