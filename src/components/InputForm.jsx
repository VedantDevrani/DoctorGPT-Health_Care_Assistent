import React from 'react';
import { User, Activity, Clock, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const InputForm = ({ formData, setFormData, onSubmit, loading }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-6 border-b flex items-center gap-3">
        <div className="p-2 bg-medical-100 rounded-lg text-medical-600">
          <Activity size={24} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">DoctorGPT <span className="text-xs font-normal text-slate-400">AI Health Assistant</span></h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
              <User size={16} /> Age
            </span>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 25"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition-all"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">Gender</span>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition-all bg-white"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
              <Activity size={16} /> Symptoms
            </span>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your symptoms in detail..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition-all resize-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
              <Clock size={16} /> Duration
            </span>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g. 2 days, 1 week"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition-all"
            />
          </label>
        </div>
      </div>

      <div className="p-6 border-t bg-slate-50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={loading || !formData.symptoms}
          className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
            loading || !formData.symptoms
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'medical-gradient text-white shadow-medical-200 hover:shadow-xl'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              Analyze Symptoms
            </>
          )}
        </motion.button>
        <p className="text-[10px] text-slate-400 text-center mt-3">
          AI-generated insights. Always consult a real doctor for medical advice.
        </p>
      </div>
    </div>
  );
};

export default InputForm;
