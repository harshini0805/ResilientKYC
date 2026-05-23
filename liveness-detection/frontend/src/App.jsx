import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck, Activity, Menu, X, BookOpen, Code } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import LiveDemoPage from './pages/LiveDemoPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ApiDocsPage from './pages/ApiDocsPage';

function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Live Demo', path: '/demo', icon: <Activity className="w-4 h-4 mr-2" /> },
    { name: 'How It Works', path: '/how-it-works', icon: <BookOpen className="w-4 h-4 mr-2" /> },
    { name: 'API Docs', path: '/docs', icon: <Code className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900">SecureFace AI</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <Link
              to="/demo"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Try Demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/demo" element={<LiveDemoPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/docs" element={<ApiDocsPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} SecureFace AI. Built for high-speed eKYC verification.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
