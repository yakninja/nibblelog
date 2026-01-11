from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import init_db, close_db
from app.auth import get_current_user, login
from app.sync import push_deltas, pull_deltas
from app.models import LoginRequest, LoginResponse, PushRequest, PushResponse, PullResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Nibblelog API",
    description="Local-first activity logger API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
async def login_endpoint(login_data: LoginRequest):
    """User login endpoint"""
    return login(login_data)


@app.post("/sync/push", response_model=PushResponse)
async def push_endpoint(
    request: PushRequest,
    current_user: dict = Depends(get_current_user)
):
    """Push deltas from client to server"""
    return await push_deltas(request, current_user["user_id"])


@app.get("/sync/pull", response_model=PullResponse)
async def pull_endpoint(
    cursor: int = Query(0, description="Last server sequence number"),
    device_id: str = Query(..., description="Device ID"),
    current_user: dict = Depends(get_current_user)
):
    """Pull deltas from server for client"""
    return await pull_deltas(cursor, device_id, current_user["user_id"])
