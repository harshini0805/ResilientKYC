from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import uvicorn
from liveness_pipeline import LivenessPipeline
import json

app = FastAPI(title="Liveness Detection API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = LivenessPipeline(onnx_model_path="MiniFASNetV2.onnx", smooth_frames=60)

class FrameRequest(BaseModel):
    image_base64: str

def decode_image(base64_str):
    try:
        # Strip header if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None

@app.post("/analyze-frame")
async def analyze_frame(request: FrameRequest):
    img = decode_image(request.image_base64)
    if img is None:
        return {"status": "ERROR", "message": "Invalid image data"}
    
    # Process without smoothing history if it's a single frame? 
    # For single frame API, maybe we shouldn't use the stateful pipeline, but for simplicity we will.
    result = pipeline.process_frame(img)
    return result

@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Reset history for a new session
    pipeline.history.clear()
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # The client sends base64 strings directly
            img = decode_image(data)
            
            if img is None:
                await websocket.send_json({"status": "ERROR", "message": "Invalid image"})
                continue
            
            # Run pipeline
            result = pipeline.process_frame(img)
            
            # Send result
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
