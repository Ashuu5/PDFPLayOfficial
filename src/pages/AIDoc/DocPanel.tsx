import { useState, useRef } from 'react';
import {
  Sparkles,
  FileText,
  Loader2,
  LayoutGrid,
  Download,
  Upload,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Plus,
  FileDown,
  Wand2,
} from 'lucide-react';
import { docTemplates, findDocTemplate, type DocTemplate } from '../../lib/docTemplates';
import { generateDocx, type UserData } from '../../lib/docEngine';
import { extractDataFromPrompt, TEMPLATE_FIELDS } from '../../lib/aiExtractor';
import { parseDocFile, type ParsedDoc } from '../../lib/docFileReader';
import {
  generateHTMLDesign,
  generateSimpleHTML,
  getDocumentTypeFromTemplate,
} from '../../lib/aiDesignGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function DocPanel() {
  const [prompt, setPrompt] = useState(
    'CV banao — Ali Khan, React Developer, ali@email.com, Karachi, 5 years experience'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<ParsedDoc[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // After generation
  const [generatedTemplate, setGeneratedTemplate] = useState<DocTemplate | null>(null);
  const [generatedData, setGeneratedData] = useState<UserData>({});
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState<string | null>(null);

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
  // PARSE PROMPT TO STRUCTURED DATA (for AI fallback)
  // ============================================================
  const parsePromptToData = async (
    userPrompt: string,
    documentType: string
  ): Promise<UserData> => {
    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt: `Extract structured data from this request for a ${documentType}.

Return ONLY valid JSON with these fields:
{
  "title": "the document title (e.g. 'Result Card', 'Invoice', 'Certificate')",
  "recipientName": "the person's name",
  "fatherName": "father's name if mentioned",
  "schoolName": "school/company name if mentioned",
  "className": "class or grade if mentioned",
  "rollNumber": "roll number if mentioned",
  "marks": "marks or percentage if mentioned",
  "subject": "subjects if mentioned",
  "date": "today's date in format like January 15, 2025",
  "details": "any other important details"
}

Use empty string "" for fields not mentioned. Return ONLY JSON.`,
          model: 'openai/gpt-oss-120b',
          maxTokens: 500,
        }),
      });

      if (!response.ok) return { title: documentType, date: todayString() };

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return { title: documentType, date: todayString() };

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { title: documentType, date: todayString() };

      return JSON.parse(jsonMatch[0]);
    } catch {
      return { title: documentType, date: todayString() };
    }
  };

  const todayString = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ============================================================
  // EXTRACT DOCUMENT TYPE FROM PROMPT
  // ============================================================
  const extractDocumentTypeFromPrompt = (p: string): string => {
    const lower = p.toLowerCase();
    if (lower.includes('result')) return 'result card';
    if (lower.includes('marks')) return 'marks sheet';
    if (lower.includes('fee receipt') || lower.includes('fee voucher')) return 'fee receipt';
    if (lower.includes('receipt')) return 'receipt';
    if (lower.includes('invitation')) return 'invitation card';
    if (lower.includes('menu')) return 'menu';
    if (lower.includes('flyer')) return 'flyer';
    if (lower.includes('poster')) return 'poster';
    if (lower.includes('certificate')) return 'certificate';
    if (lower.includes('character')) return 'character certificate';
    if (lower.includes('bonafide')) return 'bonafide certificate';
    if (lower.includes('transfer')) return 'transfer certificate';
    if (lower.includes('admission')) return 'admission form';
    if (lower.includes('id card')) return 'id card';
    if (lower.includes('letter')) return 'letter';
    if (lower.includes('notice')) return 'notice';
    if (lower.includes('circular')) return 'circular';
    if (lower.includes('report')) return 'report';
    if (lower.includes('form')) return 'form';
    if (lower.includes('agreement') || lower.includes('contract')) return 'agreement';
    if (lower.includes('proposal')) return 'proposal';
    if (lower.includes('cv') || lower.includes('resume')) return 'resume';
    if (lower.includes('invoice')) return 'invoice';
    return 'document';
  };

  // ============================================================
  // MAIN GENERATE
  // ============================================================
  const handleGenerate = async () => {
    setError(null);
    setSuccessMessage(null);
    setGeneratedTemplate(null);
    setGeneratedData({});
    setIsAIGenerated(false);
    setGeneratedHTML(null);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);

    try {
      // Include uploaded file text as context
      let finalPrompt = prompt;

      const docTexts = uploadedFiles
        .filter((f) => f.fileType === 'document' && f.textContent.trim())
        .map((f) => `--- From: ${f.fileName} ---\n${f.textContent}`)
        .join('\n\n');

      if (docTexts) {
        finalPrompt = `${prompt}\n\nAdditional context:\n${docTexts}`;
      }

      // Try to match a template
      const template = findDocTemplate(prompt);

      if (template) {
        // ✅ Template matched
        const data = await extractDataFromPrompt(finalPrompt, template.id);
        const userData: UserData = { ...(data || {}) };

        const firstImage = uploadedFiles.find((f) => f.fileType === 'image');
        if (firstImage?.imageDataUrl) {
          userData.photo = firstImage.imageDataUrl;
        }

        setGeneratedTemplate(template);
        setGeneratedData(userData);
        setIsAIGenerated(false);
        setSuccessMessage(
          `✅ ${template.name} is ready! Choose your download format below.`
        );
      } else {
        // ❌ No template — AI generates custom design
        setSuccessMessage('✨ AI is creating a custom design for you...');

        const documentType = extractDocumentTypeFromPrompt(prompt);

        // Parse prompt to structured data first
        const parsedData = await parsePromptToData(prompt, documentType);

        // Try AI HTML generation
        let html: string | null = null;
        try {
          html = await generateHTMLDesign({
            documentType,
            userData: parsedData,
            styleHint: 'modern, professional, elegant',
          });
        } catch (err) {
          console.error('AI generation failed:', err);
        }

        // Fallback if AI failed
        if (!html) {
          html = generateSimpleHTML(documentType, parsedData);
        }

        const customTemplate: DocTemplate = {
          id: 'custom-ai',
          name: documentType.charAt(0).toUpperCase() + documentType.slice(1),
          category: 'business',
          description: 'AI-generated custom document',
          keywords: [],
          fileName: `${documentType.replace(/\s+/g, '_')}.docx`,
          sections: [],
        };

        setGeneratedTemplate(customTemplate);
        setGeneratedData(parsedData);
        setIsAIGenerated(true);
        setGeneratedHTML(html);
        setSuccessMessage(
          '✅ Your custom AI document is ready! Choose PDF or DOCX below.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // DOWNLOAD DOCX
  // ============================================================
  const handleDownloadDocx = async () => {
    if (!generatedTemplate) return;
    try {
      if (isAIGenerated) {
        // Simple DOCX from data
        const simpleTemplate: DocTemplate = {
          id: 'custom',
          name: generatedTemplate.name,
          category: 'business',
          description: 'AI-generated',
          keywords: [],
          fileName: generatedTemplate.fileName,
          sections: [
            { type: 'heading', text: `{{title}}`, alignment: 'center', size: 24, color: '#6D28D9' },
            { type: 'spacer' },
            { type: 'divider' },
            { type: 'spacer' },
            { type: 'paragraph', text: '{{recipientName}}', bold: true, size: 14 },
            { type: 'spacer' },
            { type: 'paragraph', text: 'School / Organization: {{schoolName}}' },
            { type: 'paragraph', text: 'Class / Grade: {{className}}' },
            { type: 'paragraph', text: 'Roll Number: {{rollNumber}}' },
            { type: 'paragraph', text: 'Marks / Percentage: {{marks}}' },
            { type: 'paragraph', text: 'Subject: {{subject}}' },
            { type: 'spacer' },
            { type: 'paragraph', text: '{{details}}' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'paragraph', text: 'Date: {{date}}', alignment: 'right' },
            { type: 'spacer' },
            { type: 'paragraph', text: 'Authorized Signature: _______________________', alignment: 'right' },
          ],
        };
        await generateDocx(simpleTemplate, {
          ...generatedData,
          title: generatedTemplate.name,
        });
      } else {
        await generateDocx(generatedTemplate, generatedData);
      }
      setSuccessMessage('✅ DOCX downloaded.');
    } catch (err: any) {
      setError(err.message || 'Failed to download DOCX');
    }
  };

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================
  const handleDownloadPDF = async () => {
    if (!generatedTemplate) return;

    setIsGeneratingPDF(true);
    setError(null);

    try {
      let html: string;

      if (isAIGenerated && generatedHTML) {
        html = generatedHTML;
      } else {
        // Generate from AI HTML
        const documentType = getDocumentTypeFromTemplate(generatedTemplate.id);
        const aiHtml = await generateHTMLDesign({
          documentType,
          userData: generatedData,
          styleHint: 'modern, elegant, professional, well-spaced',
        });
        html = aiHtml || generateSimpleHTML(documentType, generatedData);
      }

      // Render in hidden container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.minHeight = '297mm';
      container.style.background = '#ffffff';
      container.style.fontFamily = 'Arial, Helvetica, sans-serif';
      container.style.padding = '0';
      container.innerHTML = html;
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const canvas = await html2canvas(container, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${generatedTemplate.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      setSuccessMessage('✅ PDF downloaded.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ============================================================
  // DIRECT DOWNLOAD (blank template)
  // ============================================================
  const downloadTemplate = async (templateId: string) => {
    const template = docTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedTemplate(null);

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
      <div className="mb-4">
        <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3.5">
          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 mb-2.5 shrink-0" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="flex-1 bg-transparent text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none outline-none leading-snug"
            placeholder="Describe any document — invoice, CV, result card, letter, menu... AI handles everything"
          />

          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0 ${
              showUpload
                ? 'bg-purple-500 text-white'
                : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-400/30'
            }`}
            title="Upload file"
          >
            <Plus className={`w-4 h-4 transition-transform ${showUpload ? 'rotate-45' : ''}`} />
          </button>

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
              'Generate'
            )}
          </button>
        </div>

        {showUpload && (
          <div className="mt-2 rounded-xl border-2 border-dashed border-purple-400/40 bg-purple-50/50 dark:bg-purple-500/[0.03] p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.pdf,.txt,image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white">
                  Upload CV, document, or photo
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Drag & drop .docx, .pdf, .jpg, .png · or browse
                </p>
              </div>
            </div>

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
                      onClick={removeFile.bind(null, i)}
                      className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-[12px] text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* SUCCESS PANEL */}
      {successMessage && generatedTemplate && (
        <div className="mb-5 rounded-xl overflow-hidden border border-emerald-500/30">
          <div className="px-3.5 py-2.5 bg-emerald-500/10">
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </p>
          </div>

          <div className="px-3.5 py-4 bg-emerald-500/[0.05] border-t border-emerald-500/20">
            {isAIGenerated && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Wand2 className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  AI-generated custom design (no matching template)
                </p>
              </div>
            )}

            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-3">
              Choose Your Format
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownloadDocx}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[12px] font-bold hover:scale-[1.02] transition-all shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)]"
              >
                <FileDown className="w-4 h-4" />
                Download DOCX
                <span className="text-[9px] opacity-80">(Editable)</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[12px] font-bold hover:scale-[1.02] transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] disabled:opacity-60"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                    <span className="text-[9px] opacity-80">(Perfect Design)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2.5 text-center">
              DOCX = Editable in Word · PDF = Perfect design
            </p>
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
            Click to download blank version
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
          Describe any document. If it matches a template, we'll use that. If not, AI will create a custom design for you.
        </p>
      </div>
    </div>
  );
}