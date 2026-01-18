from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

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
    offer_id: int
    match_score: float

    offer_category: str
    offer_description: str
    offer_quantity: int | None = None
    offer_city: str
    offer_zip_code: str

    safety_text: str = SAFETY_REMINDER
    donor_public_handle: str | None = None

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

# this is a chatbox codeblock

class ConversationCreate(BaseModel):
    need_id: int
    offer_id: int

class ConversationOut(BaseModel):
    id: int
    need_id: int
    offer_id: int
    status: str
    created_at: datetime

    # helpful for UI
    recipient_public_handle: str
    donor_public_handle: str
    need_description: Optional[str] = None
    offer_description: Optional[str] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    body: str
    created_at: datetime
    sender_user_id: int
    
    recipient_public_handle: Optional[str] = None
    donor_public_handle: Optional[str] = None
    need_description: Optional[str] | None = None
    offer_description: Optional[str] | None = None

    class Config:
        from_attributes = True