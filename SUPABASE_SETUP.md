# Supabase Database Setup

Ikuti langkah-langkah berikut untuk mengatur database Supabase untuk aplikasi Virtual Gratitude Exchange:

## 1. Buat Akun Supabase

1. Kunjungi [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Daftar dengan GitHub, Google, atau email
4. Buat organisasi baru (jika diminta)

## 2. Buat Project Baru

1. Klik "New Project"
2. Isi detail project:
   - **Name**: Virtual Gratitude Exchange
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih region terdekat dengan lokasi Anda
3. Klik "Create new project"
4. Tunggu beberapa menit sampai project selesai di-setup

## 3. Dapatkan API Keys

1. Di dashboard project, pergi ke **Settings** → **API**
2. Copy:
   - **Project URL** (contoh: https://abcdefgh.supabase.co)
   - **anon public key** (key yang panjang dimulai dengan eyJ...)

## 4. Setup Database Tables

Pergi ke **SQL Editor** di dashboard Supabase dan jalankan SQL berikut:

```sql
-- Create gratitude_messages table
CREATE TABLE gratitude_messages (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT,
    is_anonymous BOOLEAN DEFAULT true
);

-- Create app_stats table
CREATE TABLE app_stats (
    id BIGSERIAL PRIMARY KEY,
    total_messages BIGINT DEFAULT 0,
    active_users BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE gratitude_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only for gratitude_messages)
CREATE POLICY "Allow public read access" ON gratitude_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON gratitude_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON app_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow public update access" ON app_stats
    FOR UPDATE USING (true);

-- Insert initial stats record
INSERT INTO app_stats (id, total_messages, active_users)
VALUES (1, 0, 0);

-- Insert some sample messages (optional)
INSERT INTO gratitude_messages (message, category, category_label, country) VALUES
('Terima kasih telah selalu menyebarkan kebaikan di sekitar Anda. Dunia menjadi tempat yang lebih baik karena Anda.', 'kindness', 'Atas Kebaikan Hati', 'Indonesia'),
('Kerja keras dan dedikasi Anda sangat menginspirasi. Teruslah berjuang, hasil yang luar biasa menanti!', 'hardwork', 'Atas Kerja Keras', 'Malaysia'),
('Persahabatan seperti Anda adalah hadiah yang sangat berharga. Terima kasih telah menjadi teman yang luar biasa.', 'friendship', 'Atas Persahabatan', 'Singapore'),
('Bantuan yang Anda berikan sangat berarti. Anda telah membuat perbedaan besar dalam hidup seseorang.', 'help', 'Atas Bantuan', 'Thailand'),
('Anda adalah sumber inspirasi bagi banyak orang. Teruslah bersinar dan menginspirasi dunia!', 'inspiration', 'Atas Inspirasi', 'Philippines');
```

## 5. Konfigurasi Aplikasi

1. Buka file `config.js` di project Anda
2. Ganti nilai berikut dengan credentials dari Supabase:

```javascript
const SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL", // Ganti dengan Project URL
  apiKey: "YOUR_SUPABASE_ANON_KEY", // Ganti dengan anon public key
};
```

**Contoh:**

```javascript
const SUPABASE_CONFIG = {
  url: "https://abcdefghijklmnop.supabase.co",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Key yang sangat panjang
};
```

## 6. Test Koneksi

1. Buka `index.html` di browser
2. Periksa status koneksi di bagian header
3. Jika berhasil, status akan menunjukkan "Connected to Supabase database"
4. Jika gagal, akan menggunakan mode fallback dengan localStorage

## 7. Fitur Real-time (Opsional)

Untuk mengaktifkan real-time updates:

1. Di dashboard Supabase, pergi ke **Database** → **Replication**
2. Klik "Create a new publication"
3. Pilih tabel `gratitude_messages`
4. Aktifkan real-time subscription

## Troubleshooting

### Error: "Failed to connect to Supabase"

- Pastikan URL dan API key sudah benar
- Cek koneksi internet
- Pastikan project Supabase sudah aktif

### Error: "Permission denied"

- Pastikan RLS policies sudah dibuat dengan benar
- Cek apakah tabel sudah enable RLS

### Real-time tidak berfungsi

- Pastikan real-time sudah diaktifkan di dashboard
- Cek browser console untuk error messages

## Security Notes

- Anon key aman untuk digunakan di frontend karena dilindungi RLS
- Jangan pernah expose service role key di frontend
- RLS policies sudah dikonfigurasi untuk akses public yang aman

## Fitur Database

✅ **Real-time messaging**: Pesan baru muncul secara real-time  
✅ **Geographic data**: Melacak negara asal pesan  
✅ **Statistics tracking**: Update statistik otomatis  
✅ **Fallback mode**: Berfungsi tanpa database menggunakan localStorage  
✅ **Performance**: Optimized queries dan caching

---

**Happy coding! 🚀**
