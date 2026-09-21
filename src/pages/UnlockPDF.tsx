import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Unlock, Loader2, Shield, CheckCircle,
  Eye, EyeOff, Key, AlertCircle, Lock
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function UnlockPDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer } | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile({ name: file.name, arrayBuffer });
    } catch {
      setError('Failed to read file.');
    }
  };

  const unlockPDF = async () => {
    if (!pdfFile) return;
    if (!password.trim()) {
      setError('Please enter the PDF password.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgress('Opening PDF...');

    try {
      // Load encrypted PDF with password using pdfjs
      const loadingTask = pdfjsLib.getDocument({
        data: pdfFile.arrayBuffer.slice(0),
        password: password,
      });

      const pdfjsDoc = await loadingTask.promise;

      setProgress(`Decrypting ${pdfjsDoc.numPages} pages...`);

      // Create new unencrypted PDF
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        setProgress(`Processing page ${i} / ${pdfjsDoc.numPages}...`);

        const page = await pdfjsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const pngBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        const pngBytes = await pngBlob.arrayBuffer();
        const pngImage = await newPdf.embedPng(pngBytes);

        const origViewport = page.getViewport({ scale: 1 });
        const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      setProgress('Saving unlocked PDF...');
      const bytes = await newPdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `unlocked-${pdfFile.name}`);

      setProgress('');
      setSuccess('PDF unlocked successfully! Password removed. Check your downloads.');
    } catch (err: any) {
      console.error('Unlock error:', err);
      setProgress('');
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('password') || msg.includes('invalid') || msg.includes('encrypted')) {
        setError('❌ Incorrect password. Please check and try again.');
      } else {
        setError('Failed to unlock PDF. ' + (err.message || 'Try again.'));
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPassword('');
    setError('');
    setSuccess('');
    setProgress('');
  };

  return (
    <ToolPage
      title="Unlock PDF"
      description="Remove password from a PDF — enter the password you already have."
      icon={<Unlock className="w-8 h-8 text-green-500" />}
      color="green"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a password-protected PDF here"
          subtitle="or click to browse"
          icon={<Unlock className="w-8 h-8 text-green-500" />}
        />
      ) : (
        <div className="max-w-2xl mx-auto">

          {/* FILE INFO */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-400/40 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-green-400" />
              </div>
              <p className="font-semibold text-white text-sm truncate" title={pdfFile.name}>
                {pdfFile.name}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              Change file
            </button>
          </div>

          {/* PASSWORD INPUT */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-5 h-5 text-green-400" />
              <h3 className="text-base font-bold text-white">Enter PDF password</h3>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && unlockPDF()}
                  placeholder="Enter the PDF password..."
                  className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-400/50 focus:bg-white/10 transition-all"
                  autoComplete="off"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/20 flex gap-3">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-100 leading-relaxed">
                <p className="font-bold mb-1 text-green-200">
                  🔓 Local decryption
                </p>
                <p>
                  Password stays in your browser. Nothing is uploaded. File processed completely offline.
                </p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-sm text-green-200 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-300 mb-1">Success!</p>
                <p className="text-xs text-green-200/80">{success}</p>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={unlockPDF}
              disabled={processing || !password}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-base rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" /> Unlock & Download
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

          {/* Note */}
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-100/80 leading-relaxed">
              <strong className="text-amber-200">📝 Note:</strong> Unlocked PDF will be <strong>image-based</strong> (pages converted to images). Text won't be selectable. But password will be fully removed. Only unlock PDFs you own.
            </p>
          </div>

        </div>
      )}
    </ToolPage>
  );
}