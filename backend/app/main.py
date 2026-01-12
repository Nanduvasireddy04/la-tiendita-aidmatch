from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .db import Base, engine, get_db
from . import models, schemas
from .matching import find_best_offers
from .verify_supabase import verify_token

import re
import requests
from fastapi import HTTPException
from . import schemas


Base.metadata.create_all(bind=engine)

app = FastAPI(title="La Tiendita AidMatch 24/7")

@app.get("/geo/zip/{zip_code}", response_model=schemas.ZipLookupResponse)
def lookup_zip(zip_code: str):
    zip_code = zip_code.strip()
    if not re.fullmatch(r"\d{5}", zip_code):
        raise HTTPException(status_code=400, detail="ZIP must be 5 digits")

    # Free public ZIP → place lookup (US)
    r = requests.get(f"https://api.zippopotam.us/us/{zip_code}", timeout=8)

    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="ZIP not found")
    if not r.ok:
        raise HTTPException(status_code=502, detail="ZIP lookup service error")

    data = r.json()

    places = []
    for p in data.get("places", []):
        city = p.get("place name", "")
        state = p.get("state abbreviation", p.get("state", ""))

        lat = p.get("latitude")
        lng = p.get("longitude")
        try:
            lat = float(lat) if lat is not None else None
        except:
            lat = None
        try:
            lng = float(lng) if lng is not None else None
        except:
            lng = None

        places.append(schemas.ZipPlace(city=city, state=state, lat=lat, lng=lng))

    if not places:
        raise HTTPException(status_code=404, detail="No places found for ZIP")

    return schemas.ZipLookupResponse(zip_code=zip_code, places=places)


# CORS (fixes OPTIONS preflight)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _make_public_handle(uid: str) -> str:
    # stable-ish anonymous-looking handle
    return f"user_{uid[:6]}"

def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1].strip()

    try:
        claims = verify_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    supabase_uid = claims.get("sub")
    email = claims.get("email")

    if not supabase_uid:
        raise HTTPException(status_code=401, detail="Token missing sub")

    user = db.query(models.User).filter(models.User.supabase_uid == supabase_uid).first()
    if user:
        return user

    # Create local user profile if not exists
    user = models.User(
        supabase_uid=supabase_uid,
        email=email,
        public_handle=_make_public_handle(supabase_uid),
        role="individual",
        preferred_safe_locations="library",
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        # If public_handle clashes (rare), just retry with a longer uid slice
        user.public_handle = f"user_{supabase_uid[:10]}"
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

# --- Auth check endpoint (super useful for debugging) ---
@app.get("/me", response_model=schemas.MeOut)
def me(user: models.User = Depends(get_current_user)):
    return schemas.MeOut(
        public_handle=user.public_handle,
        email=user.email,
        role=user.role,
        city=user.city,
        zip_code=user.zip_code,
    )

# --- Needs ---
@app.post("/needs", response_model=schemas.NeedOut)
def create_need(
    payload: schemas.NeedCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    need = models.Need(
        user_id=user.id,
        category=payload.category,
        description=payload.description,
        urgency=payload.urgency,
        city=payload.city,
        zip_code=payload.zip_code,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    return need

@app.get("/needs", response_model=list[schemas.NeedOut])
def list_needs(
    city: str | None = None,
    zip_code: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Need)
    if city:
        q = q.filter(models.Need.city == city)
    if zip_code:
        q = q.filter(models.Need.zip_code == zip_code)
    if category:
        q = q.filter(models.Need.category == category)
    return q.order_by(models.Need.id.desc()).all()

# --- Offers ---
@app.post("/offers", response_model=schemas.OfferOut)
def create_offer(
    payload: schemas.OfferCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    offer = models.Offer(
        user_id=user.id,
        category=payload.category,
        description=payload.description,
        quantity=payload.quantity,
        city=payload.city,
        zip_code=payload.zip_code,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer

@app.get("/offers", response_model=list[schemas.OfferOut])
def list_offers(
    city: str | None = None,
    zip_code: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Offer)
    if city:
        q = q.filter(models.Offer.city == city)
    if zip_code:
        q = q.filter(models.Offer.zip_code == zip_code)
    if category:
        q = q.filter(models.Offer.category == category)
    return q.order_by(models.Offer.id.desc()).all()

# --- Matching ---
def _run_match(need_id: int, db: Session) -> list[schemas.MatchResult]:
    need = db.query(models.Need).filter(models.Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")

    ranked = find_best_offers(db, need)


    results: list[schemas.MatchResult] = []
    for offer, score in ranked:
        m = models.Match(
            need_id=need.id,
            offer_id=offer.id,
            match_score=score,
            status="suggested",
        )
        db.add(m)
        db.commit()
        db.refresh(m)

        results.append(

    schemas.MatchResult(
        match_score=float(score),
        offer_category=offer.category,
        offer_description=offer.description,
        offer_quantity=offer.quantity,
        offer_city=offer.city,
        offer_zip_code=offer.zip_code,
            )
        )

    return results

# support GET (your frontend earlier used GET /match?need_id=...)
@app.get("/match", response_model=list[schemas.MatchResult])
def match_get(need_id: int, db: Session = Depends(get_db)):
    return _run_match(need_id, db)

# also support POST if you want
@app.post("/match", response_model=list[schemas.MatchResult])
def match_post(need_id: int, db: Session = Depends(get_db)):
    return _run_match(need_id, db)
