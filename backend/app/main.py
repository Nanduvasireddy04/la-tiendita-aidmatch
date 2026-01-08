import random
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine, get_db
from . import models, schemas
from .matching import find_best_offers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="La Tiendita AidMatch 24/7")

def generate_handle(db: Session) -> str:
    # keep trying until unique
    for _ in range(50):
        h = f"user_{random.randint(1000, 9999)}"
        exists = db.query(models.User).filter(models.User.anonymous_handle == h).first()
        if not exists:
            return h
    raise HTTPException(status_code=500, detail="Could not generate unique handle")

@app.post("/signup", response_model=schemas.SignupResponse)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    handle = generate_handle(db)
    user = models.User(
        anonymous_handle=handle,
        city=payload.city,
        zip_code=payload.zip_code,
        role=payload.role,
        preferred_safe_locations=payload.preferred_safe_locations
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.SignupResponse(anonymous_handle=user.anonymous_handle)

# For Week 2, keep "login" simple: user provides handle and we confirm it exists.
@app.post("/login")
def login(anonymous_handle: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.anonymous_handle == anonymous_handle).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "login ok", "anonymous_handle": user.anonymous_handle}

@app.post("/needs")
def create_need(anonymous_handle: str, payload: schemas.NeedCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.anonymous_handle == anonymous_handle).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    return {"need_id": need.id}

@app.post("/offers")
def create_offer(anonymous_handle: str, payload: schemas.OfferCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.anonymous_handle == anonymous_handle).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    return {"offer_id": offer.id}

@app.get("/needs")
def list_needs(city: str | None = None, zip_code: str | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Need)
    if city: q = q.filter(models.Need.city == city)
    if zip_code: q = q.filter(models.Need.zip_code == zip_code)
    if category: q = q.filter(models.Need.category.ilike(category))
    return q.order_by(models.Need.created_at.desc()).all()

@app.get("/offers")
def list_offers(city: str | None = None, zip_code: str | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Offer)
    if city: q = q.filter(models.Offer.city == city)
    if zip_code: q = q.filter(models.Offer.zip_code == zip_code)
    if category: q = q.filter(models.Offer.category.ilike(category))
    return q.order_by(models.Offer.created_at.desc()).all()

@app.post("/match", response_model=list[schemas.MatchResult])
def match_need(need_id: int, db: Session = Depends(get_db)):
    need = db.query(models.Need).filter(models.Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")

    scored = find_best_offers(db, need, limit=5)
    results = []

    for offer, score in scored:
        m = models.Match(
            need_id=need.id,
            offer_id=offer.id,
            match_score=score,
            status="suggested"
        )
        db.add(m)
        db.commit()
        db.refresh(m)

        results.append(schemas.MatchResult(
            need_id=need.id,
            offer_id=offer.id,
            match_score=float(score)
        ))

    return results
