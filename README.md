# 🍽️ Cosmic Crater - QR Menü & Restoran Yönetim Sistemi

Restoranlara özel dijital QR menü, sipariş yönetimi, müşteri geri bildirimi ve AI menü asistanı.

## ✨ Özellikler

- 📱 **QR Menü** - Müşteriler QR kodu ile menüye erişir
- 🛒 **Online Sipariş** - Masadan direkt sipariş + POS'suz kart ödeme
- 🤖 **AI Menü Asistanı** - Müşteri yorumlarına göre akıllı öneriler
- ⭐ **Geri Bildirim** - Ödeme sonrası müşteri değerlendirmesi
- 📊 **Dashboard** - Restoran yönetim paneli
- 🌍 **Çoklu Dil** - TR, EN, AR, DE, FR, RU desteği
- 🔔 **Garson Çağırma** - Masadan tek tuşla
- 📋 **Alerjen Bilgileri** - 14 farklı alerjen takibi

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

## 🌐 Deploy (Render)

1. GitHub'a push et
2. [Render.com](https://render.com) → **New Static Site**
3. GitHub repo'yu bağla
4. Ayarlar:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Deploy! 🎉

## 🛠️ Teknolojiler

- **Vite** + TypeScript
- **Vanilla CSS** (framework yok)
- **localStorage** tabanlı veritabanı
- **Offline AI** (API gerektirmez)

## 📁 Proje Yapısı

```
src/
├── pages/
│   ├── landing.ts    # Ana sayfa
│   ├── auth.ts       # Giriş/Kayıt
│   ├── dashboard.ts  # Yönetim paneli
│   └── menu.ts       # Müşteri menü sayfası
├── ai.ts             # AI menü asistanı
├── firebase.ts       # Veritabanı (localStorage)
├── router.ts         # SPA router
├── templates.ts      # HTML şablonları
├── style.css         # Genel stiller
├── dashboard.css     # Dashboard stilleri
├── menu.css          # Menü stilleri
└── landing.css       # Landing page stilleri
```
