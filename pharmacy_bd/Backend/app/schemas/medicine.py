from decimal import Decimal

from pydantic import BaseModel


class PharmacyMedicineResult(BaseModel):
    pharmacy_id: int
    pharmacy_name: str
    city: str
    address: str
    latitude: float
    longitude: float

    price: Decimal
    quantity: int
    is_available: bool


class MedicineSearchResult(BaseModel):
    id: int
    name: str
    generic_name: str | None
    pharmacies: list[PharmacyMedicineResult]