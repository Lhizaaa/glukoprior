# GlukoPrior — SPK Prioritas Penanganan Diabetes Melitus

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
