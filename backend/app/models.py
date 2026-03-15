import enum
from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, DateTime, Float
from database import Base
from datetime import datetime

class UserRole(str, enum.Enum):
    user="user"
    admin="admin"



class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String)
    hashed_password = Column(String)
    name = Column(String, unique = True)
    surname = Column(String, unique = True)
    role = Column(Enum(UserRole), default = UserRole.user)



class Datasets(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String)
    answers = Column(String)