import { FileText, Globe, BarChart3, Award, Briefcase } from 'lucide-react';

export default function DocSamples() {
  const samples = [
    {
      icon: Globe,
      iconBg: 'from-blue-500 to-blue-700',
      title: 'All Documents Worldwide',
      desc: 'Passport · Invoice · Contract · Legal Agreement · Report',
      tag: 'Global',
      tagColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
      flags: true,
    },
    {
      icon: BarChart3,
      iconBg: 'from-purple-500 to-purple-700',
      title: 'Premium Dashboards',
      desc: 'Marketing Report · Analytics Summary · Investor Deck',
      tag: 'Business',
      tagColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
    },
    {
      icon: Award,
      iconBg: 'from-emerald-500 to-emerald-700',
      title: 'ATS Resume',
      desc: 'Optimized for ATS · Skills · Experience · Education · Summary',
      tag: 'Career',
      tagColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    },
    {
      icon: Briefcase,
      iconBg: 'from-indigo-500 to-indigo-700',
      title: 'Europass Resume',
      desc: 'Standard EU Format · Multilingual · Skills Passport',
      tag: 'EU',
      tagColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    },
  ];

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Document Samples
        </h3>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {samples.map((sample, i) => {
          const Icon = sample.icon;
          return (
            <div
              key={i}
              className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3.5 hover:border-purple-400/50 hover:shadow-[0_10px_30px_-15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-2.5">
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${sample.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                    {sample.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                    {sample.desc}
                  </p>
                </div>
              </div>

              {/* Footer: Tag + Flags */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${sample.tagColor}`}
                >
                  {sample.tag}
                </span>
                {sample.flags && (
                  <div className="flex items-center gap-1 text-[13px] leading-none">
                    <span>🇺🇸</span>
                    <span>🇪🇺</span>
                    <span>🇵🇰</span>
                    <span>🇦🇪</span>
                    <span>🇧🇷</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}