# 🎭 Liveness Detection

A real-time face liveness detection system that distinguishes **live faces** from **spoofing attempts** (photos, videos, masks). Built with a FastAPI backend and a React + Vite frontend.

---

## 📁 Project Structure

```
liveness-detection/
├── backend/        # FastAPI server with ONNX inference pipeline
└── frontend/       # React + Vite UI
```

---

## 🧠 How It Works

1. **Face Detection** — MediaPipe's BlazeFace model detects and crops the face from each frame.
2. **Liveness Inference** — The cropped face is passed through **MiniFASNetV2** (exported to ONNX), a lightweight anti-spoofing CNN that outputs a real vs. spoof probability.
3. **Temporal Smoothing** — A rolling average over 60 frames stabilizes predictions and reduces noise.
4. **Result** — Returns `LIVE` or `SPOOF` with a confidence score.

---

## ⚙️ Backend

**Stack:** Python · FastAPI · ONNX Runtime · MediaPipe · OpenCV

### Models Used
| Model | Purpose |
|---|---|
| `MiniFASNetV2.onnx` | Anti-spoofing CNN (Silent-Face) |
| `blaze_face_short_range.tflite` | Face detection (MediaPipe) |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze-frame` | Analyze a single base64-encoded frame |
| `WebSocket` | `/stream` | Real-time frame streaming with live results |

### Setup & Run

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install fastapi uvicorn opencv-python mediapipe onnxruntime numpy

# Start the server
python main.py
```

Server runs at: **http://localhost:8000**

---

## 🖥️ Frontend

**Stack:** React 19 · Vite · Tailwind CSS · React Router · Lucide Icons

### Pages
- **Landing Page** — Project overview and introduction
- **Live Demo** — Real-time webcam liveness detection via WebSocket
- **How It Works** — Explanation of the detection pipeline
- **API Docs** — Interactive API reference

### Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔗 WebSocket Response Format

```json
{
  "status": "SUCCESS",
  "result": "LIVE",
  "confidence": 0.8721,
  "cnn_score": 0.9103,
  "bbox": [120, 80, 200, 220]
}
```

| Field | Description |
|---|---|
| `status` | `SUCCESS`, `NO_FACE`, or `ERROR` |
| `result` | `LIVE` or `SPOOF` |
| `confidence` | Smoothed probability (0–1) |
| `cnn_score` | Raw CNN output for current frame |
| `bbox` | Face bounding box `[x, y, width, height]` |

---

## 🚀 Quick Start (Full Stack)

```bash
# Terminal 1 — Backend
cd backend && python main.py

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173** and click **Live Demo** to start detecting!
