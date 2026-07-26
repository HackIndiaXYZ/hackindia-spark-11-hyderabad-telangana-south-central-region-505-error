import bcrypt

def hash_password(password: str) -> str:
    """Hashes a raw password string using direct bcrypt hashing."""
    if not password:
        raise ValueError("Password cannot be empty")
    pwd_bytes = password.encode('utf-8')[:72]  # Ensure max 72 bytes for bcrypt compatibility
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored bcrypt hash string."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False
