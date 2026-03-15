from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List


class User(BaseModel):
    id: int
    login: str
    name: str
    surname: str
    role: str


class UserCreate(BaseModel):
    login: str
    name: str
    surname: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: str | None = None
