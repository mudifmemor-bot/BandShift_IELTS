import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-900">
            BandShift MVP
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <Link to="/evaluate" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            Evaluate Essay
          </Link>
        </div>
      </div>
    </nav>
  );
}
