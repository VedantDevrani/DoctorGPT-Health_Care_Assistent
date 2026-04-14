import React, { useEffect, useRef, useState } from 'react';
import LandingPage from './components/LandingPage';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, hasFirebaseConfig } from './firebase';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [showApp, setShowApp] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptoms: '',
    duration: ''
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: 'Hi, I am DoctorGPT. Share your symptoms and I will provide general guidance.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isAuthenticated]);

  useEffect(() => {
    if (!auth || !hasFirebaseConfig) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate API call
    try {
      // In a real app: const res = await axios.post('/api/analyze', formData);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResponse = {
        condition: "Seasonal Influenza (Flu)",
        severity: "Moderate",
        specialist: "General Physician",
        homeRemedies: [
          "Get plenty of rest and sleep",
          "Drink lots of fluids (water, juice, soup)",
          "Take over-the-counter pain relievers if needed",
          "Use a humidifier to ease congestion"
        ],
        doctors: [
          { name: "Dr. Rajesh Kumar", specialization: "Internal Medicine", rating: 4.8, location: "New Delhi, Delhi" },
          { name: "Dr. Ananya Sharma", specialization: "General Practitioner", rating: 4.9, location: "Mumbai, Maharashtra" }
        ],
        warnings: [
          "If you experience difficulty breathing, seek immediate medical attention.",
          "High fever persisting more than 3 days needs doctor consultation.",
          "Keep distance from elderly or infants to prevent spread."
        ],
        disclaimer: "This AI provide preliminary medical information for educational purposes only. It is not a clinical diagnosis or a replacement for medical advice from a qualified healthcare professional."
      };

      setResponse(mockResponse);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const email = credentials.email.trim();
    const password = credentials.password.trim();

    if (!hasFirebaseConfig || !auth) {
      setLoginError('Firebase is not configured yet. Add your Firebase keys to .env and restart the app.');
      return;
    }

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCredentials({ email: '', password: '' });
      setLoginError('');
      setShowLoginModal(false);
    } catch (error) {
      const code = error?.code || 'auth/unknown';

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setLoginError('Invalid email or password.');
        return;
      }

      if (code === 'auth/invalid-email') {
        setLoginError('Please enter a valid email address.');
        return;
      }

      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      setIsAuthenticated(false);
      return;
    }

    try {
      await signOut(auth);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const generateAiReply = (userText) => {
    const lower = userText.toLowerCase();

    if (lower.includes('fever') || lower.includes('cold')) {
      return 'This could be a mild viral infection. Keep hydrated, take proper rest, and monitor your temperature. If fever lasts more than 3 days, consult a doctor.';
    }

    if (lower.includes('headache')) {
      return 'Try hydration, rest, and reducing screen exposure. If headache is severe, frequent, or associated with vision changes, consult a clinician.';
    }

    if (lower.includes('stomach') || lower.includes('nausea')) {
      return 'Take small sips of water and light food. If you cannot keep fluids down or symptoms worsen, seek medical attention.';
    }

    return 'I can provide general guidance only and not a diagnosis. If symptoms are severe, persistent, or worsening, please consult a qualified doctor.';
  };

  const handleChatSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    window.setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: generateAiReply(trimmed)
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1200);
  };

  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleChatSend();
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-600">
        Checking authentication status...
      </div>
    );
  }

  if (!showApp) {
    return <LandingPage onStart={() => setShowApp(true)} />;
  }

  if (isAuthenticated) {
    return (
      <ChatInterface
        messages={messages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        loading={loading}
        onSend={handleChatSend}
        onKeyDown={handleChatKeyDown}
        onLogout={handleLogout}
        endRef={chatEndRef}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left Sidebar / History placeholder */}
      <div className="hidden lg:flex w-64 bg-slate-900 flex-col group transition-all duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Activity className="text-medical-500" size={20} />
            <span className="font-bold text-sm">DoctorGPT</span>
          </div>
          <button
            onClick={() => setShowApp(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            ←
          </button>
        </div>
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => {
              setFormData({ age: '', gender: '', symptoms: '', duration: '' });
              setResponse(null);
            }}
            className="w-full py-2 px-4 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Analysis
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="mt-3 w-full py-2 px-4 rounded-lg bg-medical-600 text-white text-sm hover:bg-medical-500 transition-colors"
          >
            Login For Chat UI
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-4 font-sans">Recent History</p>
          <div className="space-y-1">
            <div className={`p-2 text-slate-400 text-sm rounded-lg hover:bg-slate-800 cursor-pointer truncate transition-colors ${response ? 'bg-slate-800/50 text-white' : ''}`}>
              {response ? response.condition : 'Common Cold (8:30 AM)'}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs flex items-center justify-between">
          <span>Settings</span>
          <div className="w-6 h-6 rounded-full bg-medical-500 flex items-center justify-center text-[10px] text-white font-bold">JD</div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Back button for mobile when app is shown */}
        <button
          onClick={() => setShowApp(false)}
          className="lg:hidden absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-100"
        >
          ←
        </button>

        <button
          onClick={() => setShowLoginModal(true)}
          className="lg:hidden absolute top-4 right-4 z-20 rounded-full bg-medical-600 text-white text-xs px-3 py-2 shadow-lg"
        >
          Login
        </button>

        {/* Input Interface */}
        <div className="w-full lg:w-100 border-r">
          <InputForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* Results Panel */}
        <div className="hidden lg:block flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
          <ResultsPanel response={response} loading={loading} />
        </div>
      </main>

      {/* Mobile Results Overlay */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-50 bg-white overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-bold flex items-center gap-2">
                <Activity className="text-medical-600" size={18} />
                Analysis Results
              </h2>
              <button
                onClick={() => setResponse(null)}
                className="text-slate-500 font-bold px-4 py-2 bg-slate-100 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResultsPanel response={response} loading={loading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        show={showLoginModal}
        credentials={credentials}
        error={loginError}
        hasFirebaseConfig={hasFirebaseConfig}
        onChange={handleCredentialChange}
        onClose={() => {
          setShowLoginModal(false);
          setLoginError('');
        }}
        onSubmit={handleLogin}
      />
    </div>
  );
}

function LoginModal({ show, credentials, error, hasFirebaseConfig, onChange, onClose, onSubmit }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onSubmit={onSubmit}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-slate-800">Login To Continue</h2>
            <p className="text-sm text-slate-500 mt-1">
              Logged in users can access the chat interface.
            </p>

            {!hasFirebaseConfig && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Firebase keys are missing. Add your values in .env from .env.example.
              </p>
            )}

            <div className="mt-5 space-y-3">
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={onChange}
                placeholder="Email"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={onChange}
                placeholder="Password"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-medical-600 text-white py-2.5 hover:bg-medical-500"
              >
                Login
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatInterface({ messages, chatInput, setChatInput, loading, onSend, onKeyDown, onLogout, endRef }) {
  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-4">
        <h1 className="font-semibold text-slate-800">DoctorGPT Chat</h1>
        <button
          onClick={onLogout}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm transition-all ${
                message.role === 'user'
                  ? 'bg-slate-900 text-white rounded-br-md'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-600 inline-flex items-center gap-2">
              <span>DoctorGPT is typing</span>
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </section>

      <footer className="border-t bg-white p-3">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type your message..."
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-medical-500 resize-none"
          />
          <button
            onClick={onSend}
            disabled={loading || !chatInput.trim()}
            className="rounded-xl px-4 py-2.5 bg-medical-600 text-white text-sm disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}

const Activity = ({ className, size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default App;
