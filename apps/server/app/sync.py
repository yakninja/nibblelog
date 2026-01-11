from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from app.models import PushRequest, PushResponse, PullResponse, Delta
from app.db import get_db
import json


async def push_deltas(request: PushRequest, user_id: str) -> PushResponse:
    """
    Push deltas from client to server.
    Validates user ownership and idempotently inserts deltas.
    """
    acked = []
    last_server_seq = 0
    
    async with get_db() as cur:
        for delta in request.deltas:
            # Validate user_id matches authenticated user
            if delta.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot push deltas for other users"
                )
            
            # Insert delta (idempotent by unique constraint on id)
            try:
                await cur.execute(
                    """
                    INSERT INTO deltas (id, user_id, device_id, entity, entity_id, op, payload, ts)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    RETURNING server_seq
                    """,
                    (
                        delta.id,
                        delta.user_id,
                        delta.device_id,
                        delta.entity,
                        delta.entity_id,
                        delta.op,
                        json.dumps(delta.payload),
                        delta.ts
                    )
                )
                result = await cur.fetchone()
                if result:
                    last_server_seq = max(last_server_seq, result["server_seq"])
                acked.append(delta.id)
            except Exception as e:
                # Log error but continue processing other deltas
                print(f"Error inserting delta {delta.id}: {e}")
                continue
        
        # Get the latest server_seq for this user
        await cur.execute(
            "SELECT COALESCE(MAX(server_seq), 0) as max_seq FROM deltas WHERE user_id = %s",
            (user_id,)
        )
        result = await cur.fetchone()
        if result:
            last_server_seq = result["max_seq"]
    
    return PushResponse(acked=acked, last_server_seq=last_server_seq)


async def pull_deltas(cursor: int, device_id: str, user_id: str) -> PullResponse:
    """
    Pull deltas from server for the authenticated user.
    Returns deltas with server_seq > cursor.
    """
    deltas = []
    new_cursor = cursor
    
    async with get_db() as cur:
        await cur.execute(
            """
            SELECT server_seq, id, user_id, device_id, entity, entity_id, op, payload, ts
            FROM deltas
            WHERE user_id = %s AND server_seq > %s
            ORDER BY server_seq ASC
            LIMIT 1000
            """,
            (user_id, cursor)
        )
        
        rows = await cur.fetchall()
        for row in rows:
            deltas.append({
                "server_seq": row["server_seq"],
                "id": str(row["id"]),
                "user_id": row["user_id"],
                "device_id": row["device_id"],
                "entity": row["entity"],
                "entity_id": str(row["entity_id"]),
                "op": row["op"],
                "payload": row["payload"],
                "ts": row["ts"]
            })
            new_cursor = max(new_cursor, row["server_seq"])
    
    return PullResponse(cursor=new_cursor, deltas=deltas)
