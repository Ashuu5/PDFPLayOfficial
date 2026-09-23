import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

interface ToolPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: string;
  children: ReactNode;
}

export default function ToolPage({ title, description, icon, children }: ToolPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-3 py-3">

      {/* Back button — compact */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all mb-3"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to all tools
      </Link>

      {/* Header — compact */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 mb-2">
          {icon}
        </div>
        <h1 className="text-xl font-bold text-white mb-1">{title}</h1>
        <p className="text-xs text-gray-400 max-w-2xl mx-auto">{description}</p>
      </div>

      {/* Content — compact */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3 md:p-4">
        {children}
      </div>

      {/* Privacy note — compact */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-500">
        <Shield className="w-3 h-3 text-emerald-400" />
        <span>Your files are processed locally in your browser. Nothing is uploaded to any server.</span>
      </div>
    </div>
  );
}