// ============================================
// MenüQR - Main Entry Point
// ============================================

import './style.css';
import './landing.css';
import './dashboard.css';
import './menu.css';
import { router } from './router';
import { renderLanding } from './pages/landing';
import { renderLogin, renderRegister } from './pages/auth';
import { renderDashboard, renderMenuEditor } from './pages/dashboard';
import { renderMenu } from './pages/menu';

const app = document.getElementById('app')!;

// Configure routes
router
  .on('/', () => {
    renderLanding(app);
    window.scrollTo(0, 0);
  })
  .on('/login', () => {
    renderLogin(app);
    window.scrollTo(0, 0);
  })
  .on('/register', () => {
    renderRegister(app);
    window.scrollTo(0, 0);
  })
  .on('/dashboard', () => {
    renderDashboard(app);
    window.scrollTo(0, 0);
  })
  .on('/dashboard/restaurant/:id', (params) => {
    renderMenuEditor(app, params.id);
    window.scrollTo(0, 0);
  })
  .on('/menu/:slug', (params) => {
    renderMenu(app, params.slug);
    window.scrollTo(0, 0);
  })
  .notFound(() => {
    app.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem;">
        <div style="font-size: 5rem; margin-bottom: 1rem;">🔍</div>
        <h1 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 0.5rem;">Sayfa Bulunamadı</h1>
        <p style="color: var(--color-neutral-400); margin-bottom: 1.5rem;">Aradığınız sayfa mevcut değil.</p>
        <a href="#/" class="btn btn-primary">Ana Sayfaya Dön</a>
      </div>
    `;
  });

// Start router
router.start();

console.log(`
╔══════════════════════════════════════╗
║     📱 MenüQR - Dijital Menü       ║
║     ════════════════════════        ║
║  Restoranlar için QR menü sistemi   ║
║                                      ║
║  Firebase ayarı için:                ║
║  → src/firebase.ts dosyasını düzenle ║
╚══════════════════════════════════════╝
`);
