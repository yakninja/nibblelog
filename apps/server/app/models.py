from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_id: str


class Delta(BaseModel):
    id: str
    user_id: str
    device_id: str
    entity: str  # "category" | "activity"
    entity_id: str
    op: str  # "upsert" | "delete"
    payload: dict
    ts: int  # client event time in ms


class PushRequest(BaseModel):
    device_id: str
    deltas: List[Delta]


class PushResponse(BaseModel):
    acked: List[str]
    last_server_seq: int


class PullResponse(BaseModel):
    cursor: int
    deltas: List[dict]
