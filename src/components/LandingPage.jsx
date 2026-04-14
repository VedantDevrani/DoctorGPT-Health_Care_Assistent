import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Stethoscope, Home, ChevronRight, Check } from 'lucide-react';

const LandingPage = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-medical-100 selection:text-medical-900">
      {/* Header/Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-100 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-medical-500 rounded-lg text-white shadow-lg shadow-medical-200">
            <Activity size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">DoctorGPT</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all active:scale-95"
          >
            Login / Sign Up
          </button>
          <button
            onClick={onStart}
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95"
          >
            Open App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden hero-gradient">
        {/* Background Decorations */}
        <div className="absolute top-20 right-[-10%] w-[40%] h-[40%] bg-medical-200/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-health-200/20 rounded-full blur-[120px] animate-pulse-slow" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="lg:w-1/2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-medical-50 text-medical-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-medical-100">
                  <ShieldCheck size={14} /> HIPAA Compliant AI
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                  AI-powered <span className="text-transparent bg-clip-text medical-gradient">health assistant</span> for quick guidance
                </h1>
                <p className="mt-6 text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Get preliminary insights and personalized medical recommendations in seconds using advanced AI. Safe, secure, and always available.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={onLogin}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-300 text-slate-700 font-bold text-lg hover:bg-slate-100 transition-all"
                >
                  Login / Sign Up
                </button>
                <button
                  onClick={onStart}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl medical-gradient text-white font-bold text-lg shadow-xl shadow-medical-200 flex items-center justify-center gap-2 group hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  Start Checking Symptoms <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden ring-2 ring-slate-50">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                    </div>
                  ))}
                  <div className="pl-4 text-sm font-medium text-slate-500">
                    Trusted by <span className="text-slate-900 font-bold">10k+</span> users
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Input Form Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:w-1/2 relative"
            >
              <div className="relative z-10 bg-white/80 backdrop-blur-2xl rounded-[40px] border border-white p-8 lg:p-10 card-shadow">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-medical-50 rounded-2xl flex items-center justify-center text-medical-600">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Symptom Checker</h3>
                      <p className="text-xs text-slate-500">Professional Assessment</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 px-4 flex items-center text-slate-400 text-sm">Age: 25</div>
                    <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 px-4 flex items-center text-slate-400 text-sm">Gender: Female</div>
                    <div className="h-32 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-slate-400 text-sm italic">
                      "I have been feeling constant headache and mild fever since yesterday..."
                    </div>
                    <div className="h-12 bg-medical-500/10 rounded-xl flex items-center justify-center text-medical-600 font-bold blur-[1px]">
                      Analyzing Symptoms...
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute top-10 -left-10 z-20 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 shadow-xl flex items-center gap-2 animate-bounce-slow">
                <Check size={16} className="bg-emerald-500 text-white rounded-full p-0.5" /> High Accuracy
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Everything you need for <span className="text-medical-600">better health</span></h2>
            <p className="mt-4 text-slate-500 text-lg">Our AI model is trained on millions of medical journals to give you reliable health guidance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity size={24} />}
              title="Symptom Analysis"
              description="Detailed patterns matching to identify potential conditions based on your inputs."
              color="medical"
              delay={0}
            />
            <FeatureCard 
              icon={<Home size={24} />}
              title="Home Remedies"
              description="Clinically safe self-care recommendations for mild cases and symptoms."
              color="health"
              delay={0.1}
            />
            <FeatureCard 
              icon={<Stethoscope size={24} />}
              title="Doctor Recommendations"
              description="Find the right specialists in India with top ratings for your specific condition."
              color="medical"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-100">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Activity className="text-medical-500" size={24} />
            <span className="text-xl font-bold text-slate-800">DoctorGPT</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 DoctorGPT. Made with ❤️ for a healthier world.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-medical-600">Privacy</a>
            <a href="#" className="hover:text-medical-600">Terms</a>
            <a href="#" className="hover:text-medical-600">Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color, delay }) => {
  const colorStyles = color === 'medical' 
    ? 'bg-medical-50 text-medical-600 border-medical-100' 
    : 'bg-health-50 text-health-600 border-health-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-8 bg-white border border-slate-100 rounded-4xl hover:border-medical-200 hover:shadow-2xl hover:shadow-medical-100/20 transition-all group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorStyles}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-medical-600 transition-colors uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default LandingPage;
