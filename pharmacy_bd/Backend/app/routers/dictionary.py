from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/ocr", tags=["OCR Dictionary"])


# =========================================================
# إعدادات
# =========================================================

_BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = _BACKEND_DIR.parent
LOCAL_DICT = PROJECT_ROOT / "OCR" / "local_drug_aliases.json"
UNMATCHED_LOG = _BACKEND_DIR / "data" / "unmatched_log.json"
OCR_WORKER_URL = os.environ.get("OCR_WORKER_URL", "http://127.0.0.1:8001")

_lock = threading.Lock()


# =========================================================
# نماذج الإدخال
# =========================================================

class AddDrugRequest(BaseModel):
    brand_name: str = Field(..., min_length=1, max_length=200)
    generic_name: str = Field(..., min_length=1, max_length=200)
    aliases: list[str] = Field(default_factory=list)
    dosage_form: str = Field(default="", max_length=100)
    active_ingredients: list[str] = Field(default_factory=list)
    atc_codes: list[str] = Field(default_factory=list)


# =========================================================
# تسجيل الأدوية غير المطابقة (طبقة B)
# =========================================================

def log_unmatched(image_name: str, unmatched_lines: list[dict]):
    """تسجيل سطور الأدوية غير المطابقة في ملف محلي."""
    if not unmatched_lines:
        return

    UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "image": image_name,
        "lines": [
            {"text": line.get("text", ""), "score": line.get("score")}
            for line in unmatched_lines
        ],
    }

    with _lock:
        try:
            if UNMATCHED_LOG.exists():
                log_data = json.loads(UNMATCHED_LOG.read_text(encoding="utf-8"))
            else:
                log_data = []
        except (json.JSONDecodeError, OSError):
            log_data = []

        log_data.append(entry)

        # الاحتفاظ بآخر 1000 سجل فقط
        if len(log_data) > 1000:
            log_data = log_data[-1000:]

        UNMATCHED_LOG.write_text(
            json.dumps(log_data, ensure_ascii=False, indent=1),
            encoding="utf-8",
        )


# =========================================================
# إضافة دواء إلى القاموس المحلي (طبقة C)
# =========================================================

def _load_local_dict() -> dict:
    if LOCAL_DICT.exists():
        try:
            return json.loads(LOCAL_DICT.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {"drugs": []}


def _save_local_dict(data: dict):
    LOCAL_DICT.write_text(
        json.dumps(data, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )


def _reload_worker():
    """إعادة تحميل القاموس في العامل الدائم (إن كان يعمل)."""
    try:
        with httpx.Client(timeout=5) as client:
            resp = client.post(f"{OCR_WORKER_URL}/reload")
            if resp.status_code == 200:
                return resp.json()
    except (httpx.ConnectError, httpx.TimeoutException, OSError):
        pass
    return None


@router.post("/dictionary/add")
def add_drug_to_dict(req: AddDrugRequest):
    """
    إضافة دواء محلي إلى القاموس.
    يُحفظ في local_drug_aliases.json ثم يعيد تحميل القاموس في العامل الدائم.
    """
    with _lock:
        data = _load_local_dict()
        drugs = data.setdefault("drugs", [])

        # بناء المرادفات
        aliases = list(req.aliases)
        brand_lower = req.brand_name.lower()
        if brand_lower not in aliases:
            aliases.insert(0, brand_lower)
        if " " in req.brand_name:
            no_space = req.brand_name.lower().replace(" ", "")
            if no_space not in aliases:
                aliases.append(no_space)

        # التحقق من عدم التكرار
        existing_names = {
            d.get("brand_name", "").lower() for d in drugs
        }
        if brand_lower in existing_names:
            raise HTTPException(
                status_code=409,
                detail=f"الدواء '{req.brand_name}' موجود بالفعل في القاموس.",
            )

        entry = {
            "aliases": aliases,
            "brand_name": req.brand_name,
            "generic_name": req.generic_name,
            "dosage_form": req.dosage_form,
            "active_ingredients": req.active_ingredients or [req.generic_name.upper()],
        }
        if req.atc_codes:
            entry["atc_codes"] = req.atc_codes

        drugs.append(entry)
        _save_local_dict(data)

    # محاولة إعادة تحميل القاموس في العامل
    reload_result = _reload_worker()

    return {
        "status": "ok",
        "message": f"تمت إضافة '{req.brand_name}' ({req.generic_name}) إلى القاموس.",
        "reload": reload_result,
        "total_local_drugs": len(drugs),
    }


@router.get("/dictionary/stats")
def dictionary_stats():
    """إحصائيات القاموس المحلي."""
    data = _load_local_dict()
    drugs = data.get("drugs", [])
    total_aliases = sum(len(d.get("aliases", [])) for d in drugs)

    return {
        "total_drugs": len(drugs),
        "total_aliases": total_aliases,
        "file": str(LOCAL_DICT),
    }


@router.get("/unmatched/recent")
def recent_unmatched(limit: int = 50):
    """آخر الأدوية غير المطابقة المسجلة."""
    if not UNMATCHED_LOG.exists():
        return {"entries": [], "total": 0}

    try:
        log_data = json.loads(UNMATCHED_LOG.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"entries": [], "total": 0}

    return {
        "entries": log_data[-limit:],
        "total": len(log_data),
    }
