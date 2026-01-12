import os
import time
import requests
from jose import jwt

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_AUD = os.getenv("SUPABASE_JWT_AUD", "authenticated")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL not set (add it to backend .env)")

JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_cache = {"keys": None, "ts": 0}

def _jwks():
    if _cache["keys"] and (time.time() - _cache["ts"] < 3600):
        return _cache["keys"]
    r = requests.get(JWKS_URL, timeout=10)
    r.raise_for_status()
    _cache["keys"] = r.json()["keys"]
    _cache["ts"] = time.time()
    return _cache["keys"]

def verify_token(token: str) -> dict:
    keys = _jwks()
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    key = next((k for k in keys if k.get("kid") == kid), None)
    if not key:
        _cache["keys"] = None
        keys = _jwks()
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise Exception("Unknown signing key (kid)")

    return jwt.decode(
        token,
        key,
        algorithms=[header.get("alg", "RS256")],
        audience=SUPABASE_JWT_AUD,
        options={"verify_iss": False},
    )
