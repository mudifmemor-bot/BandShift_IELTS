import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, UploadCloud, Edit3, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('bandshift_user_id');
    if (!userId) {
      navigate('/');
      return;
    }
    fetch(`/api/dashboard/${userId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [navigate]);

  if (!data) return <div className="animate-pulse space-y-6 max-w-4xl mx-auto mt-8">
    <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
    <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
  </div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      {/* Header Metric Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 rounded-2xl p-8 text-white flex items-center justify-between shadow-lg"
      >
        <div>
          <h2 className="text-3xl font-bold mb-2">{data.daysLeft} Days Left</h2>
          <p className="text-indigo-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-300" />
            Target: {data.user.targetScore} Band ({data.user.targetCountry})
          </p>
        </div>
        <div className="hidden sm:block">
           <div className="w-24 h-24 rounded-full border-4 border-indigo-400 flex items-center justify-center text-xl font-bold bg-indigo-500/20">
             {data.user.currentBand}
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Micro-Habits */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Daily Micro-Habits
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">30 Mins Total</span>
          </div>
          <ul className="space-y-4">
            {data.habits.map((habit: string, i: number) => (
              <li key={i} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{habit}</p>
                  <p className="text-xs text-slate-500 mt-1">Suggested for Band {data.user.targetScore} prep</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <UploadCloud className="w-5 h-5 text-slate-400" /> Writing Task 2
          </h3>
          <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
            Submit a handwritten or typed essay to our Hybrid-Trust AI Jury. We evaluate against 4 strict criteria based on IELTS standard descriptors.
          </p>

          <button 
            onClick={() => navigate('/evaluate')}
            className="w-full bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              <span className="font-medium">Submit New Essay</span>
            </div>
            <span className="bg-slate-700 font-mono text-xs px-2 py-1 rounded-md text-slate-300">New</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
