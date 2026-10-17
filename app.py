"""Entrypoint untuk Vercel.

Vercel mencari instance `app` di app.py / index.py / server.py / main.py /
wsgi.py. Aplikasi aslinya ada di backend/app.py; file ini hanya mengeksposnya
supaya tidak perlu `[tool.vercel] entrypoint` di pyproject.toml (yang memicu
`uv lock` dan menuntut tabel `[project]`).
"""

from backend.app import app  # noqa: F401
