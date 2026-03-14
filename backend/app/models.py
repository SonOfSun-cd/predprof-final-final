import enum
from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, DateTime, Float
from database import Base
from datetime import datetime

class API(Base):
    __tablename__ = "api"

    id = Column(Integer, primary_key=True, index=True)
    distant = Column(Float)
    SH = Column(Integer)
