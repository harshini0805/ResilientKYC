# ResilientKYC - Interactive Frontend Demo

This is the interactive frontend demo for **ResilientKYC**, a multi-layer AI-based identity verification framework designed to protect remote digital onboarding systems against synthetic identities, spoofing, deepfakes, and face swaps.

This project was built to show project evaluators exactly how the verification system functions at each step of the pipeline.

## 🚀 How to Run the Demo

Since this is a lightweight, zero-dependency frontend application, you do **not** need to install any heavy frameworks or node modules. 

### Option 1: Direct Open (Easiest)
Simply double-click the [index.html](index.html) file or open it directly in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, etc.).

### Option 2: Live Server (Recommended for camera permissions)
Some browsers restrict camera access (`getUserMedia`) on raw `file://` URIs due to security sandboxing. If your browser blocks the camera:
1. Run a simple local web server from this directory.
2. If you have Python installed, open your terminal in this directory and run:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

## 🛠️ How to Demo the Verification Scenarios

A **Demo Simulation Panel** is built directly into the UI. You can toggle between different evaluation states to demonstrate how each security layer functions:

1. **Clean Pass (Approved)**
   - **Liveness Check**: Passes (Real motion & head rotation detected).
   - **Deepfake Detection**: Passes (Classified as "REAL" face with high confidence).
   - **Face Verification**: Passes (Similarity match > 90% between live video and uploaded ID).
   - **Final Decision**: **APPROVED**.

2. **Photo Spoof Attempt (Rejected)**
   - **Liveness Check**: Fails (No movement/rotation detected, flags static photo/video replay).
   - **Final Decision**: **REJECTED / FLAGGED**.

3. **Deepfake Face-Swap (Rejected)**
   - **Liveness Check**: Passes.
   - **Deepfake Detection**: Fails (Synthetic blending artifacts or anomalous texture patterns detected).
   - **Final Decision**: **REJECTED**.

4. **Different Person / ID Mismatch (Rejected)**
   - **Liveness Check**: Passes.
   - **Deepfake Detection**: Passes.
   - **Face Verification**: Fails (Live face doesn't match ID card face photo).
   - **Final Decision**: **REJECTED**.

---

## 📂 File Structure

* [index.html](index.html) - Main layout structure, webcam feeds, challenge directives, and result screen.
* [styles.css](styles.css) - Modern cyber-security dark-theme, glassmorphic layout, scanning line animations, and state transitions.
* [app.js](app.js) - App controller, camera feeds, canvas-based scanlines, text animations, and simulator flow management.
