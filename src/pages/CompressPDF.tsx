import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import { Minimize2, Download, Loader2, FileText } from 'lucide-react';

export default function CompressPDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; size: number; arrayBuffer: ArrayBuffer } | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (files: File[]) => {
    setError('');
    setResult(null);
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfFile({ name: file.name, size: file.size, arrayBuffer });
    } catch {
      setError('Failed to load PDF. It may be corrupted or password-protected.');
    }
  };

  /* ✅ CHANGE FILE */
  const openChangeFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileUpload(Array.from(target.files));
      }
    };
    input.click();
  };

  const compressPDF = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      let finalBytes = compressedBytes;
      if (compressionLevel === 'high') {
        const reloaded = await PDFDocument.load(compressedBytes);
        finalBytes = await reloaded.save({ useObjectStreams: true });
      }

      const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });

      setResult({
        originalSize: pdfFile.size,
        compressedSize: blob.size,
      });

      saveAs(blob, 'compressed-' + pdfFile.name);
    } catch (err: any) {
      setError('Failed to compress PDF. ' + (err.message || 'Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const activeBtn = 'p-4 rounded-xl border-2 text-left transition-all bg-gradient-to-br from-red-500 to-rose-600 border-red-400 shadow-lg shadow-red-500/30';
  const inactiveBtn = 'p-4 rounded-xl border-2 text-left transition-all bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';

  return (
    <ToolPage
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality. Processed entirely in your browser."
      icon={<Minimize2 className="w-8 h-8 text-red-500" />}
      color="red"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Minimize2 className="w-8 h-8 text-red-500" />}
        />
      ) : (
        <div>
          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{pdfFile.name}</p>
                <p className="text-xs text-gray-400">Size: {formatSize(pdfFile.size)}</p>
              </div>
            </div>

            {/* ✅ CHANGE FILE BUTTON */}
            <button
              onClick={openChangeFilePicker}
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Change file
            </button>
          </div>

          {/* COMPRESSION LEVEL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Compression Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setCompressionLevel('low')}
                className={compressionLevel === 'low' ? activeBtn : inactiveBtn}
              >
                <p className="font-bold text-sm text-white">Low Compression</p>
                <p className={`text-xs mt-1 ${compressionLevel === 'low' ? 'text-white/80' : 'text-gray-400'}`}>Best quality, smaller reduction</p>
              </button>
              <button
                onClick={() => setCompressionLevel('medium')}
                className={compressionLevel === 'medium' ? activeBtn : inactiveBtn}
              >
                <p className="font-bold text-sm text-white">Recommended</p>
                <p className={`text-xs mt-1 ${compressionLevel === 'medium' ? 'text-white/80' : 'text-gray-400'}`}>Good balance of quality and size</p>
              </button>
              <button
                onClick={() => setCompressionLevel('high')}
                className={compressionLevel === 'high' ? activeBtn : inactiveBtn}
              >
                <p className="font-bold text-sm text-white">High Compression</p>
                <p className={`text-xs mt-1 ${compressionLevel === 'high' ? 'text-white/80' : 'text-gray-400'}`}>Smallest size, may reduce quality</p>
              </button>
            </div>
          </div>

          

          {/* RESULT */}
          {result && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-400/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">Original</p>
                  <p className="font-bold text-white">{formatSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Compressed</p>
                  <p className="font-bold text-green-400">{formatSize(result.compressedSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Reduction</p>
                  <p className="font-bold text-green-400">
                    {((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ✅ ACTION — sirf Compress button, Reset hataya */}
          <button
            onClick={compressPDF}
            disabled={processing}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl transition-all ${
              processing
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01]'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Compressing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" /> Compress and Download
              </>
            )}
          </button>
        </div>
      )}
    </ToolPage>
  );
}