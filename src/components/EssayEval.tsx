import { useState, useRef, ChangeEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Bot, RefreshCw, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '../lib/utils.ts';
import confetti from 'canvas-confetti';

export default function EssayEval() {
  const [file, setFile] = useState<File | null>(null);
  const [essayText, setEssayText] = useState('');
  const [topicText, setTopicText] = useState('');
  const [step, setStep] = useState<'upload' | 'edit' | 'evaluate' | 'result'>('upload');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [results, setResults] = useState<any>(null);
  const [activeFeedback, setActiveFeedback] = useState<any>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('edit');
      setLoadingMsg('Extracting handwritten text via OCR...');
      
      const formData = new FormData();
      formData.append('image', e.target.files[0]);
      
      try {
         const res = await fetch('/api/ocr', { method: 'POST', body: formData });
         const data = await res.json();
         if (data.text) setEssayText(data.text);
      } catch (err) {
         console.error(err);
      } finally {
         setLoadingMsg('');
      }
    }
  };

  const handleEvaluate = async () => {
    if (!essayText) return;
    setStep('evaluate');
    setLoadingMsg('Jury of Models evaluating Task Achievement, CC, LR, and GRA...');
    try {
      const res = await fetch('/api/evaluate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ essay: essayText, topic: topicText })
      });
      const data = await res.json();
      setResults(data);
      setStep('result');
      if (data.overallBand >= 7.0) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setStep('edit');
    } finally {
      setLoadingMsg('');
    }
  };

  const renderHighlightedEssay = () => {
    if (!results || !results.feedback) return <p className="whitespace-pre-wrap">{essayText}</p>;
    
    // Simple naive substring highlighter for MVP
    let highlightedText = essayText;
    const markers: { start: number, end: number, feedback: any }[] = [];
    
    results.feedback.forEach((fb: any) => {
        if (!fb.exactSubstring) return;
        const index = highlightedText.indexOf(fb.exactSubstring);
        if (index !== -1) {
             markers.push({ start: index, end: index + fb.exactSubstring.length, feedback: fb });
        }
    });

    // Sort by descending to not mess up indices during replacement
    markers.sort((a, b) => b.start - a.start);
    
    let parts: ReactNode[] = [essayText];
    // In a real app we'd build an AST or chunk array. For now we will just use a simplistic text splitting if active feedback is selected.
    
    return (
      <div className="whitespace-pre-wrap leading-relaxed font-serif text-slate-800 text-lg">
         {essayText.split('. ').map((sentence, idx) => {
             // Basic naive sentence checking to see if it contains active feedback
             const isActive = activeFeedback && activeFeedback.exactSubstring && sentence.includes(activeFeedback.exactSubstring);
             return (
               <span 
                 key={idx} 
                 className={cn("transition-colors duration-300", isActive ? "bg-amber-200 text-amber-900 rounded px-1" : "")}
               >
                 {sentence}{idx < essayText.split('. ').length - 1 ? '. ' : ''}
               </span>
             );
         })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
       {/* Header Stepper */}
       <div className="flex items-center justify-center gap-4 mb-12">
          {['upload', 'edit', 'result'].map((s, idx) => (
             <div key={s} className="flex items-center gap-4">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step === s ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500")}>
                   {idx + 1}
                </div>
                {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
             </div>
          ))}
       </div>

       {step === 'upload' && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">Paper-to-Digital Bridge</h1>
            <p className="text-center text-slate-500 mb-8">Take a photo of your handwritten Task 2 essay. Our OCR engine handles the rest.</p>
            <label className="border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group">
               <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
               </div>
               <span className="font-semibold text-slate-700">Click to upload or drag image</span>
               <span className="text-sm text-slate-400 mt-2">JPEG, PNG up to 10MB</span>
               <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="mt-8 text-center">
               <span className="text-slate-400 text-sm">or</span>
               <button onClick={() => setStep('edit')} className="mx-auto block mt-4 text-indigo-600 font-medium hover:underline">
                  Type essay manually
               </button>
            </div>
         </motion.div>
       )}

       {(step === 'edit' || step === 'evaluate') && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <input 
                 type="text" 
                 placeholder="Enter Essay Topic (Optional but recommended for Task Achievement)"
                 className="w-full bg-transparent outline-none font-medium text-slate-700"
                 value={topicText}
                 onChange={e => setTopicText(e.target.value)}
                 disabled={step === 'evaluate'}
               />
            </div>
            <textarea 
               value={essayText}
               onChange={e => setEssayText(e.target.value)}
               disabled={step === 'evaluate'}
               placeholder="Write or review your OCR-extracted essay here..."
               className="w-full h-96 p-6 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500 font-serif text-lg leading-relaxed"
            />
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
               <span className="text-xs font-mono text-slate-400">{essayText.split(' ').filter(x => x).length} words</span>
               <button 
                 onClick={handleEvaluate}
                 disabled={!essayText || step === 'evaluate'}
                 className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
               >
                 {step === 'evaluate' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                 {step === 'evaluate' ? 'Jury Deliberating...' : 'Evaluate via AI Jury'}
               </button>
            </div>
         </motion.div>
       )}

       {step === 'result' && results && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Essay with Highlights */}
            <div className="lg:col-span-7 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <FileText className="w-5 h-5" /> Your Essay
               </h3>
               {renderHighlightedEssay()}
            </div>

            {/* Right: Hybrid-Trust Panel */}
            <div className="lg:col-span-5 space-y-6">
               <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-slate-400 text-sm font-medium mb-1">Ensemble Agreed Score</p>
                     <div className="text-5xl font-black">{results.overallBand?.toFixed(1)}</div>
                  </div>
                  <div className="text-right relative z-10">
                     <div className="text-xs font-mono text-slate-400 mb-2">Jury Variances</div>
                     <div className="flex gap-2 justify-end">
                       {results.ensembleResults?.map((r: number, i: number) => (
                          <div key={i} className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700 font-mono">{r.toFixed(1)}</div>
                       ))}
                     </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Bot className="w-48 h-48" />
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                  {Object.entries(results.criteriaScores || {}).map(([key, score]: any) => (
                     <div key={key} className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="text-lg font-bold text-slate-800">{score.toFixed(1)}</div>
                     </div>
                  ))}
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                     <h4 className="font-bold text-sm text-slate-700">Pedagogical Feedback</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                     {results.feedback?.map((fb: any, idx: number) => (
                        <button 
                          key={idx}
                          onMouseEnter={() => setActiveFeedback(fb)}
                          onMouseLeave={() => setActiveFeedback(null)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl transition-all border outline-none",
                            activeFeedback === fb ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                          )}
                        >
                           <div className="flex items-center gap-2 mb-2">
                              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{fb.criterion}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Reviewer {fb._reviewerId}</span>
                           </div>
                           <p className="text-sm font-medium text-slate-800 mb-2">{fb.comment}</p>
                           {fb.suggestion && (
                             <div className="bg-white text-xs p-2 rounded border border-slate-100 flex gap-2 items-start shadow-sm mt-2">
                                <span className="text-indigo-600 mt-0.5 font-bold">💡</span>
                                <span className="text-slate-600 italic leading-relaxed">{fb.suggestion}</span>
                             </div>
                           )}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </motion.div>
       )}
    </div>
  );
}
