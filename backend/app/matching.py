from datetime import datetime
from sqlalchemy.orm import Session
from . import models

URGENCY_SCORE = {"low": 1, "medium": 2, "high": 3}

def compute_score(need: models.Need, offer: models.Offer) -> float:
    score = 0.0
    if need.city == offer.city:
        score += 5
    if need.zip_code == offer.zip_code:
        score += 5
    if need.category.lower() == offer.category.lower():
        score += 10
    score += URGENCY_SCORE.get(need.urgency, 1)
    return score

def find_best_offers(db: Session, need: models.Need, limit: int = 20):
    # show ALL offers, rank by score (old way feel)
    offers = db.query(models.Offer).all()

    scored = [(offer, compute_score(need, offer)) for offer in offers]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


# def find_best_offers(db: Session, need: models.Need, limit: int = 5):
#     offers = (
#         db.query(models.Offer)
#         .filter(models.Offer.city == need.city)
#         .filter(models.Offer.zip_code == need.zip_code)
#         .filter(models.Offer.category.ilike(need.category))
#         .all()
#     )
#     scored = [(offer, compute_score(need, offer)) for offer in offers]
#     scored.sort(key=lambda x: x[1], reverse=True)
#     return scored[:limit]
