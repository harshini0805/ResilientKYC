import React from 'react';
import { Terminal, Globe } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">API Documentation</h1>
        <p className="text-xl text-gray-600">Integrate SecureFace AI into your applications.</p>
      </div>

      <div className="space-y-12">
        {/* WebSocket */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center">
            <Globe className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Real-time Stream</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                WS
              </span>
              <code className="text-lg text-gray-800 font-mono">ws://localhost:8000/stream</code>
            </div>

            <p className="text-gray-600">
              Establish a persistent WebSocket connection for real-time video feed processing. The server maintains a 60-frame rolling average for smooth, accurate predictions per client.
            </p>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message (Client → Server)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                <p className="text-slate-500">{"// Send raw Base64 encoded JPEG/PNG"}</p>
                <p className="mt-1">"data:image/jpeg;base64,/9j/4AAQSkZJRg..."</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Response (Server → Client)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-blue-300 overflow-x-auto">
                <pre>{`{
  "status": "SUCCESS" | "NO_FACE" | "ERROR",
  "result": "LIVE" | "SPOOF",
  "confidence": 0.985,
  "cnn_score": 0.992,
  "bbox": [x, y, width, height]
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* REST */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center">
            <Terminal className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Single Frame Analysis</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                POST
              </span>
              <code className="text-lg text-gray-800 font-mono">http://localhost:8000/analyze-frame</code>
            </div>

            <p className="text-gray-600">
              Stateless single-image liveness check. Does not use rolling average smoothing. Ideal for static image uploads or batch verification.
            </p>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body (application/json)</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-blue-300 overflow-x-auto">
                <pre>{`{
  "image_base64": "data:image/jpeg;base64,..."
}`}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Response</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-blue-300 overflow-x-auto">
                <pre>{`{
  "status": "SUCCESS",
  "result": "LIVE",
  "confidence": 0.89,
  "cnn_score": 0.89,
  "bbox": [150, 100, 200, 200]
}`}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
