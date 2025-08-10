# Virtual Gratitude Exchange

Aplikasi web yang memungkinkan pengguna mengirimkan ucapan terima kasih atau apresiasi anonim kepada orang lain di dunia, tanpa mengetahui siapa pengirimnya. Setiap pengguna bisa menerima atau mengirimkan pesan terima kasih secara acak kepada orang lain di seluruh dunia.

## 🌟 Fitur Utama

### 📤 Kirim Apresiasi

- Pengguna dapat mengirimkan pesan terima kasih anonim
- Pemilihan kategori apresiasi (kebaikan hati, kerja keras, persahabatan, dll.)
- Pesan maksimal 280 karakter dengan counter real-time
- Animasi loading yang menarik saat mengirim pesan

### 📥 Terima Apresiasi

- Menerima pesan apresiasi acak dari pengguna lain
- Pesan tetap anonim untuk menjaga privasi
- Tampilan kartu yang elegan dengan kategori dan timestamp
- Tombol untuk mendapatkan pesan baru

### 📊 Statistik Global

- Jumlah total pesan yang terkirim
- Statistik pesan hari ini
- Jumlah pengguna aktif
- Statistik kategori populer dengan ranking

## 🎨 Desain

### Karakteristik Desain

- **Elegan**: Gradient background yang menarik dengan warna modern
- **Clean**: Layout yang bersih tanpa elemen yang mengganggu
- **Minimalist**: Fokus pada konten utama dengan white space yang cukup

### Fitur Visual

- Gradient background dengan warna ungu dan biru
- Kartu dengan border-radius yang smooth
- Animasi micro-interactions yang halus
- Responsive design untuk semua ukuran layar
- Font Inter untuk keterbacaan yang optimal

## 🛠️ Teknologi

- **HTML5**: Struktur semantik dan accessible
- **CSS3**: Styling modern dengan Flexbox/Grid dan animasi
- **Vanilla JavaScript**: Interaktivitas tanpa dependency external
- **Supabase**: Database PostgreSQL dengan real-time features
- **Font Awesome**: Icon yang konsisten dan menarik
- **Google Fonts**: Typography yang modern

## 🗄️ Database & Real-time Features

### Supabase Integration

- **PostgreSQL Database**: Penyimpanan pesan yang scalable dan reliable
- **Real-time Subscriptions**: Update otomatis saat ada pesan baru
- **Geographic Tracking**: Melacak negara asal pesan untuk diversitas global
- **Fallback Mode**: Aplikasi tetap berfungsi tanpa database menggunakan localStorage

### Database Schema

```sql
-- Table: gratitude_messages
- id (Primary Key)
- message (Text)
- category (Text)
- category_label (Text)
- created_at (Timestamp)
- country (Text)
- is_anonymous (Boolean)

-- Table: app_stats
- id (Primary Key)
- total_messages (Integer)
- active_users (Integer)
- updated_at (Timestamp)
```

## 📱 Responsive Design

Aplikasi dioptimalkan untuk berbagai ukuran layar:

- Desktop (≥768px)
- Tablet (768px - 480px)
- Mobile (≤480px)

## 🚀 Cara Menjalankan

### Quick Start (Demo Mode)

1. Clone atau download proyek ini
2. Buka `index.html` di browser web modern
3. Aplikasi akan berjalan dalam mode demo menggunakan localStorage

### Setup dengan Database (Recommended)

1. **Setup Supabase Database**:

   - Ikuti panduan lengkap di [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)
   - Buat akun di [supabase.com](https://supabase.com)
   - Buat project baru dan setup database tables
   - Copy URL dan API key dari dashboard

2. **Konfigurasi Aplikasi**:

   - Edit file `config.js`
   - Ganti `YOUR_SUPABASE_URL` dan `YOUR_SUPABASE_ANON_KEY` dengan credentials Anda

3. **Jalankan Aplikasi**:
   - Buka `index.html` di browser
   - Cek status koneksi di header (harus menunjukkan "Connected to Supabase database")
   - Mulai mengirim dan menerima apresiasi dari seluruh dunia!

## 📂 Struktur File

```
project_01/
├── index.html              # Halaman utama aplikasi
├── styles.css              # Styling dan animasi
├── script.js               # Logika aplikasi JavaScript
├── config.js               # Konfigurasi database Supabase
├── database.js             # Service layer untuk database operations
├── README.md               # Dokumentasi proyek
└── SUPABASE_SETUP.md       # Panduan setup database
```

## 💾 Penyimpanan Data

### Mode Database (Recommended)

- **Supabase PostgreSQL**: Penyimpanan cloud yang reliable dan scalable
- **Real-time sync**: Pesan tersinkronisasi real-time dengan pengguna lain
- **Geographic data**: Melacak negara asal untuk pengalaman global
- **Persistent storage**: Data tersimpan permanen dan dapat diakses dari device manapun

### Mode Fallback (Demo)

- **localStorage**: Penyimpanan lokal di browser untuk demo
- **Offline capability**: Berfungsi tanpa koneksi internet
- **Demo data**: Tersedia pesan contoh untuk pengalaman pertama
- **Local statistics**: Statistik dihitung dari data lokal

### Auto-fallback System

Aplikasi secara otomatis beralih ke mode fallback jika:

- Supabase belum dikonfigurasi (`config.js` masih default)
- Koneksi database gagal
- Error saat mengakses database

## ✨ Fitur Khusus

### Animasi & Efek

- Pulse animation pada logo
- Slide up animation saat section muncul
- Hover effects pada kartu dan tombol
- Ripple effect saat klik tombol
- Floating hearts animation
- Loading spinner yang menarik

### Interaktivitas

- Character counter real-time
- Modal sukses dengan animasi
- Real-time message notifications
- Automatic statistics updates
- Navigasi yang smooth antar section
- Connection status indicator

### Database Features

- **Real-time messaging**: Pesan baru muncul secara otomatis
- **Global reach**: Pesan dari berbagai negara di dunia
- **Persistent storage**: Data tersimpan di cloud database
- **Automatic failover**: Fallback ke localStorage jika database tidak tersedia
- **Geographic diversity**: Tracking lokasi untuk pengalaman global

### Accessibility

- Focus indicators yang jelas
- Keyboard navigation support
- Semantic HTML structure
- Reduced motion support untuk pengguna dengan preferensi khusus

## 🎯 Kategori Apresiasi

1. **Atas Kebaikan Hati** - Untuk tindakan baik dan empati
2. **Atas Kerja Keras** - Untuk dedikasi dan usaha
3. **Atas Persahabatan** - Untuk dukungan sebagai teman
4. **Atas Bantuan** - Untuk assistance dan support
5. **Atas Inspirasi** - Untuk motivasi dan inspirasi
6. **Apresiasi Umum** - Untuk apresiasi general

## 🌍 Konsep Global

Aplikasi ini dirancang dengan konsep menghubungkan orang-orang di seluruh dunia melalui apresiasi positif, menciptakan rantai kebaikan yang dapat menyebar ke berbagai belahan dunia.

## 📄 Lisensi

Proyek ini dibuat untuk tujuan pembelajaran dan demo. Bebas digunakan dan dimodifikasi sesuai kebutuhan.

---

**Dibuat dengan ❤️ untuk menyebarkan apresiasi di dunia**
