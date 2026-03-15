from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth
from database import get_db



router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.login == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.login}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/list_users", response_model=list[schemas.User])
def list_users(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    users = db.query(models.User).all()
    return users



@router.post("/create_user")
def create(
    form_data: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    user_check = db.query(models.User).filter(models.User.login == form_data.login).first()

    if user_check:
        return {"message": "Пользователь с таким логином уже существует", "type": "error"}
    user = models.User(name=form_data.name, login=form_data.login, surname=form_data.surname, role="user")

    user.hashed_password = auth.hash_password(form_data.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Пользователь успешно создан", "type": "success"}


@router.post("/change_role")
def change_role(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.User).filter(models.User.login == payload["login"]).update({"role": payload["role"]})
    db.commit()
    return {"message": "Роль успешно изменена", "type": "success"}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
