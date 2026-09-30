import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import ExcelPanel from './ExcelPanel';

export default function AIExcel() {
  const navigate = useNavigate();

  return (
    <div className="ai-workspace max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            AI <span className="ai-purple-text">Excel</span>
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create Excel files from prompts — with live formulas. Or upload your files for XLOOKUP / VLOOKUP.
        </p>
      </div>

      <ExcelPanel />
    </div>
  );
}