# Deploy — Ine Mebel Jepara (Vercel + Neon Postgres)

## 1. Neon (database)

1. Buat project di https://neon.tech → copy **connection string**
   (`postgresql://...?sslmode=require`).
2. Di terminal, isi `.env` di root proyek:

```
DATABASE_URL=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=<hasil: python -c "import secrets;print(secrets.token_urlsafe(48))">
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=<password kuat>
```

3. Buat tabel + seed:

```powershell
cd backend
python db-init.py
python check.db.py   # verifikasi
```

## 2. Vercel (aplikasi)

1. https://vercel.com/new → import repo GitHub `gawns/Mebel-Project`.
2. Framework Preset: **Flask** (terdeteksi dari `requirements.txt`; entrypoint
   `app.py` di root hanya re-export `backend.app:app`). Jangan tambahkan
   `pyproject.toml` — Vercel lalu menjalankan `uv lock` dan menuntut tabel
   `[project]` berisi dependensi.
3. Environment Variables (Production + Preview):

| Env | Isi |
| --- | --- |
| `DATABASE_URL` | connection string Neon |
| `AUTH_SECRET` | string acak panjang |
| `AUTH_ENABLED` | `1` |
| `APP_DEBUG` | `0` |
| `DEFAULT_ADMIN_USER` | `admin` |
| `DEFAULT_ADMIN_PASS` | password kuat (dipakai saat tabel admin kosong) |
| `TOKEN_TTL` | `28800` |

4. Deploy, lalu cek:
   - `/api/live` → `{"status":"alive"}`
   - `/api/health` → `database: ok`, `config: ok`
   - `/` , `/katalog.html` , `/admin.html`

## 3. Batasan Vercel

- Filesystem **read-only**: upload foto produk dinonaktifkan
  (`/api/upload` → 422). Tambah foto lewat folder `img/` + redeploy,
  atau pindah ke object storage (Vercel Blob / S3).
- Flask jalan sebagai satu Function; `vercel.json` set `maxDuration: 30`.
- Static (`src/**`, `img/**`) ikut bundle function (default Vercel:
  semua file proyek terbundel) lalu disajikan lewat route Flask.

## 4. Lokal

```powershell
cd backend
python app.py            # baca .env di root proyek
```

## 5. Ganti password admin

Password tersimpan sebagai hash PBKDF2 di tabel `admin_users`. Untuk mengganti
(mis. dari Neon SQL Editor tidak bisa — harus lewat Python):

```powershell
cd backend
python -c "import db; db.set_admin_password('admin', 'PasswordBaru#123'); print('OK')"
```
