from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database.models.user import User
from database.models.setting import Setting
from schemas.auth import UserRegister, UserLogin, Token
from auth.hashing import hash_password, verify_password
from auth.jwt_handler import create_access_token

def register_user(db: Session, user_data: UserRegister) -> User:
    """Registers a new auditor user with bcrypt password hashing."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email is already registered."
        )

    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pwd,
        company=user_data.company,
        role="auditor"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default settings for user
    db_setting = Setting(user_id=new_user.id)
    db.add(db_setting)
    db.commit()

    return new_user

def authenticate_user(db: Session, login_data: UserLogin) -> User:
    """Authenticates email and password credentials."""
    user = db.query(User).filter(User.email == login_data.email, User.is_deleted == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    return user

def generate_auth_token(user: User) -> Token:
    """Generates a Bearer JWT access token for an authenticated user."""
    payload = {
        "sub": user.email,
        "user_id": user.id,
        "role": user.role
    }
    access_token = create_access_token(data=payload)
    return Token(access_token=access_token, token_type="bearer")
