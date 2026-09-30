import { useState } from 'react';
import {
  Sparkles,
  FileText,
  Plus,
  Loader2,
  LayoutGrid,
  Download,
} from 'lucide-react';
import { docTemplates, findDocTemplate } from '../../lib/docTemplates';
import { generateDocx } from '../../lib/docEngine';

export default function DocPanel() {
  const [prompt, setPrompt] = useState(
    'Draft a professional business proposal or document for my company'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const matchedTemplate = findDocTemplate(prompt);

    if (!matchedTemplate) {
      setError(
        'Could not match a document template. Try mentioning: invoice, proposal, resume, report card, certificate, letter, contract, etc.'
      );
      return;
    }

    setIsGenerating(true);
    try {
      await generateDocx(matchedTemplate);
      setSuccessMessage(
        `${matchedTemplate.name} generated successfully. Check your downloads.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTemplate = async (templateId: string) => {
    const template = docTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await generateDocx(template);
      setSuccessMessage(
        `${template.name} generated successfully. Check your downloads.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryColors = {
    business: {
      bg: 'bg-purple-500/15',
      text: 'text-purple-600 dark:text-purple-400',
      tag: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
      border: 'hover:border-purple-400/50',
      shadow: 'hover:shadow-[0_10px_30px_-15px_rgba(139,92,246,0.4)]',
    },
    resume: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-600 dark:text-blue-400',
      tag: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
      border: 'hover:border-blue-400/50',
      shadow: 'hover:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.4)]',
    },
    school: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      tag: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
      border: 'hover:border-emerald-400/50',
      shadow: 'hover:shadow-[0_10px_30px_-15px_rgba(16,185,129,0.4)]',
    },
    personal: {
      bg: 'bg-orange-500/15',
      text: 'text-orange-600 dark:text-orange-400',
      tag: 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
      border: 'hover:border-orange-400/50',
      shadow: 'hover:shadow-[0_10px_30px_-15px_rgba(249,115,22,0.4)]',
    },
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-purple-500 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Doc</h2>
      </div>

      {/* PROMPT BOX */}
      <div className="relative mb-5">
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3.5">
          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 mt-1 shrink-0" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none outline-none leading-snug"
            placeholder="Try: 'invoice banao' or 'ATS resume chahiye' or 'student certificate banao'"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg ai-purple-btn text-white text-[12px] font-bold hover:scale-[1.03] transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Create Document
                <Plus className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-[12px] text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-[12px] text-emerald-600 dark:text-emerald-300">
            ✅ {successMessage}
          </p>
        </div>
      )}

      {/* TEMPLATES GALLERY */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Document Templates
            </h3>
            <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full">
              {docTemplates.length} ready
            </span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
            Click any template to download
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docTemplates.map((template) => {
            const colors = categoryColors[template.category];
            return (
              <button
                key={template.id}
                onClick={() => downloadTemplate(template.id)}
                disabled={isGenerating}
                className={`group text-left rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 ${colors.border} ${colors.shadow} transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">
                      {template.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${colors.tag}`}
                  >
                    {template.category}
                  </span>
                  <span className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Download
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIPS */}
      <div className="mt-5 px-3.5 py-2.5 rounded-lg bg-purple-500/[0.06] border border-purple-500/20">
        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
          <span className="font-bold text-purple-500 dark:text-purple-400">💡 Tip:</span>{' '}
          All documents open in Microsoft Word or Google Docs. You can fully
          edit text, change colors, replace the logo placeholder, and customize
          anything you want.
        </p>
      </div>
    </div>
  );
}