import json
import logging
from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("fastapi_app")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket client '{client_id}' connected.")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket client '{client_id}' disconnected.")

    async def send_progress(
        self,
        client_id: str,
        step: str,
        progress: int,
        agent: str = None,
        status: str = "running",
        message: str = None,
        audit_id: int = None,
        error: str = None
    ):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            payload = {
                "step": step,
                "progress": progress,
                "agent": agent,
                "status": status,
                "message": message or f"{step} in progress...",
                "audit_id": audit_id,
                "error": error
            }
            try:
                await websocket.send_text(json.dumps(payload))
            except Exception as e:
                logger.warning(f"Failed to send WebSocket message to '{client_id}': {e}")
                self.disconnect(client_id)

ws_manager = ConnectionManager()
