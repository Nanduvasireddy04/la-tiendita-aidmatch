from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .db import Base, engine, get_db
from . import models, schemas
from .matching import find_best_offers
from .verify_supabase import verify_token
import re
import requests
from sqlalchemy import func
from . import schemas
import json
from sqlalchemy import and_
from datetime import datetime
from app.db import SessionLocal
from app import models
import os


# Base.metadata.create_all(bind=engine)



app = FastAPI(title="La Tiendita AidMatch 24/7")

@app.get("/health")
def health():
    return {"ok": True}


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

frontend_origin = os.getenv("FRONTEND_ORIGIN")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if frontend_origin:
    origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# _________________________________________________________________________________


# online/offline presence 
class ConnectionManager:
    def __init__(self):
        # conversation_id -> { websocket: user_dict }
        self.rooms: dict[int, dict[WebSocket, dict]] = {}

    async def connect(self, conversation_id: int, websocket: WebSocket, user: dict):
        await websocket.accept()
        self.rooms.setdefault(conversation_id, {})
        self.rooms[conversation_id][websocket] = user

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        if conversation_id in self.rooms and websocket in self.rooms[conversation_id]:
            del self.rooms[conversation_id][websocket]
            if not self.rooms[conversation_id]:
                del self.rooms[conversation_id]

    def presence_list(self, conversation_id: int):
        # unique users online
        users = self.rooms.get(conversation_id, {})
        seen = {}
        for _ws, u in users.items():
            seen[u["id"]] = u
        return list(seen.values())

    async def broadcast(self, conversation_id: int, payload: dict):
        
            users = self.rooms.get(conversation_id, {})

            # ✅ IMPORTANT: iterate over a COPY, not the live dict view
            targets = list(users.keys())

            dead = []
            for ws in targets:
                try:
                    await ws.send_text(json.dumps(payload))
                except Exception:
                    dead.append(ws)

            # ✅ remove after iteration
            for ws in dead:
                self.disconnect(conversation_id, ws)



manager = ConnectionManager()



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
        city_clean = city.strip().lower()
        q = q.filter(func.lower(func.trim(models.Need.city)) == city_clean)
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
        city_clean = city.strip().lower()
        q = q.filter(func.lower(func.trim(models.Offer.city)) == city_clean)
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
        offer_id=offer.id,
        match_score=float(score),
        offer_category=offer.category,
        offer_description=offer.description,
        offer_quantity=offer.quantity,
        offer_city=offer.city,
        offer_zip_code=offer.zip_code,
        donor_public_handle=offer.user.public_handle if hasattr(offer, "user") else None,
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



# this is chat box main methods


@app.post("/conversations", response_model=schemas.ConversationOut)
def create_or_get_conversation(
    payload: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # 1) ensure need belongs to current user (recipient)
    need = db.query(models.Need).filter(models.Need.id == payload.need_id).first()
    if not need:
        raise HTTPException(404, "Need not found")
    if need.user_id != user.id:
        raise HTTPException(403, "You can only chat for your own Need")

    # 2) load offer and identify donor
    offer = db.query(models.Offer).filter(models.Offer.id == payload.offer_id).first()
    if not offer:
        raise HTTPException(404, "Offer not found")

    recipient_id = user.id
    donor_id = offer.user_id

    # 3) reuse existing conversation for that need+offer+pair
    convo = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.need_id == payload.need_id,
            models.Conversation.offer_id == payload.offer_id,
            models.Conversation.recipient_user_id == recipient_id,
            models.Conversation.donor_user_id == donor_id,
        )
        .first()
    )

    if not convo:
        convo = models.Conversation(
            need_id=payload.need_id,
            offer_id=payload.offer_id,
            recipient_user_id=recipient_id,
            donor_user_id=donor_id,
            status="open",
        )
        db.add(convo)
        db.commit()
        db.refresh(convo)

    recipient = db.query(models.User).filter(models.User.id == recipient_id).first()
    donor = db.query(models.User).filter(models.User.id == donor_id).first()

    return schemas.ConversationOut(
        id=convo.id,
        need_id=convo.need_id,
        offer_id=convo.offer_id,
        status=convo.status,
        created_at=convo.created_at,
        recipient_public_handle=recipient.public_handle,
        donor_public_handle=donor.public_handle,
    )


@app.get("/conversations/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    convo = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    if user.id not in (convo.recipient_user_id, convo.donor_user_id):
        raise HTTPException(403, "Not allowed")

    msgs = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.id.asc())
        .all()
    )

    # map sender handle
    user_map = {
        u.id: u.public_handle
        for u in db.query(models.User).filter(models.User.id.in_([m.sender_user_id for m in msgs])).all()
    }

    return [
        schemas.MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            body=m.body,
            created_at=m.created_at,
            sender_user_id=m.sender_user_id,
            sender_public_handle=user_map.get(m.sender_user_id, "user_unknown"),
        )
        for m in msgs
    ]


