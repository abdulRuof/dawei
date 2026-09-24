from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import (
    medicines,
    pharmacies,
    pharmacy_requests,
    auth,
    prescriptions,
    dictionary,
    inventory,
    admin,
    employees,
    activity,
    reviews,
    notifications,
    alerts,
    regions,
)


app = FastAPI(
    title="Dawei API",
    description="Backend platform for finding medicines and pharmacies",
    version="1.0.0"
)

# موقت ساعات العمل: يفتح/يغلق الصيدليات حسب المواعيد (للمدير)
from app.core.work_hours import start_scheduler
start_scheduler()


# السماح لواجهة Next.js (متصفح) باستدعاء الـ API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    medicines.router
)

app.include_router(
    pharmacies.router
)

app.include_router(
    pharmacy_requests.router
)

app.include_router(
    auth.router
)

app.include_router(
    prescriptions.router
)

app.include_router(
    dictionary.router
)

app.include_router(
    inventory.router
)

app.include_router(
    admin.router
)

app.include_router(
    employees.router
)

app.include_router(
    activity.router
)

app.include_router(
    reviews.router
)

app.include_router(
    notifications.router
)

app.include_router(
    alerts.router
)

app.include_router(
    regions.router
)


UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "uploads",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)


@app.get("/")
def root():
    return {
        "message": "Dawei API is running"
    }