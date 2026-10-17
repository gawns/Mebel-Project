"""
Perbaikan gambar produk: pastikan setiap produk punya file gambar lokal (img/).
Jalankan sekali: python fix-images.py
"""

import os
import sys

import psycopg
from psycopg.rows import dict_row

import config

DEFAULT_IMG = "img/produk-sofa-klasik-marun.jpeg"


def main():
    if not config.DATABASE_URL:
        print("DATABASE_URL kosong.")
        return 1
    conn = psycopg.connect(
        config.DATABASE_URL, autocommit=True, row_factory=dict_row,
    )
    conn.cursor_factory = psycopg.ClientCursor
    with conn, conn.cursor() as cur:
        # 1) Gambar yang masih mengarah ke Unsplash (foto di luar repo) -> default.
        cur.execute(
            "UPDATE products SET img = %s WHERE img LIKE '%%images.unsplash.com%%'",
            (DEFAULT_IMG,),
        )
        print(f"  sisa unsplash diganti default: {cur.rowcount} baris")

        # 2) Gambar yang menunjuk file hilang -> pakai gambar default.
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # root proyek
        cur.execute("SELECT id, sku, img FROM products")
        for row in cur.fetchall():
            path = row["img"] or ""
            if not path.startswith("img/") or os.path.isfile(os.path.join(base, path)):
                continue
            cur.execute(
                "UPDATE products SET img = %s WHERE id = %s",
                (DEFAULT_IMG, row["id"]),
            )
            print(f"  file hilang {row['sku']} ({path}) -> default")

        cur.execute("SELECT COUNT(*) AS n FROM products WHERE img LIKE '%%unsplash%%'")
        print("  sisa baris unsplash:", cur.fetchone()["n"])


if __name__ == "__main__":
    main()

