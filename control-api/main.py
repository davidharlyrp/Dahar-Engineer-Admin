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
    action: str  # "start" | "stop" | "restart" | "rebuild"

class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    status: str
    state: str
    ports: dict
    created: str

class ImageInfo(BaseModel):
    id: str
    tags: list[str]
    size: int
    created: str

class PullRequest(BaseModel):
    image: str
    tag: Optional[str] = "latest"

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
    """Start, stop, restart, or rebuild a container by name."""
    container = _get_container(name)
    action = body.action.lower()

    if action not in ("start", "stop", "restart", "rebuild"):
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Use start, stop, restart, or rebuild.")

    # Prevent actions that could stop this control API if running inside docker
    if name == "control-api" and action in ("stop", "restart", "rebuild"):
        logger.warning(f"BLOCKED action '{action}' on protected container '{name}'")
        raise HTTPException(
            status_code=403, 
            detail=f"Action '{action}' is disabled for the protected container '{name}' to prevent server management downtime."
        )

    try:
        if action == "start":
            container.start()
        elif action == "stop":
            container.stop(timeout=10)
        elif action == "restart":
            container.restart(timeout=10)
        elif action == "rebuild":
            return await _rebuild_container(name, container)
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


async def _rebuild_container(name: str, container):
    """
    Rebuild a container:
    1. Read the current container's configuration
    2. Pull the latest version of its image
    3. Stop & remove the old container
    4. Create & start a new container with the same config
    """
    _require_docker()

    try:
        # ---- Capture current config ----
        attrs = container.attrs
        config = attrs.get("Config", {})
        host_config = attrs.get("HostConfig", {})
        networking = attrs.get("NetworkSettings", {})
        image_name = config.get("Image", "")

        if not image_name:
            # Fallback: use image tags
            image_name = container.image.tags[0] if container.image.tags else container.image.id

        logger.info(f"Rebuilding '{name}' from image '{image_name}'...")

        # ---- Pull latest image ----
        logger.info(f"Pulling latest image: {image_name}")
        try:
            docker_client.images.pull(image_name)
        except docker.errors.APIError as e:
            logger.warning(f"Image pull failed (might be a local build): {e}")

        # ---- Stop & remove old container ----
        container.stop(timeout=10)
        container.remove()
        logger.info(f"Old container '{name}' stopped and removed.")

        # ---- Prepare networking ----
        networks = networking.get("Networks", {})
        networking_config = None
        if networks:
            endpoint_configs = {}
            for net_name, net_conf in networks.items():
                endpoint_configs[net_name] = docker.types.EndpointConfig(
                    version="1.44",
                    ipv4_address=net_conf.get("IPAddress") or None,
                    aliases=net_conf.get("Aliases"),
                )
            networking_config = docker.types.NetworkingConfig(endpoint_configs)

        # ---- Create & start new container ----
        new_container = docker_client.containers.create(
            image=image_name,
            name=name,
            detach=True,
            environment=config.get("Env"),
            labels=config.get("Labels", {}),
            ports=host_config.get("PortBindings"),
            volumes=host_config.get("Binds"),
            restart_policy=host_config.get("RestartPolicy"),
            networking_config=networking_config,
            command=config.get("Cmd"),
            entrypoint=config.get("Entrypoint"),
        )
        new_container.start()
        new_container.reload()

        logger.info(f"New container '{name}' created and started. Status: {new_container.status}")

        return ActionResponse(
            container=name,
            action="rebuild",
            result=f"Container rebuilt and is now {new_container.status}",
        )

    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error during rebuild: {e.explanation}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")


@app.get("/images", response_model=list[ImageInfo])
async def list_images(_user=Depends(get_current_admin)):
    """List all Docker images on the host."""
    _require_docker()
    try:
        images = docker_client.images.list()
        result = []
        for img in images:
            result.append(
                ImageInfo(
                    id=img.short_id,
                    tags=img.tags,
                    size=img.attrs.get("Size", 0),
                    created=img.attrs.get("Created", ""),
                )
            )
        return result
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker API error: {e.explanation}")


@app.post("/images/pull")
async def pull_image(body: PullRequest, _user=Depends(get_current_admin)):
    """Pull a Docker image from a registry."""
    _require_docker()
    full_image = f"{body.image}:{body.tag}"
    try:
        logger.info(f"Pulling image: {full_image}")
        docker_client.images.pull(body.image, tag=body.tag)
        return {"status": "success", "image": full_image}
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error pulling '{full_image}': {e.explanation}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pull '{full_image}': {str(e)}")


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
