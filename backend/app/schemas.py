from pydantic import BaseModel, Field
from typing import Optional, List

SAFETY_REMINDER = (
    "When you coordinate this exchange, please use a local library or other public safe space. "
    "Do not share personal home addresses."
)

# --- Auth / User ---
class MeOut(BaseModel):
    public_handle: str
    email: Optional[str] = None
    role: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

# --- Needs ---
class NeedCreate(BaseModel):
    category: str
    description: str
    urgency: str = Field(pattern="^(low|medium|high)$")
    city: str
    zip_code: str

class NeedOut(NeedCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Offers ---
class OfferCreate(BaseModel):
    category: str
    description: str
    quantity: Optional[int] = None
    city: str
    zip_code: str

class OfferOut(OfferCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Matching ---
from pydantic import BaseModel

class MatchResult(BaseModel):
    match_score: float

    offer_category: str
    offer_description: str
    offer_quantity: int | None = None
    offer_city: str
    offer_zip_code: str

    safety_text: str = SAFETY_REMINDER

class MatchResponse(BaseModel):
    results: List[MatchResult]

class ZipPlace(BaseModel):
    city: str
    state: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class ZipLookupResponse(BaseModel):
    zip_code: str
    places: List[ZipPlace]