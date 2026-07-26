import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

class UserProfileUpdate(BaseModel):
    """Profile update request — all fields optional so partial updates work."""
    name:       Optional[str] = None
    phone:      Optional[str] = None
    department: Optional[str] = None
    job_title:  Optional[str] = None
    company:    Optional[str] = None
    country:    Optional[str] = None
    timezone:   Optional[str] = None
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       Optional[str] = "auditor"
    company:    Optional[str] = None
    phone:      Optional[str] = None
    department: Optional[str] = None
    job_title:  Optional[str] = None
    country:    Optional[str] = None
    timezone:   Optional[str] = None
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
