import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Target, Globe, Calendar, TrendingUp } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentBand: '6.0',
    targetScore: '7.5',
    targetCountry: 'Canada',
    testDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      localStorage.setItem('bandshift_user_id', data.user.id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Build Your Assessment Baseline</h1>
        <p className="text-slate-500 text-sm">Tell us about your goals to generate a hyper-personalized micro-habit timeline.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Current Band
            </label>
            <select 
              value={formData.currentBand}
              onChange={(e) => setFormData({ ...formData, currentBand: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-slate-50"
            >
              <option value="Unknown">Unknown</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5">7.5</option>
              <option value="8.0+">8.0+</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Target className="w-4 h-4 text-slate-400" /> Target Band
            </label>
            <select 
              value={formData.targetScore}
              onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-slate-50"
            >
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
              <option value="7.5">7.5</option>
              <option value="8.0">8.0</option>
              <option value="8.5">8.5</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Globe className="w-4 h-4 text-slate-400" /> Target Destination
          </label>
          <select 
            value={formData.targetCountry}
            onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-slate-50"
          >
            <option value="Canada">Canada (Express Entry)</option>
            <option value="UK">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="USA">United States</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" /> Test Date
          </label>
          <input 
            type="date" 
            value={formData.testDate}
            onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none bg-slate-50 text-slate-700"
          />
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-slate-900 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-70"
        >
          {loading ? 'Generating Timeline...' : 'Generate Dashboard'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
