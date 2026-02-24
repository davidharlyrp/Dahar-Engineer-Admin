"""
Docker Control API
==================
FastAPI server that manages Docker containers via docker.sock.
Auth is validated against PocketBase JWT tokens.
"""

import os
import logging
from typing import Optional
from datetime import datetime

import docker
import httpx
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PB_URL = os.getenv("PB_URL", "https://pb.daharengineer.com")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://admin.daharengineer.com").split(",")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("control-api")

# ---------------------------------------------------------------------------
# Docker client  — talks to host daemon via mounted socket
# ---------------------------------------------------------------------------

try:
    docker_client = docker.DockerClient(base_url="unix:///var/run/docker.sock")
    docker_client.ping()
    logger.info("Connected to Docker daemon.")
except docker.errors.DockerException as e:
    logger.error(f"Failed to connect to Docker daemon: {e}")
    docker_client = None

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Docker Control API",
    description="Manage Docker containers remotely, authenticated via PocketBase.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auth dependency  — validate PocketBase JWT
# ---------------------------------------------------------------------------

async def get_current_admin(authorization: Optional[str] = Header(None)):
    """
    Validates the Bearer token by calling PocketBase's auth-refresh endpoint.
    PocketBase will return the user record if the token is still valid.
    We then check if the user has isAdmin == True.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = authorization.split(" ", 1)[1]

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PB_URL}/api/collections/users/auth-refresh",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
        except httpx.RequestError as e:
            logger.error(f"PocketBase auth request failed: {e}")
            raise HTTPException(status_code=502, detail="Could not reach PocketBase for authentication.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    data = response.json()
    user_record = data.get("record", {})

    if not user_record.get("isAdmin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required.")

    return user_record

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ActionRequest(BaseModel):
    action: str  # "start" | "stop" | "restart"

class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    status: str
    state: str
    ports: dict
    created: str

class ActionResponse(BaseModel):
    container: str
    action: str
    result: str

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_docker():
    if docker_client is None:
        raise HTTPException(
            status_code=503,
            detail="Docker daemon is not available. Check if docker.sock is mounted.",
        )

def _get_container(name: str):
    _require_docker()
    try:
        return docker_client.containers.get(name)
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container '{name}' not found.")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker API error: {e.explanation}")

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check — also usable by the Server Monitor page."""
    docker_ok = False
    if docker_client:
        try:
            docker_client.ping()
            docker_ok = True
        except Exception:
            pass

    return {
        "status": "healthy",
        "docker": "connected" if docker_ok else "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/containers", response_model=list[ContainerInfo])
async def list_containers(_user=Depends(get_current_admin)):
    """List all Docker containers and their status."""
    _require_docker()

    try:
        containers = docker_client.containers.list(all=True)
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker API error: {e.explanation}")

    result = []
    for c in containers:
        result.append(
            ContainerInfo(
                id=c.short_id,
                name=c.name,
                image=",".join(c.image.tags) if c.image.tags else c.image.short_id,
                status=c.status,
                state=c.attrs.get("State", {}).get("Status", "unknown"),
                ports=c.ports or {},
                created=c.attrs.get("Created", ""),
            )
        )

    return result


@app.post("/containers/{name}/action", response_model=ActionResponse)
async def container_action(
    name: str,
    body: ActionRequest,
    _user=Depends(get_current_admin),
):
    """Start, stop, or restart a container by name."""
    container = _get_container(name)
    action = body.action.lower()

    if action not in ("start", "stop", "restart"):
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Use start, stop, or restart.")

    try:
        if action == "start":
            container.start()
        elif action == "stop":
            container.stop(timeout=10)
        elif action == "restart":
            container.restart(timeout=10)
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error during '{action}': {e.explanation}")

    # Refresh status after action
    container.reload()
    logger.info(f"Container '{name}' action '{action}' executed. New status: {container.status}")

    return ActionResponse(
        container=name,
        action=action,
        result=f"Container is now {container.status}",
    )


@app.get("/containers/{name}/logs")
async def container_logs(
    name: str,
    tail: int = Query(100, ge=1, le=5000),
    _user=Depends(get_current_admin),
):
    """
    Stream the last N lines of a container's logs via Server-Sent Events.
    Uses chunked transfer so the Admin Panel can consume them progressively.
    """
    container = _get_container(name)

    def _generate():
        try:
            for line in container.logs(stream=True, follow=True, tail=tail):
                decoded = line.decode("utf-8", errors="replace").rstrip("\n")
                yield f"data: {decoded}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {e}\n\n"

    return StreamingResponse(
        _generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Entrypoint (for local dev — in production use docker-compose command)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
