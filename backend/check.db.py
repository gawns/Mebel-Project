"""Cek koneksi Postgres (Neon) dan status database."""
import sys
import psycopg
import config


def main():
    print("=" * 60)
    print("  Cek koneksi Postgres (Neon)")
    print("=" * 60)
    print(f"  Target : {config.DB_TARGET}")
    print("-" * 60)

    if not config.DATABASE_URL:
        print("  GAGAL: DATABASE_URL kosong.")
        return 1

    try:
        conn = psycopg.connect(config.DATABASE_URL, connect_timeout=5)
    except psycopg.Error as exc:
        print(f"  GAGAL koneksi ke Postgres: {exc}")
        return 1

    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT version()")
            print(f"  OK - Postgres terhubung. Versi: {cur.fetchone()[0]}")
            cur.execute(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'products'"
            )
            if not cur.fetchone():
                print("  Tabel products belum ada. Jalankan: python db-init.py")
                return 1
            print("  OK - Tabel products ada.")
            cur.execute("SELECT COUNT(*) FROM products")
            total = cur.fetchone()[0]
            cur.execute("SELECT status, COUNT(*) FROM products GROUP BY status")
            print(f"  OK - Total produk: {total}")
            for status, count in cur.fetchall():
                print(f"       - {status}: {count}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
