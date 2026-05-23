import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import onnxruntime as ort
from collections import deque
import os
import urllib.request

# MediaPipe FaceDetector model path
MODEL_PATH = "blaze_face_short_range.tflite"

def _download_mediapipe_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading MediaPipe face detection model...")
        url = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
        urllib.request.urlretrieve(url, MODEL_PATH)
        print("Downloaded.")

class LivenessPipeline:
    def __init__(self, onnx_model_path="MiniFASNetV2.onnx", smooth_frames=60):
        _download_mediapipe_model()

        # Initialize MediaPipe Face Detector (Tasks API)
        base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp_vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.5
        )
        self.face_detector = mp_vision.FaceDetector.create_from_options(options)

        # Initialize ONNX Runtime session
        self.ort_session = ort.InferenceSession(onnx_model_path)
        self.input_name = self.ort_session.get_inputs()[0].name

        # Smoothing mechanism
        self.history = deque(maxlen=smooth_frames)

    def preprocess_face(self, image_bgr, bbox):
        h, w = image_bgr.shape[:2]
        x_min, y_min, box_w, box_h = bbox

        center_x = x_min + box_w / 2.0
        center_y = y_min + box_h / 2.0
        scale = 2.7
        size = int(max(box_w, box_h) * scale)

        x0 = max(0, int(center_x - size / 2.0))
        y0 = max(0, int(center_y - size / 2.0))
        x1 = min(w, x0 + size)
        y1 = min(h, y0 + size)

        face_crop = image_bgr[y0:y1, x0:x1]
        if face_crop.size == 0:
            return None

        face_crop = cv2.resize(face_crop, (80, 80))
        img = np.float32(face_crop)
        img = np.transpose(img, (2, 0, 1))  # HWC -> CHW
        img = np.expand_dims(img, axis=0)   # Add batch dim
        return img

    def process_frame(self, frame_bgr):
        # 1. Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # 2. Face Detection
        detection_result = self.face_detector.detect(mp_image)
        if not detection_result.detections:
            return {"status": "NO_FACE", "confidence": 0.0}

        # Pick highest-confidence detection
        detection = max(detection_result.detections, key=lambda d: d.categories[0].score)
        bbox_norm = detection.bounding_box
        h, w = frame_bgr.shape[:2]

        bbox = (
            int(bbox_norm.origin_x),
            int(bbox_norm.origin_y),
            int(bbox_norm.width),
            int(bbox_norm.height),
        )

        # 3. Affine crop
        face_tensor = self.preprocess_face(frame_bgr, bbox)
        if face_tensor is None:
            return {"status": "ERROR", "confidence": 0.0}

        # 4. ONNX inference
        ort_inputs = {self.input_name: face_tensor}
        ort_outs = self.ort_session.run(None, ort_inputs)
        logits = ort_outs[0][0]

        # Softmax
        exp_preds = np.exp(logits - np.max(logits))
        probs = exp_preds / np.sum(exp_preds)
        real_prob = float(probs[1])  # class 1 = real face

        # 5. Rolling average
        self.history.append(real_prob)
        smooth_prob = sum(self.history) / len(self.history)

        result = "LIVE" if smooth_prob > 0.5 else "SPOOF"
        return {
            "status": "SUCCESS",
            "result": result,
            "confidence": round(smooth_prob, 4),
            "cnn_score": round(real_prob, 4),
            "bbox": list(bbox),
        }
