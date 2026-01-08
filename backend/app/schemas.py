from pydantic import BaseModel, Field
from typing import Optional, List

SAFETY_REMINDER = (
    "When you coordinate this exchange, please use a local library or other public safe space. "
    "Do not share personal home addresses."
)

class SignupRequest(BaseModel):
    city: str
    zip_code: str
    role: str = Field(pattern="^(individual|group)$")
    preferred_safe_locations: Optional[str] = None

class SignupResponse(BaseModel):
    anonymous_handle: str

class NeedCreate(BaseModel):
    category: str
    description: str
    urgency: str = Field(pattern="^(low|medium|high)$")
    city: str
    zip_code: str

class OfferCreate(BaseModel):
    category: str
    description: str
    quantity: Optional[int] = None
    city: str
    zip_code: str

class MatchResult(BaseModel):
    need_id: int
    offer_id: int
    match_score: float
    safety_text: str = SAFETY_REMINDER
