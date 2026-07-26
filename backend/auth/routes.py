import os
import shutil
import uuid
from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from database.models.user import User
from schemas.auth import UserRegister, UserLogin, Token, UserResponse, UserProfileUpdate
from auth.service import register_user, authenticate_user, generate_auth_token
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new enterprise auditor account."""
    new_user = register_user(db=db, user_data=user_data)
    try:
        from services.notification_service import NotificationService
        NotificationService.notify_user_registration(db=db, user=new_user)
    except Exception:
        pass
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate email & password and return a JWT access token."""
    user = authenticate_user(db=db, login_data=login_data)
    token = generate_auth_token(user=user)
    return token

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch full profile of currently authenticated user."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the authenticated user's profile fields."""
    update_fields = profile_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        if hasattr(current_user, field) and value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless logout endpoint (instructs client to purge local JWT storage)."""
    return {
        "message": f"Successfully logged out user '{current_user.email}'. Please clear stored authentication tokens."
    }


# ── Avatar upload directory ──────────────────────────────────────────────────
AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_AVATAR_SIZE_MB = 5


@router.post("/avatar", response_model=UserResponse)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or replace the authenticated user's profile photo."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPEG, PNG, GIF, or WebP image."
        )

    # Read file and check size
    contents = file.file.read()
    if len(contents) > MAX_AVATAR_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_AVATAR_SIZE_MB} MB."
        )

    # Delete old avatar file if it exists
    if current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/")[-1]
        old_path = os.path.join(AVATAR_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    # Save new file with a unique name to bust caches
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    unique_name = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = os.path.join(AVATAR_DIR, unique_name)
    with open(save_path, "wb") as f:
        f.write(contents)

    # Store relative URL — served via /static/avatars/<filename>
    current_user.avatar_url = f"/static/avatars/{unique_name}"
    db.commit()
    db.refresh(current_user)
    return current_user
