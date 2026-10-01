import { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  FileSpreadsheet,
  X,
  Loader2,
} from 'lucide-react';
import { parsePrompt, type ParseResult, type FormulaSlot } from '../../lib/ruleEngine';
import { parseFile, type ParsedFile, summarizeFile } from '../../lib/fileReader';
import { generateExcel } from '../../lib/excelWriter';
import { generateFromTemplate } from '../../lib/templateEngine';
import { findTemplate, templates as allTemplates } from '../../lib/templates';
import MissingFieldsModal from './MissingFieldsModal';

export default function ExcelPanel() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [langOpen, setLangOpen] = useState(false);
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'Chinese'];

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    setError(null);

    try {
      const parsed: ParsedFile[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const result = await parseFile(file);
        parsed.push(result);
      }
      setFiles((prev) => [...prev, ...parsed]);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // GENERATE — Main function
  // ============================================================
  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const wantsTemplate =
      /\b(banao|bana\s*do|bana\s*de|create|chahiye|chahiyay|make|generate|banado|banade)\b/i.test(
        prompt
      );
    const matchedTemplate = findTemplate(prompt);

    // If user wants a template AND a matching template exists
    if (wantsTemplate && matchedTemplate) {
      setIsGenerating(true);
      try {
        const result = await generateFromTemplate({
          prompt,
          outputFileName: matchedTemplate.fileName,
        });

        if (result.success) {
          setSuccessMessage(result.message);
        } else {
          setError(result.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to generate template');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Otherwise: use RULE engine (formula-based)
    const result = parsePrompt(prompt);
    setParseResult(result);

    if (result.formula === 'UNKNOWN') {
      if (matchedTemplate) {
        setIsGenerating(true);
        try {
          const templateResult = await generateFromTemplate({
            prompt,
            outputFileName: matchedTemplate.fileName,
          });
          if (templateResult.success) {
            setSuccessMessage(templateResult.message);
          } else {
            setError(templateResult.message);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to generate template');
        } finally {
          setIsGenerating(false);
        }
        return;
      }

      setError(
        'Could not detect a formula or template. Try: "50 bando ki sales report banao" or mention a formula like XLOOKUP, SUM, VLOOKUP, IF, etc.'
      );
      return;
    }

    if (result.missingSlots.length > 0) {
      setModalOpen(true);
      return;
    }

    await doGenerate(result.slots);
  };

  // ============================================================
  // DO GENERATE (formula-based)
  // ============================================================
  const doGenerate = async (slots: FormulaSlot[]) => {
    if (!parseResult) return;

    setIsGenerating(true);
    setError(null);

    try {
      await generateExcel({
        formula: parseResult.formula,
        slots,
        files,
        outputFileName: `AI_${parseResult.formula}_${Date.now()}.xlsx`,
      });
      setModalOpen(false);
      setSuccessMessage(`${parseResult.formula} applied successfully. File downloaded.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModalGenerate = async (filledSlots: FormulaSlot[]) => {
    await doGenerate(filledSlots);
  };

  // ============================================================
  // DOWNLOAD TEMPLATE (direct)
  // ============================================================
  const downloadTemplate = async (templateId: string, templateName: string, fileName: string) => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await generateFromTemplate({
        prompt: templateName,
        outputFileName: fileName,
      });
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Excel</h2>
      </div>

      {/* PROMPT BOX */}
      <div className="relative mb-4">
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3.5">
          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 mt-1 shrink-0" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none outline-none leading-snug"
            placeholder="Try: 'placeholder="Describe what Excel file you want..."'"
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
                Generate
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* UPLOAD BOX */}
      <div
        className="rounded-xl border-2 border-dashed border-purple-400/40 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/[0.03] p-5 mb-4 cursor-pointer hover:border-purple-400/70 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Upload file for VLOOKUP / XLOOKUP
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Drag & drop .xlsx or .csv file here · or{' '}
                <span className="text-purple-500 dark:text-purple-400 underline">
                  Browse files
                </span>
              </p>
            </div>
          </div>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLangOpen(!langOpen);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:border-purple-400/50 transition-all"
            >
              {language}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 w-32 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1f] shadow-2xl py-1 z-20">
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage(l);
                      setLangOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                      language === l
                        ? 'text-purple-500 bg-purple-500/10'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="mt-3 pt-3 border-t border-purple-500/20 space-y-1.5">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="text-[11px] text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {summarizeFile(file)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
              Excel Templates
            </h3>
            <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full">
              {allTemplates.length} ready
            </span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
            Click any template to download
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => downloadTemplate(template.id, template.name, template.fileName)}
              disabled={isGenerating}
              className="group text-left rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3 hover:border-purple-400/50 hover:shadow-[0_10px_30px_-15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-2.5 mb-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    template.category === 'business'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : template.category === 'personal'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : template.category === 'education'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
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
                  className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    template.category === 'business'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                      : template.category === 'personal'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : template.category === 'education'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300'
                      : 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                  }`}
                >
                  {template.category}
                </span>
                <span className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Download
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MISSING FIELDS MODAL */}
      {parseResult && (
        <MissingFieldsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          formula={parseResult.formula}
          confidence={parseResult.confidence}
          missingSlots={parseResult.missingSlots}
          allSlots={parseResult.slots}
          files={files}
          suggestedPrompt={parseResult.suggestedPrompt}
          onGenerate={handleModalGenerate}
        />
      )}
    </div>
  );
}