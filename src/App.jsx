import React, { useEffect, useRef, useState } from 'react';
import LandingPage from './components/LandingPage';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db, hasFirebaseConfig } from './firebase';
import './App.css';

const OTP_TTL_MS = 90 * 60 * 1000;
const OTP_PENDING_STORAGE_KEY = 'doctorgpt_pending_otp';
const OTP_VERIFIED_EMAILS_KEY = 'doctorgpt_verified_otp_emails';

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateSixDigitOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [pendingOtp, setPendingOtp] = useState(() => readJsonStorage(OTP_PENDING_STORAGE_KEY, null));

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

  const profileName = authUser?.displayName || authUser?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (pendingOtp) {
      writeJsonStorage(OTP_PENDING_STORAGE_KEY, pendingOtp);
      return;
    }
    localStorage.removeItem(OTP_PENDING_STORAGE_KEY);
  }, [pendingOtp]);

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
      setAuthUser(user || null);

      if (!user) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      const usesPasswordProvider = user.providerData.some((provider) => provider.providerId === 'password');
      const verifiedOtpEmails = readJsonStorage(OTP_VERIFIED_EMAILS_KEY, {});
      const otpVerified = Boolean(verifiedOtpEmails[user.email || '']);
      const canAccessChat = !usesPasswordProvider || otpVerified;

      setIsAuthenticated(canAccessChat);

      if (!canAccessChat) {
        setAuthNotice('Please verify your email with OTP to access chat.');
        setAuthMode('login');
        setShowLoginModal(true);
        signOut(auth).catch(() => {});
      }

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

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const queueOtpMail = async ({ email, otp, expiresAt }) => {
    if (!db) return;

    const expiresAtText = new Date(expiresAt).toLocaleString();

    await addDoc(collection(db, 'mail'), {
      to: [email],
      message: {
        subject: 'DoctorGPT OTP Verification - Thank You For Joining',
        text:
          `Thank you for joining and trusting DoctorGPT.\n\n` +
          `Your OTP is: ${otp}\n` +
          `This OTP is valid until: ${expiresAtText} (about 1 hour 30 minutes).\n\n` +
          `If you did not request this, please ignore this email.`,
        html:
          `<p>Thank you for joining and trusting <strong>DoctorGPT</strong>.</p>` +
          `<p>Your verification OTP is:</p>` +
          `<h2 style="letter-spacing: 4px;">${otp}</h2>` +
          `<p>This OTP is valid until <strong>${expiresAtText}</strong> (about 1 hour 30 minutes).</p>` +
          `<p>If you did not request this, you can ignore this email.</p>`,
      },
    });
  };

  const handleEmailAuth = async (event) => {
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

    if (!isValidEmail(email)) {
      setLoginError('Please enter a valid email format (example: name@example.com).');
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setAuthSubmitting(true);

    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);

        const otp = generateSixDigitOtp();
        const expiresAt = Date.now() + OTP_TTL_MS;
        const nextPendingOtp = { email, otp, expiresAt };

        setPendingOtp(nextPendingOtp);
        await queueOtpMail({ email, otp, expiresAt });
        await signOut(auth);

        setAuthMode('verify-otp');
        setOtpInput('');
        setAuthNotice('We sent a 6-digit OTP with a thank-you note to your email. Enter it below to verify.');
        setLoginError('');
        return;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const usesPasswordProvider = user.providerData.some((provider) => provider.providerId === 'password');

        const verifiedOtpEmails = readJsonStorage(OTP_VERIFIED_EMAILS_KEY, {});
        const otpVerified = Boolean(verifiedOtpEmails[email]);

        if (usesPasswordProvider && !otpVerified) {
          setLoginError('Email is not OTP-verified. Please complete verification first.');
          setAuthNotice('Please use signup verification OTP flow to verify your email.');
          await signOut(auth);
          return;
        }
      }

      setCredentials({ email: '', password: '' });
      setLoginError('');
      setAuthNotice('');

      if (authMode !== 'signup') {
        setShowLoginModal(false);
      }
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

      if (code === 'auth/email-already-in-use') {
        setLoginError('This email is already registered. Please login instead.');
        return;
      }

      if (code === 'auth/popup-closed-by-user') {
        setLoginError('Login popup was closed before completing sign in.');
        return;
      }

      setLoginError('Login failed. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (authMode !== 'verify-otp' || !pendingOtp) {
      setLoginError('No OTP verification is currently pending.');
      return;
    }

    if (Date.now() < pendingOtp.expiresAt) {
      const remainingMinutes = Math.ceil((pendingOtp.expiresAt - Date.now()) / 60000);
      setLoginError(`Current OTP is still valid. Try again in about ${remainingMinutes} minute(s).`);
      return;
    }

    const correctedEmail = credentials.email.trim();

    if (!isValidEmail(correctedEmail)) {
      setLoginError('Enter a valid corrected email before resending OTP.');
      return;
    }

    setAuthSubmitting(true);

    try {
      const otp = generateSixDigitOtp();
      const expiresAt = Date.now() + OTP_TTL_MS;
      const nextPendingOtp = { email: correctedEmail, otp, expiresAt };

      setPendingOtp(nextPendingOtp);
      await queueOtpMail({ email: correctedEmail, otp, expiresAt });
      setOtpInput('');
      setAuthNotice('A new OTP has been sent with a thank-you note. Please verify within 1 hour 30 minutes.');
      setLoginError('');
    } catch {
      setLoginError('Could not resend OTP email. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!pendingOtp) {
      setLoginError('No pending OTP found. Please sign up again.');
      return;
    }

    if (Date.now() > pendingOtp.expiresAt) {
      setLoginError('OTP expired. Update the email and request a new OTP.');
      setAuthNotice('OTP expired after 1 hour 30 minutes. You can now resend with corrected email.');
      return;
    }

    if (!/^\d{6}$/.test(otpInput)) {
      setLoginError('OTP must be exactly 6 digits.');
      return;
    }

    if (otpInput !== pendingOtp.otp) {
      setLoginError('Invalid OTP. Please check and try again.');
      return;
    }

    const email = pendingOtp.email;
    const verifiedOtpEmails = readJsonStorage(OTP_VERIFIED_EMAILS_KEY, {});
    verifiedOtpEmails[email] = true;
    writeJsonStorage(OTP_VERIFIED_EMAILS_KEY, verifiedOtpEmails);

    setPendingOtp(null);
    setOtpInput('');
    setAuthMode('login');
    setCredentials((prev) => ({ ...prev, email }));
    setAuthNotice('OTP verified successfully. You can now login.');
    setLoginError('');
  };

  const handleGoogleLogin = async () => {
    if (!hasFirebaseConfig || !auth) {
      setLoginError('Firebase is not configured yet. Add your Firebase keys to .env and restart the app.');
      return;
    }

    setAuthSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setCredentials({ email: '', password: '' });
      setLoginError('');
      setAuthNotice('');
      setShowLoginModal(false);
    } catch (error) {
      const code = error?.code || 'auth/unknown';
      if (code === 'auth/popup-closed-by-user') {
        setLoginError('Google sign-in popup was closed.');
      } else {
        setLoginError('Google sign-in failed. Please try again.');
      }
    } finally {
      setAuthSubmitting(false);
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

  const doctorsByCity = {
    delhi: [
      'Dr. Rajesh Kumar (General Physician) - New Delhi - Rating 4.8',
      'Dr. Neha Verma (Internal Medicine) - Dwarka, Delhi - Rating 4.7',
    ],
    mumbai: [
      'Dr. Ananya Sharma (General Practitioner) - Mumbai - Rating 4.9',
      'Dr. Pratik Joshi (Internal Medicine) - Andheri, Mumbai - Rating 4.7',
    ],
    bangalore: [
      'Dr. Kavya Rao (General Physician) - Indiranagar, Bangalore - Rating 4.8',
      'Dr. Harish N (Internal Medicine) - Whitefield, Bangalore - Rating 4.7',
    ],
    hyderabad: [
      'Dr. Akhil Reddy (General Physician) - Gachibowli, Hyderabad - Rating 4.8',
      'Dr. S. Madhavi (Internal Medicine) - Banjara Hills, Hyderabad - Rating 4.7',
    ],
    chennai: [
      'Dr. Priya Narayanan (General Physician) - Adyar, Chennai - Rating 4.8',
      'Dr. Karthik S (Internal Medicine) - T Nagar, Chennai - Rating 4.6',
    ],
  };

  const detectCity = (text) => {
    const lower = text.toLowerCase();
    const cities = Object.keys(doctorsByCity);
    return cities.find((city) => lower.includes(city)) || null;
  };

  const formatCarePlan = ({
    condition,
    severity,
    specialist,
    remedies,
    diet,
    warnings,
    city,
  }) => {
    const doctorList = city && doctorsByCity[city] ? doctorsByCity[city] : [
      'Dr. Rajesh Kumar (General Physician) - Rating 4.8',
      'Dr. Ananya Sharma (Internal Medicine) - Rating 4.9',
    ];

    const nearbyTitle = city
      ? `Nearby Specialist Doctors (${city[0].toUpperCase()}${city.slice(1)})`
      : 'Nearby Specialist Doctors';

    return [
      `Likely Condition: ${condition}`,
      `Severity: ${severity}`,
      `Recommended Specialist: ${specialist}`,
      '',
      'Home Remedies:',
      ...remedies.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Diet Guidance:',
      ...diet.map((item, index) => `${index + 1}. ${item}`),
      '',
      `${nearbyTitle}:`,
      ...doctorList.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Warning Signs (seek medical care immediately):',
      ...warnings.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Note: This is general guidance, not a confirmed diagnosis.',
    ].join('\n');
  };

  const generateAiReply = (userText) => {
    const lower = userText.toLowerCase();
    const city = detectCity(lower);

    if (lower.includes('fever') || lower.includes('cold')) {
      return formatCarePlan({
        condition: 'Viral Fever / Flu-like Illness',
        severity: 'Moderate',
        specialist: 'General Physician',
        city,
        remedies: [
          'Take proper rest and avoid overexertion.',
          'Drink warm fluids and oral rehydration liquids.',
          'Use a lukewarm sponge if temperature rises.',
          'Track temperature every 6 to 8 hours.',
        ],
        diet: [
          'Khichdi, dal soup, vegetable soup, and soft foods.',
          'Coconut water, lemon water, and warm herbal teas.',
          'Avoid fried, spicy, and packaged foods.',
          'Small frequent meals instead of heavy meals.',
        ],
        warnings: [
          'Fever above 102 F for more than 3 days.',
          'Breathing difficulty or chest pain.',
          'Persistent vomiting or signs of dehydration.',
          'Confusion, severe weakness, or fainting.',
        ],
      });
    }

    if (lower.includes('headache')) {
      return formatCarePlan({
        condition: 'Tension Headache / Migraine Trigger',
        severity: 'Mild to Moderate',
        specialist: 'Neurologist or General Physician',
        city,
        remedies: [
          'Rest in a quiet, low-light room.',
          'Hydrate well and reduce screen time for a few hours.',
          'Use a cold or warm compress on forehead/neck.',
          'Maintain regular sleep schedule.',
        ],
        diet: [
          'Drink enough water through the day.',
          'Do not skip meals; include fruits and nuts.',
          'Limit caffeine and avoid processed foods.',
          'Avoid foods that trigger headaches (if known).',
        ],
        warnings: [
          'Sudden severe worst-ever headache.',
          'Headache with weakness, slurred speech, or vision loss.',
          'Headache after head injury.',
          'Headache with persistent vomiting or high fever.',
        ],
      });
    }

    if (lower.includes('stomach') || lower.includes('nausea')) {
      return formatCarePlan({
        condition: 'Acidity / Gastritis / Mild Gastroenteritis',
        severity: 'Mild to Moderate',
        specialist: 'Gastroenterologist or General Physician',
        city,
        remedies: [
          'Take small sips of water frequently.',
          'Rest and avoid heavy physical activity.',
          'Use oral rehydration solution if loose motions occur.',
          'Avoid lying down right after meals.',
        ],
        diet: [
          'Banana, toast, rice, curd, and simple khichdi.',
          'Clear soups and electrolyte fluids.',
          'Avoid oily, spicy, dairy-heavy, and street foods.',
          'Eat small portions every 3 to 4 hours.',
        ],
        warnings: [
          'Blood in stool or vomit.',
          'Severe abdominal pain or persistent vomiting.',
          'No urine output / severe dehydration signs.',
          'Symptoms not improving after 24 to 48 hours.',
        ],
      });
    }

    return formatCarePlan({
      condition: 'Needs Further Symptom Details',
      severity: 'Undetermined',
      specialist: 'General Physician',
      city,
      remedies: [
        'Rest, hydrate, and monitor symptoms closely.',
        'Track temperature, pain level, and duration.',
        'Avoid self-medication beyond basic OTC guidance.',
        'Seek doctor consultation if symptoms persist.',
      ],
      diet: [
        'Simple, easy-to-digest home-cooked meals.',
        'Adequate fluids and electrolyte intake.',
        'Avoid junk, oily, and highly processed foods.',
        'Prefer fruits, soups, and light proteins.',
      ],
      warnings: [
        'Severe pain, breathing issue, or high fever.',
        'Rapid worsening of symptoms.',
        'Persistent vomiting, fainting, or confusion.',
        'Any emergency symptoms requiring urgent care.',
      ],
    });
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
    return (
      <>
        <LandingPage
          onStart={() => setShowApp(true)}
          onLogin={() => {
            setAuthMode('login');
            setShowLoginModal(true);
          }}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          profileName={profileName}
        />
        {!isAuthenticated && (
          <LoginModal
            show={showLoginModal}
            authMode={authMode}
            authSubmitting={authSubmitting}
            authUser={authUser}
            credentials={credentials}
            otpInput={otpInput}
            pendingOtp={pendingOtp}
            error={loginError}
            notice={authNotice}
            hasFirebaseConfig={hasFirebaseConfig}
            onChange={handleCredentialChange}
            onOtpInputChange={(event) => setOtpInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
            onSwitchMode={() => {
              setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'));
              setLoginError('');
              setAuthNotice('');
            }}
            onClose={() => {
              setShowLoginModal(false);
              setLoginError('');
              setAuthNotice('');
            }}
            onGoogleLogin={handleGoogleLogin}
            onConfirmOtp={handleConfirmOtp}
            onResendVerification={handleResendVerification}
            onSubmit={handleEmailAuth}
          />
        )}
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <ChatInterface
        authUser={authUser}
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
        authMode={authMode}
        authSubmitting={authSubmitting}
        authUser={authUser}
        credentials={credentials}
        otpInput={otpInput}
        pendingOtp={pendingOtp}
        error={loginError}
        notice={authNotice}
        hasFirebaseConfig={hasFirebaseConfig}
        onChange={handleCredentialChange}
        onOtpInputChange={(event) => setOtpInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
        onSwitchMode={() => {
          setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'));
          setLoginError('');
          setAuthNotice('');
        }}
        onClose={() => {
          setShowLoginModal(false);
          setLoginError('');
          setAuthNotice('');
        }}
        onGoogleLogin={handleGoogleLogin}
        onConfirmOtp={handleConfirmOtp}
        onResendVerification={handleResendVerification}
        onSubmit={handleEmailAuth}
      />
    </div>
  );
}

function LoginModal({
  show,
  authMode,
  authSubmitting,
  authUser,
  credentials,
  otpInput,
  pendingOtp,
  error,
  notice,
  hasFirebaseConfig,
  onChange,
  onOtpInputChange,
  onSwitchMode,
  onClose,
  onGoogleLogin,
  onConfirmOtp,
  onResendVerification,
  onSubmit,
}) {
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
            <h2 className="text-xl font-bold text-slate-800">
              {authMode === 'login'
                ? 'Login To Continue'
                : authMode === 'signup'
                ? 'Create New Account'
                : 'Verify Email OTP'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Logged in users can access the chat interface.
            </p>

            {!hasFirebaseConfig && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Firebase keys are missing. Add your values in .env from .env.example.
              </p>
            )}

            {authMode !== 'verify-otp' ? (
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
            ) : (
              <div className="mt-5 space-y-3">
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={onChange}
                  placeholder="Correct email (if needed)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-medical-500"
                />
                <input
                  type="text"
                  value={otpInput}
                  onChange={onOtpInputChange}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-medical-500 tracking-[0.35em]"
                />
                <p className="text-xs text-slate-500">
                  OTP validity: 1 hour 30 minutes.
                  {pendingOtp?.expiresAt ? ` Expires at ${new Date(pendingOtp.expiresAt).toLocaleTimeString()}.` : ''}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
            {notice && <p className="text-sm text-emerald-700 mt-3">{notice}</p>}

            {authUser && !authUser.emailVerified && authMode === 'login' && (
              <button
                type="button"
                onClick={onResendVerification}
                disabled={authSubmitting}
                className="mt-3 w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                Resend Verification Email
              </button>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={authSubmitting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-slate-700"
              >
                Cancel
              </button>
              {authMode !== 'verify-otp' ? (
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="flex-1 rounded-xl bg-medical-600 text-white py-2.5 hover:bg-medical-500 disabled:bg-slate-300"
                >
                  {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConfirmOtp}
                  disabled={authSubmitting}
                  className="flex-1 rounded-xl bg-medical-600 text-white py-2.5 hover:bg-medical-500 disabled:bg-slate-300"
                >
                  Confirm OTP
                </button>
              )}
            </div>

            {authMode !== 'verify-otp' && (
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={authSubmitting || !hasFirebaseConfig}
                className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
              >
                Continue With Google
              </button>
            )}

            {authMode === 'verify-otp' && (
              <button
                type="button"
                onClick={onResendVerification}
                disabled={authSubmitting}
                className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
              >
                Resend OTP (after expiry) / Correct Email
              </button>
            )}

            {authMode !== 'verify-otp' && (
              <button
                type="button"
                onClick={onSwitchMode}
                disabled={authSubmitting}
                className="mt-4 w-full text-sm text-medical-700 hover:text-medical-600"
              >
                {authMode === 'login' ? 'No account? Sign up' : 'Already have an account? Login'}
              </button>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatInterface({ authUser, messages, chatInput, setChatInput, loading, onSend, onKeyDown, onLogout, endRef }) {
  return (
    <div className="h-screen w-full bg-slate-100 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-4">
        <div>
          <h1 className="font-semibold text-slate-800">DoctorGPT Chat</h1>
          <p className="text-xs text-slate-500">{authUser?.email || 'Authenticated user'}</p>
        </div>
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
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md whitespace-pre-wrap leading-relaxed'
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
