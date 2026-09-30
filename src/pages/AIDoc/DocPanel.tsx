import { useState } from 'react';
import {
  Sparkles,
  FileText,
  Plus,
  Loader2,
  LayoutGrid,
  Download,
  X,
  Check,
  RefreshCw,
  Edit3,
  ThumbsUp,
  Wand2,
} from 'lucide-react';
import { docTemplates, findDocTemplate, type DocTemplate } from '../../lib/docTemplates';
import { generateDocx, type UserData } from '../../lib/docEngine';
import { extractDataFromPrompt, TEMPLATE_FIELDS } from '../../lib/aiExtractor';
import {
  generateHTMLDesign,
  generateSimpleHTML,
  getDocumentTypeFromTemplate,
} from '../../lib/aiDesignGenerator';
import AIDesignRenderer from '../../components/AIDesignRenderer';

// ============================================================
// TEMPLATE GROUPS — Alternatives for each category
// ============================================================
const TEMPLATE_GROUPS: Record<string, string[]> = {
  'ats-resume': ['ats-resume', 'modern-resume', 'europass-cv', 'cover-letter'],
  'modern-resume': ['modern-resume', 'ats-resume', 'europass-cv', 'cover-letter'],
  'europass-cv': ['europass-cv', 'ats-resume', 'modern-resume', 'cover-letter'],
  'cover-letter': ['cover-letter', 'ats-resume', 'modern-resume', 'europass-cv'],
  invoice: ['invoice', 'quotation', 'purchase-order'],
  quotation: ['quotation', 'invoice', 'purchase-order'],
  'purchase-order': ['purchase-order', 'invoice', 'quotation'],
  'business-proposal': ['business-proposal', 'contract', 'letterhead'],
  contract: ['contract', 'business-proposal', 'letterhead'],
  letterhead: ['letterhead', 'business-proposal', 'contract'],
  'meeting-minutes': ['meeting-minutes', 'business-proposal', 'letterhead'],
  'report-card': ['report-card', 'certificate', 'admission-form', 'student-id'],
  certificate: ['certificate', 'report-card', 'admission-form', 'bonafide'],
  'admission-form': ['admission-form', 'report-card', 'transfer-certificate', 'bonafide'],
  'transfer-certificate': ['transfer-certificate', 'character-certificate', 'bonafide', 'admission-form'],
  'character-certificate': ['character-certificate', 'bonafide', 'transfer-certificate', 'admission-form'],
  bonafide: ['bonafide', 'character-certificate', 'transfer-certificate', 'admission-form'],
  'fee-receipt': ['fee-receipt', 'invoice', 'quotation'],
  'student-id': ['student-id', 'report-card', 'admission-form'],
  'reference-letter': ['reference-letter', 'experience-letter', 'resignation-letter'],
  'experience-letter': ['experience-letter', 'reference-letter', 'resignation-letter'],
  'resignation-letter': ['resignation-letter', 'experience-letter', 'reference-letter'],
};

