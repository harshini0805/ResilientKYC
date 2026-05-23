import React from 'react';
import { Activity, Camera, Cpu, Layers } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      title: "1. Frame Capture (~2ms)",
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      description: "The client webcam captures frames and encodes them to base64 format, transmitting them via a persistent WebSocket connection to the FastAPI backend every ~47ms."
    },
    {
      title: "2. Face Detection via MediaPipe (~5ms)",
      icon: <Activity className="w-6 h-6 text-green-500" />,
      description: "MediaPipe's blazing-fast face detection locates the bounding box and landmarks of the face. If no face is present, the pipeline drops the frame early — saving compute time."
    },
    {
      title: "3. Affine Alignment & Cropping (~1ms)",
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      description: "The bounding box is expanded by a scale factor of 2.7 (as per the original Minivision implementation). The image is cropped, resized to 80×80 pixels, and converted to a float32 tensor of shape (1, 3, 80, 80)."
    },
    {
      title: "4. Spoof Detection via MiniFASNet ONNX (~15ms)",
      icon: <Cpu className="w-6 h-6 text-red-500" />,
      description: "ONNX Runtime executes the MiniFASNetV2 model entirely on CPU. It extracts micro-texture features that reveal the subtle differences between a real live face and a printed photo or replayed screen. It outputs logits over 3 classes; we take the softmax probability of class 1 (real)."
    },
    {
      title: "5. Rolling Average Smoothing (~1ms)",
      icon: <Activity className="w-6 h-6 text-yellow-500" />,
      description: "To prevent flickering and ensure reliability, the confidence scores from the last 60 frames (~2 seconds) are averaged. The smoothed score determines the final LIVE or SPOOF verdict returned to the client."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">How It Works</h1>
        <p className="text-xl text-gray-600">The 47ms Liveness Detection Pipeline</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
        <h3 className="text-2xl font-bold mb-4">Why CPU Inference?</h3>
        <p className="text-slate-300 leading-relaxed">
          By leveraging <span className="font-semibold text-blue-400">MediaPipe</span> and{' '}
          <span className="font-semibold text-blue-400">ONNX Runtime</span>, we removed the heavy
          dependencies of PyTorch and CUDA. This allows the backend to deploy flawlessly on standard
          cloud instances or on-premise hardware without GPUs, while still achieving real-time ~47ms per frame throughput.
        </p>
      </div>
    </div>
  );
}
