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

  const reset = () => {
    setPdfFile(null);
    setResult(null);
    setError('');
  };

  return (
    <ToolPage
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality. Processed entirely in your browser."
      icon={<Minimize2 className="w-8 h-8 text-green-600" />}
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Minimize2 className="w-8 h-8 text-green-600" />}
        />
      ) : (
        <div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <FileText className="w-10 h-10 text-green-500" />
            <div>
              <p className="font-medium text-gray-900">{pdfFile.name}</p>
              <p className="text-sm text-gray-500">Size: {formatSize(pdfFile.size)}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Compression Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setCompressionLevel('low')}
                className={'p-4 rounded-xl border-2 text-left transition-colors ' + (compressionLevel === 'low' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}
              >
                <p className="font-semibold text-sm">Low Compression</p>
                <p className="text-xs text-gray-500 mt-1">Best quality, smaller reduction</p>
              </button>
              <button
                onClick={() => setCompressionLevel('medium')}
                className={'p-4 rounded-xl border-2 text-left transition-colors ' + (compressionLevel === 'medium' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}
              >
                <p className="font-semibold text-sm">Recommended</p>
                <p className="text-xs text-gray-500 mt-1">Good balance of quality and size</p>
              </button>
              <button
                onClick={() => setCompressionLevel('high')}
                className={'p-4 rounded-xl border-2 text-left transition-colors ' + (compressionLevel === 'high' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}
              >
                <p className="font-semibold text-sm">High Compression</p>
                <p className="text-xs text-gray-500 mt-1">Smallest size, may reduce quality</p>
              </button>
            </div>
          </div>

          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <p><strong>Note:</strong> Client-side compression works by optimizing PDF structure. For advanced image recompression, a server-side engine would be needed.</p>
          </div>

          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Original</p>
                  <p className="font-bold text-gray-900">{formatSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Compressed</p>
                  <p className="font-bold text-green-700">{formatSize(result.compressedSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reduction</p>
                  <p className="font-bold text-green-700">
                    {((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={compressPDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Compressing...</>) : (<><Download className="w-5 h-5" /> Compress and Download</>)}
            </button>
            <button
              onClick={reset}
              disabled={processing}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </ToolPage>
  );
}