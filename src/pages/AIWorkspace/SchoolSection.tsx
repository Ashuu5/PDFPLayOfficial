import {
  GraduationCap,
  FileText,
  Award,
  IdCard,
  ClipboardList,
  BookOpen,
} from 'lucide-react';

export default function SchoolSection() {
  const items = [
    {
      icon: FileText,
      title: 'Research Papers',
      desc: 'Science Essay · History Report · Thesis Draft',
    },
    {
      icon: IdCard,
      title: 'ID Cards',
      desc: 'Student ID · Faculty ID · Library Card',
    },
    {
      icon: ClipboardList,
      title: 'Report Card',
      desc: 'Math: A · Science: A · English: A · History: A',
    },
    {
      icon: BookOpen,
      title: 'Assignments',
      desc: 'Homework · Homework Task · Quiz',
    },
    {
      icon: FileText,
      title: 'Assignments',
      desc: 'Homework · Lab Report · English: B+',
    },
    {
      icon: Award,
      title: 'Certificate',
      desc: 'University of Oxford · EngCert · Exp: 09/2026',
    },
    {
      icon: Award,
      title: 'Certificate',
      desc: 'Course Completion · Data Analysis Cert · Issued: 2024',
    },
    {
      icon: FileText,
      title: 'School Forms',
      desc: 'Enrollment Form · Transcript Request',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          School Section
        </h3>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="group rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-2.5 hover:border-purple-400/50 hover:shadow-[0_8px_20px_-12px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}