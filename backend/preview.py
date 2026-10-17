"""
DEV PREVIEW ONLY - bukan bagian produksi.
Jalankan: python preview.py  -> http://127.0.0.1:5055

Kenapa ada: app.py butuh database Postgres yang tidak selalu tersedia.
Server ini menyajikan file statis + /api/products + /api/reviews dari SEED
di db-init.py, supaya tampilan bisa dilihat & diverifikasi di browser.
Hapus file ini saat deploy (hosting pakai app.py).
"""
import importlib.util
import json
import os
import sys

from flask import Flask, jsonify, request, send_from_directory

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # root proyek
HTML_DIR = os.path.join(ROOT, "src", "html")
app = Flask(__name__, static_folder=None)


def _load_seed():
    spec = importlib.util.spec_from_file_location("db_init", os.path.join(ROOT, "db-init.py"))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["db_init"] = mod
    spec.loader.exec_module(mod)
    return mod.SEED


def _to_product(row, idx):
    def f(key, default=0.0):
        v = row.get(key)
        return float(v) if v not in (None, "") else default

    return {
        "id": idx + 1,
        "name": row["name"], "sku": row["sku"], "category": row["category"],
        "subcategory": row.get("subcategory") or "", "brand": row.get("brand") or "",
        "price": int(row["price"] or 0),
        "discountPrice": int(row["discount_price"]) if row.get("discount_price") else None,
        "stock": int(row.get("stock") or 0),
        "desc": row.get("description") or "", "img": row.get("img") or "",
        "imgAlt": row.get("img_alt") or "", "images": [],
        "videoUrl": row.get("video_url") or "",
        "material": row.get("material") or "", "woodType": row.get("wood_type") or "",
        "warna": row.get("warna") or "", "finishing": row.get("finishing") or "",
        "berat": row.get("berat") or "",
        "dimensiPanjang": f("dimensi_panjang"), "dimensiLebar": f("dimensi_lebar"),
        "dimensiTinggi": f("dimensi_tinggi"),
        "kapasitasBeban": f("kapasitas_beban") or None,
        "garansi": row.get("garansi") or "", "kondisi": row.get("kondisi") or "baru",
        "perakitan": row.get("perakitan") or "sudah",
        "pelengkap": row.get("pelengkap") or "", "relasiTipe": row.get("relasi_tipe") or "",
        "tags": [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()],
        "status": row.get("status") or "aktif",
    }


PRODUCTS = [_to_product(r, i) for i, r in enumerate(_load_seed())]

REVIEWS = [
    {"id": 1, "sku": "IMJ-0001", "name": "Sari Rahayu", "rating": 5,
     "comment": "Kursinya kokoh dan finishing halus. Dikirim ke Jakarta aman, dibungkus rapi.",
     "created_at": "2026-08-02T10:00:00"},
    {"id": 2, "sku": "IMJ-0003", "name": "Budi Wicaksono", "rating": 5,
     "comment": "Sofa sudah 2 tahun dipakai harian, busanya masih padat. Worth it.",
     "created_at": "2026-07-19T10:00:00"},
    {"id": 3, "sku": "IMJ-0002", "name": "Dian Novita", "rating": 4,
     "comment": "Meja makannya bagus, tapi perakitan butuh 2 orang. Tim bantu lewat video call.",
     "created_at": "2026-06-11T10:00:00"},
]


@app.route("/api/products")
def products():
    sku = (request.args.get("sku") or "").strip()
    if sku:
        for p in PRODUCTS:
            # Produk nonaktif tidak boleh bisa dibuka lewat URL langsung.
            if p["sku"] == sku and p.get("status") == "aktif":
                return jsonify({"success": True, "product": p})
        return jsonify({"success": False, "message": "Produk tidak ditemukan."}), 404
    pid = (request.args.get("pid") or request.args.get("id") or "").strip()
    if pid.isdigit():
        for p in PRODUCTS:
            if p["id"] == int(pid) and p.get("status") == "aktif":
                return jsonify({"success": True, "product": p})
        return jsonify({"success": False, "message": "Produk tidak ditemukan."}), 404
    # Samakan dengan produksi: daftar publik hanya produk berstatus 'aktif'.
    visible = [p for p in PRODUCTS if p.get("status") == "aktif"]
    return jsonify({"success": True, "count": len(visible), "products": visible})


@app.route("/api/reviews")
def reviews():
    sku = (request.args.get("sku") or "").strip()
    # script.js memanggil ?product_id=, jadi dukung keduanya (sama seperti app.py).
    pid = (request.args.get("product_id") or "").strip()
    if not sku and pid.isdigit():
        match = next((p for p in PRODUCTS if p["id"] == int(pid)), None)
        sku = match["sku"] if match else ""
    rows = [r for r in REVIEWS if r["sku"] == sku] if sku else []
    avg = round(sum(r["rating"] for r in rows) / len(rows), 1) if rows else 0
    return jsonify({"success": True, "reviews": rows, "average": avg, "count": len(rows)})


@app.route("/api/track/<path:_>", methods=["POST"])
@app.route("/api/track/view", methods=["POST"])
def track(_=None):
    return jsonify({"success": True})


@app.route("/")
def home():
    return send_from_directory(HTML_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(ROOT, filename)


if __name__ == "__main__":
    print(f"{len(PRODUCTS)} produk dari SEED")
    app.run(host="127.0.0.1", port=5055, debug=False)
