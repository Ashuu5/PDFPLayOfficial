import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

interface ToolPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: string;
  children: ReactNode;   // ✅ Yeh add kiya — yehi missing tha
}

export default function ToolPage({ title, description, icon, children }: ToolPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-5">

      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to all tools
      </Link>

      {/* Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-3">
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white mb-1.5">{title}</h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">{description}</p>
      </div>

      {/* Content — ✅ `children` render ho raha hai */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-4 md:p-6">
        {children}
      </div>

      {/* Privacy note */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your files are processed locally in your browser. Nothing is uploaded to any server.</span>
      </div>
    </div>
  );
}