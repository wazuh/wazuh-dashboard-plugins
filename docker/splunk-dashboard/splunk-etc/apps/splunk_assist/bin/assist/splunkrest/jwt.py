import logging
from datetime import datetime, timezone, timedelta
from typing import Dict
import jwt

_JWT_ALGO_HMAC_SHA256 = 'HS256'
_JWT_IAT = 'iat'
_JWT_ISS = 'iss'
_JWT_AUD = 'aud'
_JWT_EXP = 'exp'
_JWT_NBF = 'nbf'

_ISS_VALUE = 'splunkd'
_AUD_VALUE = 'proxy'

CLOUD_CLAIM_TENANT = 'tenant'
PKG_CLAIM_PACKAGE = 'pkg'

def _build_standard_claims():
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(minutes=1)
    return {
        _JWT_IAT: now,
        _JWT_NBF: now,
        _JWT_EXP: exp,
        _JWT_ISS: _ISS_VALUE,
        _JWT_AUD: _AUD_VALUE
    }

def encode_jwt(log: logging.Logger, shared_secret: bytes, claims: Dict):
    base_claims = _build_standard_claims()

    merged_claims = {}
    merged_claims.update(claims)
    merged_claims.update(base_claims)

    encoded_jwt = jwt.encode(merged_claims, shared_secret, algorithm=_JWT_ALGO_HMAC_SHA256)

    return encoded_jwt