export default function DocPanel() {
  const [prompt, setPrompt] = useState(
    'Draft a professional business proposal or document for my company'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // AI extraction flow
  const [matchedTemplate, setMatchedTemplate] = useState<DocTemplate | null>(null);
  const [extractedData, setExtractedData] = useState<UserData>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Post-download actions
  const [downloadedTemplate, setDownloadedTemplate] = useState<DocTemplate | null>(null);
  const [alternativeIndex, setAlternativeIndex] = useState(0);

  // AI custom design
  const [aiDesignHTML, setAiDesignHTML] = useState<string | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);

  // ============================================================
  // STEP 1: User prompt → Match template → Extract data
  // ============================================================
  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);
    setDownloadedTemplate(null);
    setAlternativeIndex(0);
    setAiDesignHTML(null);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    const template = findDocTemplate(prompt);

    if (!template) {
      setError(
        'Could not match a template. Try mentioning: invoice, CV, resume, proposal, letter, contract, report card, certificate, etc.'
      );
      return;
    }

    setMatchedTemplate(template);

    setIsExtracting(true);
    try {
      const data = await extractDataFromPrompt(prompt, template.id);

      const expectedFields = TEMPLATE_FIELDS[template.id] || [];
      const missing: string[] = [];

      expectedFields.forEach((field) => {
        if (!data || !data[field] || data[field].trim() === '') {
          missing.push(field);
        }
      });

      setExtractedData(data || {});
      setMissingFields(missing);

      if (missing.length > 0) {
        setShowForm(true);
      } else {
        await doGenerate(template, data || {});
      }
    } catch (err) {
      setExtractedData({});
      setMissingFields(TEMPLATE_FIELDS[template.id] || []);
      setShowForm(true);
    } finally {
      setIsExtracting(false);
    }
  };

  // ============================================================
  // STEP 2: Generate DOCX from template
  // ============================================================
  const doGenerate = async (
    template: DocTemplate,
    userData: UserData,
    isAlternative: boolean = false
  ) => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await generateDocx(template, userData);
      setSuccessMessage(
        `${template.name} generated successfully with your details.`
      );
      setShowForm(false);
      setDownloadedTemplate(template);
      if (!isAlternative) {
        setMatchedTemplate(template);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // STEP 3: Form submit
  // ============================================================
  const handleFormSubmit = async (formData: UserData) => {
    if (!matchedTemplate) return;
    setExtractedData(formData);
    await doGenerate(matchedTemplate, formData);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setMatchedTemplate(null);
    setExtractedData({});
    setMissingFields([]);
  };

  // ============================================================
  // TRY ANOTHER TEMPLATE (same data, next template in group)
  // ============================================================
  const handleTryAnotherDesign = async () => {
    if (!downloadedTemplate) return;

    const group = TEMPLATE_GROUPS[downloadedTemplate.id] || [downloadedTemplate.id];
    const nextIndex = (alternativeIndex + 1) % group.length;
    const nextTemplateId = group[nextIndex];

    const nextTemplate = docTemplates.find((t) => t.id === nextTemplateId);
    if (!nextTemplate) return;

    setAlternativeIndex(nextIndex);
    await doGenerate(nextTemplate, extractedData, true);
  };

  // ============================================================
  // AI CUSTOM DESIGN — AI khud design banaye
  // ============================================================
  const handleAICustomDesign = async () => {
    if (!downloadedTemplate) return;

    setIsGeneratingDesign(true);
    setError(null);

    try {
      const documentType = getDocumentTypeFromTemplate(downloadedTemplate.id);

      const html = await generateHTMLDesign({
        documentType,
        userData: extractedData,
        styleHint: 'modern, elegant, professional, well-spaced',
      });

      if (!html) {
        // Fallback — simple HTML
        const fallback = generateSimpleHTML(documentType, extractedData);
        setAiDesignHTML(fallback);
      } else {
        setAiDesignHTML(html);
      }
    } catch (err: any) {
      // Fallback — simple HTML
      const documentType = getDocumentTypeFromTemplate(downloadedTemplate.id);
      const fallback = generateSimpleHTML(documentType, extractedData);
      setAiDesignHTML(fallback);
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // ============================================================
  // REGENERATE AI DESIGN
  // ============================================================
  const handleRegenerateDesign = async () => {
    if (!downloadedTemplate) return;
    setAiDesignHTML(null);
    await handleAICustomDesign();
  };

  // ============================================================
  // EDIT DETAILS
  // ============================================================
  const handleEditDetails = () => {
    if (!downloadedTemplate) return;

    setMatchedTemplate(downloadedTemplate);
    const expectedFields = TEMPLATE_FIELDS[downloadedTemplate.id] || [];
    const missing: string[] = [];

    expectedFields.forEach((field) => {
      if (!extractedData[field] || extractedData[field].trim() === '') {
        missing.push(field);
      }
    });

    setMissingFields(missing);
    setShowForm(true);
  };

  // ============================================================
  // CONFIRM — user is happy
  // ============================================================
  const handleConfirm = () => {
    setDownloadedTemplate(null);
    setAiDesignHTML(null);
    setSuccessMessage('Great! Your document is ready. 🎉');
  };

  // ============================================================
  // DIRECT DOWNLOAD (from card click)
  // ============================================================
  const downloadTemplate = async (templateId: string) => {
    const template = docTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setDownloadedTemplate(null);

    try {
      await generateDocx(template);
      setSuccessMessage(`${template.name} (blank) generated successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // CATEGORY COLORS
  // ============================================================
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
            placeholder="Try: 'CV banao, mera naam Ali Khan, React developer' or 'Invoice for Acme Corp'"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isExtracting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg ai-purple-btn text-white text-[12px] font-bold hover:scale-[1.03] transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : isGenerating ? (
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

      {/* ERROR */}
      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-[12px] text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* SUCCESS + POST-ACTIONS */}
      {successMessage && (
        <div className="mb-4 rounded-xl overflow-hidden border border-emerald-500/30">
          <div className="px-3.5 py-2.5 bg-emerald-500/10">
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {successMessage}
            </p>
          </div>

          {downloadedTemplate && (
            <div className="px-3.5 py-3 bg-emerald-500/[0.05] border-t border-emerald-500/20">
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2.5 font-semibold">
                Happy with this? Or want more options?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 hover:scale-[1.02] transition-all"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Perfect
                </button>
                <button
                  onClick={handleTryAnotherDesign}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500 text-white text-[11px] font-bold hover:bg-purple-600 hover:scale-[1.02] transition-all disabled:opacity-60"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Template
                </button>
                <button
                  onClick={handleAICustomDesign}
                  disabled={isGeneratingDesign}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60"
                >
                  {isGeneratingDesign ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Custom
                    </>
                  )}
                </button>
                <button
                  onClick={handleEditDetails}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-400/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-500/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          )}
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
                disabled={isGenerating || isExtracting}
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
          Describe your document with details (name, email, etc.) — AI fills them automatically. After download, try another template or click <strong>AI Custom</strong> for a unique design.
        </p>
      </div>

      {/* FORM MODAL */}
      {showForm && matchedTemplate && (
        <DetailsFormModal
          template={matchedTemplate}
          extractedData={extractedData}
          missingFields={missingFields}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isGenerating={isGenerating}
        />
      )}

      {/* AI DESIGN MODAL */}
      {aiDesignHTML && downloadedTemplate && (
        <AIDesignRenderer
          html={aiDesignHTML}
          documentType={getDocumentTypeFromTemplate(downloadedTemplate.id)}
          userData={extractedData}
          template={downloadedTemplate}
          onClose={() => setAiDesignHTML(null)}
          onRegenerate={handleRegenerateDesign}
          isRegenerating={isGeneratingDesign}
        />
      )}
    </div>
  );
}

// ============================================================
// DETAILS FORM MODAL
// ============================================================
function DetailsFormModal({
  template,
  extractedData,
  missingFields,
  onSubmit,
  onCancel,
  isGenerating,
}: {
  template: DocTemplate;
  extractedData: UserData;
  missingFields: string[];
  onSubmit: (data: UserData) => void;
  onCancel: () => void;
  isGenerating: boolean;
}) {
  const allFields = TEMPLATE_FIELDS[template.id] || [];
  const [formData, setFormData] = useState<UserData>(() => {
    const initial: UserData = {};
    allFields.forEach((field) => {
      initial[field] = extractedData[field] || '';
    });
    return initial;
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const filledCount = allFields.filter(
    (field) => formData[field] && formData[field].trim() !== ''
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-white dark:bg-[#0d0f14] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start gap-3 p-5 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Fill Your Details
            </h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
              Complete the fields for your <strong>{template.name}</strong>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 bg-purple-500/[0.06] border-b border-purple-500/20 shrink-0">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="flex items-center gap-1 text-purple-500 dark:text-purple-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              {filledCount} / {allFields.length} fields filled
            </span>
            {missingFields.length > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-amber-500 dark:text-amber-400">
                  {missingFields.length} missing
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {allFields.map((field) => {
            const isMissing = missingFields.includes(field);
            const label = formatFieldLabel(field);

            return (
              <div key={field}>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  {label}
                  {isMissing && (
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                      required
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg ai-purple-btn text-white text-[12px] font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Generate Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FIELD LABEL FORMATTER
// ============================================================
function formatFieldLabel(field: string): string {
  const spaced = field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return spaced;
}