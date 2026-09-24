from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from .dictionary import log_unmatched


router = APIRouter(
    prefix="/api/prescriptions",
    tags=["Prescriptions"]
)


# =========================================================
# إعدادات بيئة OCR
# =========================================================
# نظام PaddleOCR يعمل داخل بيئته الخاصة (OCR/ocr-venv - Python 3.11)
# حتى لا يتعارض مع بيئة الـ Backend (Python 3.14).
#
# أولاً يُحاول استدعاء "عامل OCR الدائم" OCR/ocr_worker.py (يبقي النموذج
# محمّلاً في الذاكرة → سرعة عالية)، وإن لم يكن يعمل يستدعي الـ pipeline
# كعملية منفصلة (أبطأ لأن كل مرة يعيد تحميل النماذج).
#
# نلت ضبط عبر متغيرات بيئة:
#   OCR_WORKER_URL      مثلاً http://127.0.0.1:8001  (افتراضي)
#   OCR_PYTHON          مسار بايثون بيئة ocr-venv

_BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = _BACKEND_DIR.parent

OCR_DIR = PROJECT_ROOT / "OCR"
PIPELINE_SCRIPT = OCR_DIR / "ocr_pipeline.py"

OCR_PYTHON = Path(
    os.environ.get(
        "OCR_PYTHON",
        str(OCR_DIR / "ocr-venv" / "Scripts" / "python.exe"),
    )
)

OCR_WORKER_URL = os.environ.get("OCR_WORKER_URL", "http://127.0.0.1:8001")

OCR_WORKER_TIMEOUT = 60   # العامل دافئ، وقت أقل كافٍ

UPLOADS_DIR = OCR_DIR / "uploads"

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".bmp", ".webp",
    ".tiff", ".tif", ".gif",
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB


# =========================================================
# استدعاء عامل OCR الدائم
# =========================================================

def _run_ocr_worker(image_bytes: bytes):
    """محاولة استدعاء العامل الدائم. ترجع النتيجة أو None عند فشل الاتصال."""
    try:
        with httpx.Client(timeout=OCR_WORKER_TIMEOUT) as client:
            response = client.post(
                f"{OCR_WORKER_URL}/ocr",
                content=image_bytes,
            )
    except (httpx.ConnectError, httpx.TimeoutException, OSError):
        return None

    if response.status_code != 200:
        return None

    try:
        return response.json()
    except json.JSONDecodeError:
        return None


# =========================================================
# تشغيل خط الأنابيب كعملية منفصلة (بديل)
# =========================================================

def _run_ocr_pipeline(image_path: Path):
    """
    تشغيل OCR/medicine pipeline عبر بيئة PaddleOCR
    وقراءة النتيجة JSON من stdout (بديل للعامل الدائم).
    """
    python_exec = str(OCR_PYTHON)

    if not Path(python_exec).exists():
        # بديل: محاولة استخدام أي python في المسار
        python_exec = "python"

    command = [
        python_exec,
        str(PIPELINE_SCRIPT),
        "--json",
        str(image_path),
    ]

    try:
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=180,   # تحميل النماذج + المعالجة قد تأخذ وقتاً
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail="تجاوزت معالجة الوصفة الوقت المسموح.",
        )
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"تعذر تشغيل نظام OCR: {exc}",
        )

    if process.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=(
                "نظام OCR لم يكمل المعالجة بنجاح."
                + (f" {process.stderr.strip()[-300:]}" if process.stderr else "")
            ),
        )

    try:
        return json.loads(process.stdout.strip())
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="مخرج نظام OCR غير صالح.",
        )


# =========================================================
# قراءة وصفة طبية من صورة
# =========================================================

@router.post("/ocr")
async def read_prescription(
    image: UploadFile = File(...),
):
    """
    رفع صورة روشة طبية واستخراج الأدوية منها.

    - يحفظ الصورة مؤقتاً
    - يشغّل PaddleOCR (عبر العامل الدائم إن وجد + التصنيف + المطابقة)
    - يرجع قائمة الأدوية المطابقة مع نسبة الثقة
    """
    if not image.filename:
        raise HTTPException(
            status_code=400,
            detail="لم يتم اختيار صورة.",
        )

    suffix = Path(image.filename or "").suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "صيغة الصورة غير مدعومة. المسموح: "
                + ", ".join(sorted(ALLOWED_EXTENSIONS))
            ),
        )

    content = await image.read()

    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="حجم الصورة يتجاوز 10 ميجابايت.",
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="الملف فارغ.",
        )

    # ---------------------------------------------
    # المعالجة: عامل دائم أولاً ثم بديل العملية
    # ---------------------------------------------

    result = _run_ocr_worker(content)

    if result is None:
        # حفظ الصورة مؤقتاً للمسار البديل
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

        target = UPLOADS_DIR / f"{uuid4().hex}{suffix}"

        try:
            target.write_bytes(content)
            result = _run_ocr_pipeline(target)
        finally:
            try:
                target.unlink(missing_ok=True)
            except OSError:
                pass

    # ---------------------------------------------
    # تجهيز الرد
    # ---------------------------------------------

    medicines = result.get("matched_medicines", [])
    unmatched = result.get("unmatched_medicine_lines", [])

    # تسجيل الخطوط غير المطابقة (طبقة B — لا إسقاط صامت)
    log_unmatched(
        image_name=result.get("image", ""),
        unmatched_lines=unmatched,
    )

    # توصيف بسيط للمستخدم
    summary = {
        key: value
        for key, value in result.items()
        if key != "items"
    }

    return {
        "status": "ok",
        "message": (
            f"تم التعرف على {len(medicines)} دواء"
            f"{' و' + str(len(unmatched)) + ' سطراً غير مطابق' if unmatched else ''}."
        ),
        "data": summary,
    }