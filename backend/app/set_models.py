from database import engine, Base, context_manager
import models
from auth import hash_password
from requests import get
from json import *  


done=False

with context_manager() as db:
    if not db.query(models.User).filter(models.User.login == "admin").first():
        admin = models.User(name="admin", login="admin", hashed_password=hash_password("admin"), surname="admin", role=models.UserRole.admin)
        db.add(admin)
        db.commit()
        db.refresh(admin)



done=True