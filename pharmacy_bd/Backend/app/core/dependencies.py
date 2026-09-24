from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.users import User
from app.core.jwt import SECRET_KEY, ALGORITHM


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    return user


# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt
# from sqlalchemy.orm import Session

# from app.database.database import get_db
# from app.models.users import User
# from app.core.jwt import SECRET_KEY, ALGORITHM


# # oauth2_scheme = OAuth2PasswordBearer(
# #     tokenUrl="/api/auth/login",
# #     auto_error=True
# # )


# def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db)
# ):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={
#             "WWW-Authenticate": "Bearer"
#         }
#     )

#     try:
#         payload = jwt.decode(
#             token,
#             SECRET_KEY,
#             algorithms=[ALGORITHM]
#         )

#         user_id = payload.get("sub")

#         if user_id is None:
#             raise credentials_exception

#         user_id = int(user_id)

#     except (JWTError, ValueError):
#         raise credentials_exception

#     user = (
#         db.query(User)
#         .filter(User.id == user_id)
#         .first()
#     )

#     if user is None:
#         raise credentials_exception

#     if not user.is_active:
#         raise HTTPException(
#             status_code=403,
#             detail="User account is inactive"
#         )

#     return user