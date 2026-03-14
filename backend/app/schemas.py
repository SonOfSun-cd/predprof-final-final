from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List

class API(BaseModel):
    id: int
    distant: float
    SH: int