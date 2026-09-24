@echo off
title OCR Worker - PaddleOCR
cd /d "%~dp0"
echo Loading PaddleOCR model (first time takes ~1-2 min)...
"ocr-venv\Scripts\python.exe" "ocr_worker.py" --port 8001
pause