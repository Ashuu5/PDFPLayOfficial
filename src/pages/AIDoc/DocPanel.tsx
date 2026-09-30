import { useState, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Plus,
  Loader2,
  LayoutGrid,
  Download,
  Upload,
  X,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';
import { docTemplates, findDocTemplate } from '../../lib/docTemplates';
import { generateDocx, type UserData } from '../../lib/docEngine';
import { extractDataFromPrompt, TEMPLATE_FIELDS } from '../../lib/aiExtractor';
import { parseDocFile, type ParsedDoc } from '../../lib/docFileReader';
import AIDesignRenderer from '../../components/AIDesignRenderer';
import {
  generateHTMLDesign,
  generateSimpleHTML,
  getDocumentTypeFromTemplate,
} from '../../lib/aiDesignGenerator';

export default function DocPanel() {
  const [prompt, setPrompt] = useState(
    'Draft a professional business proposal or document for my company'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<ParsedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI design flow
  const [aiDesignHTML, setAiDesignHTML] = useState<string | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData>({});

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    setError(null);

    try {
      const parsed: ParsedDoc[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await parseDocFile(files[i]);
        parsed.push(result);
      }
      setUploadedFiles((prev) => [...prev, ...parsed]);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // GENERATE
  // ============================================================
  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);
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

    setIsGenerating(true);

    try {
      // Build final prompt — include uploaded file text as context
      let finalPrompt = prompt;

      const docTexts = uploadedFiles
        .filter((f) => f.fileType === 'document' && f.textContent.trim())
        .map((f) => `--- From file: ${f.fileName} ---\n${f.textContent}`)
        .join('\n\n');

      if (docTexts) {
        finalPrompt = `${prompt}\n\nAdditional context from uploaded files:\n${docTexts}`;
      }

      // Extract data via AI
      const data = await extractDataFromPrompt(finalPrompt, template.id);

      // Merge user data + first image (if any)
      const userData: UserData = { ...(data || {}) };

      const firstImage = uploadedFiles.find((f) => f.fileType === 'image');
      if (firstImage?.imageDataUrl) {
        userData.photo = firstImage.imageDataUrl;
      }

      // Save for later use (AI Custom design)
      setCurrentTemplate(template.id);
      setCurrentUserData(userData);

      // Generate DOCX
      await generateDocx(template, userData);
      setSuccessMessage(`${template.name} generated successfully. Check your downloads.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // DIRECT DOWNLOAD (card click — blank)
  // ============================================================
  const downloadTemplate = async (templateId: string) => {
    const template = docTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await generateDocx(template);
      setSuccessMessage(`${template.name} (blank) downloaded.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // AI CUSTOM DESIGN — unique AI-generated layout
  // ============================================================
  const handleAICustomDesign = async () => {
    if (!currentTemplate || !currentUserData) return;

    setIsGeneratingDesign(true);
    setError(null);

    try {
      const documentType = getDocumentTypeFromTemplate(currentTemplate);

      const html = await generateHTMLDesign({
        documentType,
        userData: currentUserData,
        styleHint: 'modern, elegant, professional, well-spaced',
      });

      if (!html) {
        setAiDesignHTML(generateSimpleHTML(documentType, currentUserData));
      } else {
        setAiDesignHTML(html);
      }
    } catch {
      const documentType = getDocumentTypeFromTemplate(currentTemplate);
      setAiDesignHTML(generateSimpleHTML(documentType, currentUserData));
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleRegenerateDesign = async () => {
    setAiDesignHTML(null);
    await handleAICustomDesign();
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-purple-500 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Doc</h2>
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
            placeholder="Try: 'CV banao — Ali Khan, React Developer, ali@email.com, Karachi, 5 years experience'"
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
                <Plus className="w-3.5 h-3.5" />
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
          accept=".docx,.doc,.pdf,.txt,image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
              Upload your CV, documents, or photo
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Drag & drop .docx, .pdf, .jpg, .png here · or{' '}
              <span className="text-purple-500 dark:text-purple-400 underline">
                Browse files
              </span>
            </p>
          </div>
        </div>

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-purple-500/20 space-y-1.5">
            {uploadedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                {file.fileType === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                ) : (
                  <FileIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                )}
                <span className="text-[11px] text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {file.fileName}
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

      {/* ERROR */}
      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-[12px] text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* SUCCESS + AI CUSTOM BUTTON */}
      {successMessage && (
        <div className="mb-4 rounded-xl overflow-hidden border border-emerald-500/30">
          <div className="px-3.5 py-2.5 bg-emerald-500/10">
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              ✅ {successMessage}
            </p>
          </div>
          <div className="px-3.5 py-3 bg-emerald-500/[0.05] border-t border-emerald-500/20">
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2.5">
              Want a <strong>unique AI-designed version</strong>? Or try another template from below.
            </p>
            <button
              onClick={handleAICustomDesign}
              disabled={isGeneratingDesign}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {isGeneratingDesign ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  AI is designing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Custom Design
                </>
              )}
            </button>
          </div>
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
          Add your details in the prompt — AI fills them automatically. Upload your old CV or a photo for AI to use. After download, you can request an AI custom design.
        </p>
      </div>

      {/* AI DESIGN MODAL */}
      {aiDesignHTML && currentTemplate && (
        <AIDesignRenderer
          html={aiDesignHTML}
          documentType={getDocumentTypeFromTemplate(currentTemplate)}
          userData={currentUserData}
          template={docTemplates.find((t) => t.id === currentTemplate)!}
          onClose={() => setAiDesignHTML(null)}
          onRegenerate={handleRegenerateDesign}
          isRegenerating={isGeneratingDesign}
        />
      )}
    </div>
  );
}