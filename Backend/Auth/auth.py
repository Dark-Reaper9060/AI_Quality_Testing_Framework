import os
import sqlite3
import uuid
from datetime import datetime, timedelta
from functools import wraps
import jwt

from ..Model import users as User
from ..Model.users import APP_DB_PATH, User

from pydantic import BaseModel
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


load_dotenv()
router = APIRouter()
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "this-is-my-algorithm-something-23-yes-43-no")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRES_MINUTES", 260))
REFRESH_TOKEN_EXPIRES_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRES_DAYS", 7))

ALLOWED_ROLES = {
    "user"
    }

# Create User table if not exists.
User.create_table()

# Create BaseModel

class UserRequest(BaseModel):
    username: str
    password: str
    role : str


# Session Table for future purpose

def create_sessions_table():
    conn = sqlite3.connect(APP_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            refresh_token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    

def save_refresh_session(username, refresh_token, expires_at: datetime):
    conn = sqlite3.connect(APP_DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (username, refresh_token, expires_at) VALUES (?, ?, ?)",
        (username, refresh_token, expires_at.isoformat())
    )
    conn.commit()
    conn.close()
    
def revoke_refresh_token(refresh_token):
    conn = sqlite3.connect(APP_DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE refresh_token = ?", (refresh_token,))
    conn.commit()
    conn.close()
    

def find_session_by_refresh_token(refresh_token):
    conn = sqlite3.connect(APP_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT username, expires_at FROM sessions WHERE refresh_token = ?", (refresh_token,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    username, expires_at = row
    try:
        expires_dt = datetime.fromisoformat(expires_at)
    except Exception:
        return None
    return {"username": username, "expires_at": expires_dt}

# JWT 

def create_access_token(username: str, role: str):
    now = datetime.utcnow()
    payload = {
        "sub": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES),
        "type": "access"
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def create_refresh_token(username: str):
    now = datetime.utcnow()
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS),
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token, now + timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise
    except jwt.InvalidTokenError:
        raise
    
# JWT Auth Decorators 

def token_required(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = decode_token(token)
        print("PAYLOAD:", payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="access token expired",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid access token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token type",
        )

    # Attach to request.state (FastAPI equivalent of Flask request object)
    request.state.username = payload.get("sub")
    request.state.role = payload.get("role")

    return payload

def roles_required(*required_roles):
    """
    Usage: @roles_required('admin') or @roles_required('admin', 'supplier')
    """
    def decorator(f):
        @wraps(f)
        async def wrapped(*args, **kwargs):
            request: Request = kwargs.get("request")
            if request is None:
                raise HTTPException(status_code=500, detail="Request object missing")

            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="authorization header missing or invalid",
                )

            token = auth.split(" ", 1)[1].strip()

            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="access token expired",
                )
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="invalid access token",
                )

            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="invalid token type",
                )

            role = payload.get("role")
            username = payload.get("sub")

            if role not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "forbidden: insufficient role",
                        "required": required_roles,
                    },
                )

            request.state.username = username
            request.state.role = role

            return await f(*args, **kwargs)

        return wrapped
    return decorator


class RegisterUser(BaseModel):
    username: str
    password: str

# Registration processes ----------------

@router.post("/register", tags=["users"])
async def register(request: RegisterUser):
   
    data = request
    data = data or {}

    username = data.username.strip()
    password = data.password
    requested_role = ""

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username and password are required",
        )

    if User.find_by_username(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username already taken",
        )

    role_to_create = "user"

    if requested_role:
        if requested_role not in ALLOWED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"invalid role '{requested_role}'. allowed roles: {sorted(ALLOWED_ROLES)}",
            )

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="only admin can set role on creation (provide Authorization header)",
            )

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="invalid token type",
                )

            caller_role = payload.get("role")
            if caller_role == "admin":
                role_to_create = requested_role
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="only admin can set role on creation",
                )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="access token expired",
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid access token",
            )

    user = User.create(username, password, role=role_to_create)
    print("User:  ",user)
    # try:
    # except Exception as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #         detail=f"could not create user: {str(e)}",
    #     )

    return {
        "message": "user registered successfully",
        "username": getattr(user, "username"),
        "role": getattr(user, "role")
    }
    