@app.post("/conversations/{conversation_id}/messages", response_model=schemas.MessageOut)
def send_message(
    conversation_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    convo = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    if convo.status != "open":
        raise HTTPException(400, "Conversation is closed")

    if user.id not in (convo.recipient_user_id, convo.donor_user_id):
        raise HTTPException(403, "Not allowed")

    msg = models.Message(
        conversation_id=conversation_id,
        sender_user_id=user.id,
        body=payload.body.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return schemas.MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        body=msg.body,
        created_at=msg.created_at,
        sender_user_id=msg.sender_user_id,
        sender_public_handle=user.public_handle,
    )


@app.get("/conversations", response_model=list[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    convos = (
        db.query(models.Conversation)
        .filter(
            (models.Conversation.recipient_user_id == user.id)
            | (models.Conversation.donor_user_id == user.id)
        )
        .order_by(models.Conversation.id.desc())
        .all()
    )

    # preload handles
    user_ids = set()
    for c in convos:
        user_ids.add(c.recipient_user_id)
        user_ids.add(c.donor_user_id)

    users = db.query(models.User).filter(models.User.id.in_(list(user_ids))).all()
    handle = {u.id: u.public_handle for u in users}

    return [
        schemas.ConversationOut(
            id=c.id,
            need_id=c.need_id,
            offer_id=c.offer_id,
            status=c.status,
            created_at=c.created_at,
            recipient_public_handle=handle.get(c.recipient_user_id, "user_unknown"),
            donor_public_handle=handle.get(c.donor_user_id, "user_unknown"),
        )
        for c in convos
    ]

@app.get("/")
def root():
    return {"status": "running"}


# ## onLine/offline presence 

# @app.websocket("/ws/conversations/{conversation_id}")
# async def ws_conversation(websocket: WebSocket, conversation_id: int):
#     # ✅ Accept first so browser gets proper close frames (no 1006)
#     # await websocket.accept()

#     db = None
#     try:
#         token = websocket.query_params.get("token")
#         if not token:
#             await websocket.close(code=4401)
#             return

#         # Verify Supabase JWT
#         try:
#             claims = verify_token(token)
#         except Exception:
#             await websocket.close(code=4401)
#             return

#         supabase_uid = claims.get("sub")
#         if not supabase_uid:
#             await websocket.close(code=4401)
#             return

#         # Manual DB session (Depends doesn't work in WS)
#         db = SessionLocal()

#         user = db.query(models.User).filter(models.User.supabase_uid == supabase_uid).first()
#         if not user:
#             user = models.User(
#                 supabase_uid=supabase_uid,
#                 email=claims.get("email"),
#                 public_handle=_make_public_handle(supabase_uid),
#                 role="individual",
#                 preferred_safe_locations="library",
#             )
#             db.add(user)
#             db.commit()
#             db.refresh(user)

#         convo = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
#         if not convo:
#             await websocket.close(code=4404)
#             return

#         # Only participants can connect
#         if user.id not in (convo.recipient_user_id, convo.donor_user_id):
#             await websocket.close(code=4403)
#             return

#         # Connect and broadcast presence
#         await manager.connect(
#             conversation_id,
#             websocket,
#             {"id": user.id, "public_handle": user.public_handle},
#         )
#         await manager.broadcast(conversation_id, {
#             "type": "presence",
#             "online": manager.presence_list(conversation_id),
#         })

#         # Main receive loop
#         while True:
#             raw = await websocket.receive_text()
#             data = json.loads(raw)

#             if data.get("type") == "ping":
#                 await websocket.send_text(json.dumps({"type": "pong"}))
#                 continue

#             if data.get("type") == "message":
#                 body = (data.get("body") or "").strip()
#                 if not body:
#                     continue

#                 msg = models.Message(
#                     conversation_id=conversation_id,
#                     sender_user_id=user.id,
#                     body=body,
#                 )
#                 db.add(msg)
#                 db.commit()
#                 db.refresh(msg)

#                 await manager.broadcast(conversation_id, {
#                     "type": "message",
#                     "message": {
#                         "id": msg.id,
#                         "conversation_id": msg.conversation_id,
#                         "body": msg.body,
#                         "created_at": msg.created_at.isoformat() if msg.created_at else datetime.utcnow().isoformat(),
#                         "sender_user_id": msg.sender_user_id,
#                         "sender_public_handle": user.public_handle,
#                     }
#                 })

#     except WebSocketDisconnect:
#         # Client closed
#         pass

#     except Exception as e:
#         print("WS CRASH:", repr(e))
#         try:
#             await websocket.close(code=1011)
#         except Exception:
#             pass

#     finally:
#         # Clean up + presence update
#         try:
#             manager.disconnect(conversation_id, websocket)
#             await manager.broadcast(conversation_id, {
#                 "type": "presence",
#                 "online": manager.presence_list(conversation_id),
#             })
#         except Exception:
#             pass

#         if db is not None:
#             db.close()