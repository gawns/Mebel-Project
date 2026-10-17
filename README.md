# Ine Mebel Jepara

Katalog mebel showroom di Bawu, Jepara. Flask + Postgres (Neon), halaman katalog, plus panel admin.

- Repo: https://github.com/gawns/Mebel-Project
- Live: https://jeparamebelku.up.railway.app

## Struktur

```
src/html, src/css, src/js
backend/   app.py, config.py, db.py, db-init.py
img/       foto produk
```

Database hanya lewat `DATABASE_URL` (Postgres/Neon):

```bash
DATABASE_URL=postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require
```

Dari folder `backend/`:

```bash
cd backend
python db-init.py   # buat tabel + seed
python app.py
```

Buka http://127.0.0.1:5000/

Deploy: lihat `DEPLOY-VERCEL.md` (Vercel + Neon).

## Halaman

| Halaman | URL | Keterangan |
|---|---|---|
| Beranda | `/index.html` | Hero, kategori, produk pilihan |
| Katalog | `/katalog.html` | Filter, sortir, load more, wishlist |
| Detail produk | `/detail.html?sku=IMJ-0001` | Pakai SKU. `?id=1` masih bisa. Isinya diisi JS. |
| 404 | `/404.html` | Halaman atau SKU tidak ketemu |
| Admin produk | `/admin.html` | Tambah, ubah, hapus produk |
| Admin statistik | `/admin-stats.html` | Kunjungan, produk terpopuler |
| Admin ulasan | `/admin-ulasan.html` | Tambah dan hapus ulasan |

Login admin ada di tabel `admin_users`. Admin default dibuat dari env `DEFAULT_ADMIN_USER` / `DEFAULT_ADMIN_PASS` saat tabel masih kosong. Ganti kapan saja lewat `db.set_admin_password(...)`.

## API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/products` | Produk yang aktif |
| GET | `/api/products?sku=IMJ-0001` | Satu produk, lewat SKU |
| GET | `/api/products?id=1` | Satu produk, lewat ID |
| GET | `/api/products?include_all=1` | Semua produk (admin) |
| POST/PUT/DELETE | `/api/products` | Ubah produk. SKU tidak ikut berubah |
| GET | `/api/reviews?sku=IMJ-0001` | Ulasan satu produk |
| GET | `/api/reviews/all` | Semua ulasan (admin) |
| POST | `/api/reviews` | Tambah ulasan (admin) |
| DELETE | `/api/reviews?id=1` | Hapus ulasan (admin) |
| GET | `/api/admin/stats?days=7` | Statistik (admin) |
| POST | `/api/login` | Login admin, balikin token |

## Catatan

- SKU di form admin dikunci, biar URL `detail.html?sku=...` tidak pindah.
- Foto ada di folder `img/`. Data lama: `python fix-images.py` dari `backend/`.
- `detail.html` cuma kerangka. Galeri diisi `script.js` setelah data masuk.
- SKU atau ID yang tidak ada diarahkan ke `/404.html`. Request `/api/*` tetap JSON.
- Wishlist disimpan di `localStorage`, per perangkat.

## Alamat showroom

RT.27/RW.06, Bawu III, Bawu, Kec. Batealit, Kabupaten Jepara, Jawa Tengah 59461