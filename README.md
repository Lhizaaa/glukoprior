# GlukoPrior - Prioritas Penanganan Diabetes Melitus

Aplikasi web **Sistem Pendukung Keputusan (SPK)** untuk menentukan urutan prioritas
penanganan intensif pasien **Diabetes Melitus Tipe 2** menggunakan metode
**SAW (Simple Additive Weighting)** dan **TOPSIS**.

Dibangun sebagai **PWA (Progressive Web App)** statis — bisa di-_install_ ke layar
utama (HP/desktop) dan tetap berjalan **offline** setelah dibuka sekali.

## Fitur

- Dashboard prioritas pasien (ranking TOPSIS)
- Editor data pasien & matriks keputusan (perhitungan otomatis)
- Pengaturan bobot kriteria + komposisi bobot
- Langkah perhitungan SAW & TOPSIS yang transparan
- Perbandingan SAW vs TOPSIS
- PWA: installable, offline-ready (service worker + manifest)

## PRD (Product Requirements Document)

### 1. Layer 1
Role : Frontend engineer
Project : GlukoPrior - Prioritas Penanganan Diabetes Melitus

Stack : Vanilla HTML + CSS

### 2. Layer 2
Fitur :
- a. CRUD pasien: menambah, mengedit, dan menghapus data pasien
- b. CRUD kriteria: mengatur variabel keputusan seperti HbA1c, GDP, tekanan sistolik, komplikasi, dan kepatuhan
- c. Perhitungan otomatis SAW dan TOPSIS saat data atau bobot berubah
- d. Pengaturan bobot kriteria untuk menghitung prioritas penanganan pasien
- e. Rasio tingkat prioritas pasien (tinggi, sedang, rendah) dalam dashboard
- f. Alert visual: pasien dengan risiko tinggi ditandai dengan warna merah/berbeda agar mudah dibaca
- g. Report/recap hasil perankingan pasien dan perbandingan metode SAW vs TOPSIS dalam dashboard

### 3. Layer 3
Constraint :
- a. Web color :
  - --bg: #EEF2F6;
  - --surface: #FFFFFF;
  - --teal: #0E7C6B;
  - --teal-d: #0A5C4F;
  - --blue: #2E6BB0;
  - --p1: #D64545;
  - --p2: #E08A2B;
  - --p3: #C9A227;
  - --p4: #3E9D6E;
- b. Data pasien harus dapat diedit secara langsung dari antarmuka aplikasi
- c. Setiap perubahan pada nilai pasien atau bobot kriteria harus menghitung ulang ranking secara real-time
- d. Hasil keputusan harus dapat dijelaskan secara transparan melalui langkah perhitungan SAW dan TOPSIS
- e. Aplikasi harus dapat digunakan dalam browser tanpa install dependency tambahan dan tetap ramah untuk PWA

### 4. Layer 4 Iteration
- [✓] Dashboard utama menampilkan ringkasan prioritas pasien
- [✓] Halaman data pasien memungkinkan tambah, edit, dan hapus pasien
- [✓] Pengaturan bobot kriteria dapat dilakukan melalui UI
- [✓] Sistem menghitung hasil SAW dan TOPSIS secara otomatis
- [✓] Peringkat pasien ditampilkan dengan tingkat prioritas yang jelas
- [✓] Perbandingan SAW vs TOPSIS tersedia untuk validasi keputusan
- [✓] Aplikasi dapat diakses sebagai PWA dan tetap berfungsi dengan desain responsif

## Struktur Proyek

```
.
├── index.html              # Markup halaman (struktur saja)
├── assets/
│   ├── css/
│   │   └── style.css       # Seluruh gaya/tampilan
│   └── js/
│       ├── data.js         # Data pasien & kriteria (model)
│       ├── engine.js       # Mesin perhitungan SAW & TOPSIS
│       ├── icons.js        # Helper & ikon SVG
│       ├── render.js       # Render UI tiap halaman
│       └── app.js          # Navigasi, inisialisasi, daftar service worker
├── manifest.webmanifest    # Manifest PWA
├── sw.js                   # Service worker (offline cache)
├── favicon.svg             # Favicon vektor
├── vercel.json             # Konfigurasi header/deploy Vercel
├── icons/                  # Ikon PWA (192, 512, maskable, apple-touch)
└── glukoprior.html         # Prototype asli (arsip)
```

### Urutan pemuatan script

File JS adalah _classic script_ (berbagi scope global) dan dimuat berurutan
dengan `defer`: `data.js → engine.js → icons.js → render.js → app.js`.
Urutan ini penting karena tiap berkas memakai definisi dari berkas sebelumnya.

## Menjalankan Secara Lokal

PWA (service worker) butuh server HTTP — tidak bisa dari `file://`.

```bash
npm run dev
# atau
npx serve .
```

Lalu buka `http://localhost:3000`.

> Catatan: service worker hanya aktif di `localhost` atau di domain **HTTPS**.

## Deploy ke Vercel

### Opsi A — Vercel CLI

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # produksi
```

### Opsi B — Dashboard (Git)

1. Push folder ini ke repositori GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new), **Import** repo tersebut.
3. Framework Preset: **Other** (proyek statis, tanpa build step).
   Build Command & Output Directory dibiarkan kosong.
4. Klik **Deploy**.

Tidak ada proses build — Vercel langsung menyajikan file statis di root.

## Metode

- **SAW** — normalisasi (benefit: `x/max`, cost: `min/x`), lalu `V = Σ wⱼ·rᵢⱼ`.
- **TOPSIS** — normalisasi vektor, matriks terbobot, solusi ideal `A⁺`/`A⁻`,
  jarak Euclidean, preferensi `V = D⁻ / (D⁺ + D⁻)`.

Konvensi: nilai klinis lebih buruk = prioritas lebih tinggi. HbA1c, gula darah,
tekanan darah, dan jumlah komplikasi bersifat **benefit**; tingkat kepatuhan
bersifat **cost**.