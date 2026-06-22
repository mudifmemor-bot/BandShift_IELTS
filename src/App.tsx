/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Onboarding from './components/Onboarding.tsx';
import Dashboard from './components/Dashboard.tsx';
import EssayEval from './components/EssayEval.tsx';
import Navbar from './components/Navbar.tsx';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/evaluate" element={<EssayEval />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
