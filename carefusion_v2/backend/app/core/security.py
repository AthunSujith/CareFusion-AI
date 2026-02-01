from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt  # Using python-jose for consistency with requirements if needed, but we switched to PyJWT in requirements?
# Wait, requirements.txt has PyJWT. Admin.py uses jwt (PyJWT).
# So I should use PyJWT here too.
import jwt
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Pre-hash to handle passwords > 72 chars
    # We use explicit encoding to ensure consistent bytes
    password_bytes = plain_password.encode('utf-8')
    # Use SHA-256 to create a 32-byte digest, then hex encoding (64 chars)
    # This is safe for bcrypt (72 char limit)
    safe_password = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.verify(safe_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Pre-hash to handle passwords > 72 chars
    password_bytes = password.encode('utf-8')
    safe_password = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.hash(safe_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
