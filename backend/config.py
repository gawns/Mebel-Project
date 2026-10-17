"""
Ine Mebel Jepara - Konfigurasi Flask + Postgres (Neon)
======================================================
Database hanya lewat connection string Postgres:

  DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

Neon mengisi nama yang sama (kadang POSTGRES_URL). Lokal ikut string itu.

PENTING untuk deploy:
  - Set AUTH_SECRET ke nilai acak & rahasia (JANGAN pakai default).
  - Set APP_DEBUG=0.
"""

import os
import urllib.parse


def _load_env_file():
    """Muat .env di root proyek (dipakai lokal; di hosting env sudah terisi).

    ponytail: parser KEY=VALUE sederhana, tanpa kutip/ekspansi. Ganti ke
    python-dotenv bila butuh fitur lebih.
    """
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip("'\""))


_load_env_file()


def _env(*names, default=""):
    """Ambil env pertama yang ada & tidak kosong dari daftar nama."""
    for name in names:
        val = os.getenv(name)
        if val is not None and val != "":
            return val
    return default


def _postgres_url():
    url = _env("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL")
    if url.startswith(("postgres://", "postgresql://")):
        return url
    return ""


DATABASE_URL = _postgres_url()

try:
    _parsed = urllib.parse.urlparse(DATABASE_URL) if DATABASE_URL else None
except Exception:
    _parsed = None

DB_HOST = (_parsed.hostname if _parsed else "") or ""
DB_PORT = int(_parsed.port if _parsed and _parsed.port else 5432)
DB_USER = urllib.parse.unquote(_parsed.username or "") if _parsed else ""
DB_NAME = ((_parsed.path or "/").lstrip("/").split("?")[0] if _parsed else "") or ""
DB_TARGET = f"{DB_HOST}/{DB_NAME}" if DB_HOST else "(DATABASE_URL kosong)"

# Server Flask
HOST = os.getenv("APP_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("APP_PORT", "5000")))
DEBUG = os.getenv("APP_DEBUG", "0") == "1"

# Panel admin: login wajib (password tersimpan di tabel admin_users)
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "1") == "1"
AUTH_SECRET = os.getenv("AUTH_SECRET", "ubah-secret-ini-di-hosting")
TOKEN_TTL = int(os.getenv("TOKEN_TTL", str(8 * 60 * 60)))  # 8 jam

# Admin default (dibuat otomatis saat tabel kosong).
# WAJIB diganti lewat env saat deploy!
DEFAULT_ADMIN_USER = os.getenv("DEFAULT_ADMIN_USER", "admin")
DEFAULT_ADMIN_PASS = os.getenv("DEFAULT_ADMIN_PASS", "2027")

# Upload foto produk (dari perangkat lokal -> folder img/)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "img")
UPLOAD_URL = os.getenv("UPLOAD_URL", "img")   # prefix URL publik (folder statis)
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "5"))
ALLOWED_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")