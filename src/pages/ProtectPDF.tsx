import { useState } from 'react';
import { PDFDocument } from 'pdf-lib-plus-encrypt';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Lock, Loader2, Shield, CheckCircle,
  Eye, EyeOff, Key, AlertCircle, Unlock, Download
} from 'lucide-react';

export default function ProtectPDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Test load
      await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfFile({ name: file.name, arrayBuffer });
    } catch {
      setError('Failed to load PDF. Please try another file.');
    }
  };

  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 3, label: 'Good', color: 'bg-blue-500' };
    return { level: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  /* ============ PROTECT ============ */
  const protectPDF = async () => {
    if (!pdfFile) return;

    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, {
        ignoreEncryption: true,
      });

      // ✅ YE HAI SAHI TARIKA
      // @ts-ignore
      pdf.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: false,
          documentAssembly: false,
        },
      });

      const bytes = await pdf.save();

      const blob = new Blob([bytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      saveAs(blob, `protected-${pdfFile.name}`);

      setSuccess('PDF protected! File downloaded. Open it — it will ask for password.');
    } catch (err: any) {
      console.error('Protect error:', err);
      setError('Failed to protect PDF. ' + (err.message || 'Try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <ToolPage
      title="Protect PDF"
      description="Add real password protection to your PDF."
      icon={<Lock className="w-8 h-8 text-red-500" />}
      color="red"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Lock className="w-8 h-8 text-red-500" />}
        />
      ) : (
        <div className="max-w-2xl mx-auto">

          {/* FILE INFO */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-400" />
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

          {/* PASSWORD */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-bold text-white">Set your password</h3>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Strength</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      strength.level === 1 ? 'text-red-400' :
                      strength.level === 2 ? 'text-yellow-400' :
                      strength.level === 3 ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= strength.level ? strength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {confirmPassword && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/20 flex gap-3">
              <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-100 leading-relaxed">
                <p className="font-bold mb-1 text-red-200">🔒 Real password protection</p>
                <p>
                  File will ask for password when opened. <strong>Don't forget it</strong> — no recovery.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-300 mb-1">Success!</p>
                <p className="text-xs text-green-200/80">{success}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={protectPDF}
              disabled={processing || !password || password !== confirmPassword}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Encrypting...</>
              ) : (
                <><Lock className="w-5 h-5" /> Protect & Download</>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <Unlock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <strong className="text-gray-400">Tip:</strong> Strong passwords = letters + numbers + symbols.
            </p>
          </div>

        </div>
      )}
    </ToolPage>
  );
}