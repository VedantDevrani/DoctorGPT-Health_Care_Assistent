import React from 'react';
import { ShieldAlert, Stethoscope, Home, AlertCircle, MapPin, Star, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultsPanel = ({ response, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-medical-100 border-t-medical-600 rounded-full animate-spin" />
        <h2 className="text-xl font-semibold text-slate-700">Analyzing your health data...</h2>
        <p className="text-slate-400 max-w-sm">Our AI is processing your symptoms to provide the best possible insights and recommendations.</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-medical-100/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-health-100/30 rounded-full blur-3xl animate-pulse-slow" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 space-y-8"
        >
          <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center text-medical-500 mx-auto transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <div className="bg-medical-50 p-6 rounded-[32px]">
              <Stethoscope size={64} strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ready for your Analysis</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              Enter your symptoms to the left. Our AI health assistant will provide insights, remedies, and connect you with the right specialists.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-xs font-medium text-slate-400 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-500" /> Secure & Private
            </div>
            <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 text-xs font-medium text-slate-400 flex items-center gap-2">
              <Activity size={14} className="text-medical-500" /> Real-time Analysis
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const { condition, severity, homeRemedies, doctors, specialist, warnings, disclaimer } = response;

  const severityColors = {
    mild: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    severe: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">
      <div className="p-6 bg-white border-b sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-medical-600" size={24} />
          Analysis Results
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
        {/* Main Condition Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 card-shadow border border-slate-100"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Potential Condition</p>
              <h3 className="text-3xl font-bold text-slate-800">{condition}</h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${severityColors[severity.toLowerCase()] || severityColors.mild}`}>
              {severity.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg text-sm">
              <UserCheck size={16} className="text-medical-600" />
              Specialist: <span className="font-semibold">{specialist}</span>
            </span>
          </div>
        </motion.div>

        {/* Warning Banner */}
        {warnings && warnings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-2xl flex gap-4"
          >
            <ShieldAlert className="text-rose-500 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-rose-800 mb-1">Critical Warnings</h4>
              <ul className="text-rose-700 text-sm list-disc list-inside space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Home Remedies */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 card-shadow border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-health-100 text-health-600 rounded-xl">
                <Home size={20} />
              </div>
              <h4 className="font-bold text-slate-800">Home Remedies</h4>
            </div>
            <ul className="space-y-3">
              {homeRemedies.map((remedy, i) => (
                <li key={i} className="flex gap-3 text-slate-600 text-sm">
                  <span className="w-1.5 h-1.5 bg-health-400 rounded-full mt-2 shrink-0" />
                  {remedy}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 card-shadow border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-medical-100 text-medical-600 rounded-xl">
                <Stethoscope size={20} />
              </div>
              <h4 className="font-bold text-slate-800">Recommended Doctors</h4>
            </div>
            <div className="space-y-4">
              {doctors.map((doctor, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-medical-200 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-slate-800 group-hover:text-medical-600 transition-colors">{doctor.name}</h5>
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                      <Star size={14} fill="currentColor" /> {doctor.rating}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{doctor.specialization}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin size={12} /> {doctor.location}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
          <div className="flex gap-3 text-slate-500 italic text-[11px] leading-relaxed">
            <AlertCircle size={16} className="shrink-0" />
            <p>{disclaimer || "Disclaimer: This AI provide preliminary medical information for educational purposes only. It is not a clinical diagnosis or a replacement for medical advice from a qualified healthcare professional. If you are experiencing a medical emergency, please contact your local emergency services immediately."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;

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
