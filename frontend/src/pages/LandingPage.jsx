import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Lock, Smartphone } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Ultra-Fast 47ms Pipeline",
      description: "Optimized MediaPipe and ONNX Runtime CPU inference allows real-time analysis."
    },
    {
      icon: <Shield className="h-6 w-6 text-green-500" />,
      title: "Advanced CNN Spoof Detection",
      description: "Powered by MiniFASNetV2, reliably distinguishing live humans from spoof attempts."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-blue-500" />,
      title: "Defeats Multiple Attack Types",
      description: "Detects printed photos, screen replays, frozen frames, and mobile attacks."
    },
    {
      icon: <Lock className="h-6 w-6 text-purple-500" />,
      title: "eKYC Ready",
      description: "Seamless integration for fintech and secure onboarding workflows."
    }
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 lg:py-32 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Liveness Detection System v2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 max-w-4xl">
          Don't Let <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Spoofs</span> Bypass Your Security
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
          AI-powered biometric verification that detects whether the face on camera is a real live person or a presentation attack. Secure your eKYC flows in milliseconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to="/demo" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
            Try Live Demo
            <Zap className="ml-2 h-5 w-5" />
          </Link>
          <Link to="/docs" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl shadow-sm transition-all">
            View API Docs
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-gray-100">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Teaser */}
      <section className="w-full py-16 bg-gradient-to-b from-transparent to-slate-100 rounded-3xl p-8 md:p-16 mt-8 border border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works Under the Hood</h2>
          <p className="text-gray-600">A streamlined 4-step pipeline executing in under 50ms.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {["1. MediaPipe", "2. Alignment", "3. MiniFASNet ONNX", "4. Smoothing"].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`px-6 py-4 rounded-xl shadow border font-medium ${i === 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200'}`}>
                {label}
              </div>
              {i < 3 && <div className="hidden md:block w-8 h-0.5 bg-gray-300"></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/how-it-works" className="text-blue-600 font-semibold hover:underline">
            Read the full technical breakdown &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
