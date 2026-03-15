from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
from sqlalchemy.orm import Session
from typing import List
import models, schemas
import time
from api import auth_router, model_prediction_router

for i in range(30):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except Exception as e:
        print(e.args)
        time.sleep(1)

app = FastAPI()
app.include_router(auth_router.router)
app.include_router(model_prediction_router.router)

from set_models import done


@app.get("/")
def root():
    return {"status": "ok"}

@app.on_event("shutdown")
def shutdown_event():
    from database import context_manager
    with context_manager() as db:
        pass
    print("база данных убита")
