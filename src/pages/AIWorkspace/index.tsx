import { motion } from 'framer-motion';
import { FileSpreadsheet, FileText } from 'lucide-react';
import ExcelPanel from './ExcelPanel';
import DocPanel from './DocPanel';

export default function AIWorkspace() {
  return (
    <div className="ai-workspace max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ============ HERO ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">
          AI{' '}
          <span className="ai-purple-text">
            Workspace
          </span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create, generate, and convert with AI — all in one place
        </p>
      </motion.div>

      {/* ============ 2 CARDS ============ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      >
        {/* AI Excel card */}
        <div className="ai-purple-card p-5 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-1 text-white">AI Excel</h3>
              <p className="text-[11px] leading-snug text-white/80">
                Create excel from prompt with formulas
              </p>
            </div>
          </div>
        </div>

        {/* AI Doc card */}
        <div className="ai-purple-card p-5 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-1 text-white">AI Doc</h3>
              <p className="text-[11px] leading-snug text-white/80">
                Create docs from prompt
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============ 2 PANELS SIDE BY SIDE ============ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* AI Excel Panel — LEFT */}
        <ExcelPanel />

        {/* AI Doc Panel — RIGHT */}
        <DocPanel />
      </motion.div>
    </div>
  );
}