#  Admin Registration

@router.post("register/admin", tags=["admin"])
async def register_admin(request: UserRequest):

    data = request
    data = data or {}

    username = data.username.strip()
    password = data.password
    requested_role = data.role

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username and password are required",
        )

    if User.find_by_username(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username already taken",
        )

    role_to_create = "admin"

    if requested_role:
        if requested_role not in ALLOWED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"invalid role '{requested_role}'. allowed roles: {sorted(ALLOWED_ROLES)}",
            )

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="only admin can set role on creation (provide Authorization header)",
            )

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="invalid token type",
                )

            caller_role = payload.get("role")
            if caller_role == "admin":
                role_to_create = requested_role
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="only admin can set role on creation",
                )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="access token expired",
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid access token",
            )

    try:
        user = User.create_admin(username, password, role=role_to_create)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"could not create user: {str(e)}",
        )

    return {
        "message": "user registered successfully",
        "username": user.username,
        "role": user.role,
    }

class password(BaseModel):
    username : str
    password : str

@router.post("/login", tags=["users"])
async def login(request: password):
    data = request
    data = data or {}

    username = data.username.strip()
    password = data.password
    
    # print("User: ", username)
    # print("Pass: ", password)

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username and password are required",
        )

    user = User.find_by_username(username)
    if not user or not user.verify_password(password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid username or password",
        )

    create_sessions_table()

    access_token = create_access_token(user.username, user.role)
    refresh_token, refresh_expires_at = create_refresh_token(user.username)

    try:
        save_refresh_session(user.username, refresh_token, refresh_expires_at)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"unable to create session: {str(e)}",
        )

    return {
        "message": "login successful",
        "username": user.username,
        "role": user.role,
        "access_token": access_token,
        "access_token_expires_in_minutes": ACCESS_TOKEN_EXPIRES_MINUTES,
        "refresh_token": refresh_token,
        "refresh_token_expires_in_days": REFRESH_TOKEN_EXPIRES_DAYS,
    }

@router.post("/refresh", tags=["users"])
async def refresh(request: UserRequest):
    data = request
    data = data or {}
    

    refresh_token = data.refresh_token or ""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="refresh_token required",
        )

    session = find_session_by_refresh_token(refresh_token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or revoked refresh token",
        )

    if session["expires_at"] < datetime.utcnow():
        revoke_refresh_token(refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="refresh token expired",
        )

    try:
        payload = decode_token(refresh_token)
    except jwt.ExpiredSignatureError:
        revoke_refresh_token(refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="refresh token expired",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token type",
        )

    username = payload.get("sub")
    if username != session["username"]:
        revoke_refresh_token(refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token username mismatch",
        )

    user = User.find_by_username(username)
    if not user:
        revoke_refresh_token(refresh_token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user no longer exists",
        )

    access_token = create_access_token(username, user.role)

    return {
        "access_token": access_token,
        "access_token_expires_in_minutes": ACCESS_TOKEN_EXPIRES_MINUTES,
    }
    
@router.post("/logout", tags=["users"])
async def logout(request: UserRequest):
    data = request
    data = data or {}

    refresh_token = data.refresh_token or ""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="refresh_token required to logout",
        )

    revoke_refresh_token(refresh_token)

    return {
        "message": "logged out (refresh token revoked)",
    }
    
# Assign Role to User
@roles_required("admin")
@router.post("/user/assign-role", tags=["users"])
async def assign_role(request: UserRequest):
   

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="authorization header missing or invalid",
        )

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="access token expired",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid access token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token type",
        )

    caller_role = payload.get("role")
    if caller_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="forbidden: admin required",
        )

    data = request
    data = data or {}

    

    target_username = data.username.strip() or ""
    new_role = data.role.strip()

    if not target_username or not new_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username and role are required",
        )

    if new_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"invalid role '{new_role}'. allowed roles: {sorted(ALLOWED_ROLES)}",
        )

    target = User.find_by_username(target_username)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="target user not found",
        )

    conn = sqlite3.connect(APP_DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET role = ? WHERE username = ?",
        (new_role, target_username),
    )
    conn.commit()
    conn.close()

    return {
        "message": "role updated",
        "username": target_username,
        "role": new_role,
    }