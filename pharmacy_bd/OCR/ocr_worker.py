"""
عامل OCR دائم — يخمّل نموذج PaddleOCR مرة واحدة فقط
ويستقبل صور الوصفات عبر HTTP ويُرجع النتيجة JSON.

التشغيل:
    OCR\\ocr-venv\\Scripts\\python.exe OCR\\ocr_worker.py [--port 8001]

الاستخدام من الـ Backend:
    POST http://127.0.0.1:8001/ocr   (body = بايتات الصورة الخام)
    الرد: JSON مطابق لنتيجة ocr_pipeline.process_image

لا يحتاج سوى مكتبات Python القياسية + بيئة ocr-venv.
"""

import io
import json
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent))

from ocr_pipeline import OcrPipeline  # noqa: E402


MAX_BODY = 15 * 1024 * 1024  # 15 MB


class OcrRequestHandler(BaseHTTPRequestHandler):

    pipeline = None

    def log_message(self, fmt, *args):
        print(f"[worker] {self.address_string()} - {fmt % args}", flush=True)

    def _send_json(self, payload: dict, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path == "/reload":
            try:
                OcrRequestHandler.pipeline = OcrPipeline()
                self._send_json({
                    "status": "ok",
                    "entries": OcrRequestHandler.pipeline.matcher.entry_count,
                })
            except Exception as exc:
                self._send_json({"status": "error", "error": str(exc)}, status=500)
            return

        if self.path != "/ocr":
            self._send_json({"error": "مسار غير معروف"}, status=404)
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            self._send_json({"error": "Content-Length غير صالح"}, status=400)
            return

        if length <= 0 or length > MAX_BODY:
            self._send_json({"error": "حجم الصورة غير صالح"}, status=413)
            return

        data = self.rfile.read(length)

        if not data:
            self._send_json({"error": "ملف فارغ"}, status=400)
            return

        try:
            result = self._process(data)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=500)
            return

        self._send_json(result)

    def _process(self, data: bytes):
        # حفظ البايتات مؤقتاً ثم معالجتها
        suffix = ".img"
        with tempfile.NamedTemporaryFile(
            prefix="rx_", suffix=suffix, delete=False
        ) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        try:
            result = self.pipeline.process_image(tmp_path)
        finally:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except OSError:
                pass

        return result


def main():
    import argparse

    parser = argparse.ArgumentParser(description="عارض OCR دائم")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    print("[worker] جارٍ تحميل نموذج PaddleOCR... (قد يأخذ دقائق أول مرة)", flush=True)

    OcrRequestHandler.pipeline = OcrPipeline()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), OcrRequestHandler)
    print(f"[worker] جاهز على 127.0.0.1:{args.port} — النموذج محمّل في الذاكرة", flush=True)
    print(f"WORKER_READY port={args.port}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[worker] إيقاف...", flush=True)
        server.shutdown()


if __name__ == "__main__":
    main()