import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Sparkles, Check } from 'lucide-react';
import type { FormulaSlot } from '../../lib/ruleEngine';
import type { ParsedFile } from '../../lib/fileReader';
import { getColumnOptions } from '../../lib/fileReader';

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formula: string;
  confidence: number;
  missingSlots: FormulaSlot[];
  allSlots: FormulaSlot[];
  files: ParsedFile[];
  suggestedPrompt: string | null;
  onGenerate: (filledSlots: FormulaSlot[]) => void;
}

export default function MissingFieldsModal({
  isOpen,
  onClose,
  formula,
  confidence,
  missingSlots,
  allSlots,
  files,
  suggestedPrompt,
  onGenerate,
}: MissingFieldsModalProps) {
  const [filledValues, setFilledValues] = useState<Record<string, string>>({});

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      missingSlots.forEach((slot) => {
        initial[slot.name] = '';
      });
      setFilledValues(initial);
    }
  }, [isOpen, missingSlots]);

  if (!isOpen) return null;

  const allColumns = getAllColumns(files);

  const handleFieldChange = (slotName: string, value: string) => {
    setFilledValues((prev) => ({ ...prev, [slotName]: value }));
  };

  const handleGenerate = () => {
    // Merge original slots with filled values
    const updatedSlots = allSlots.map((slot) => {
      if (missingSlots.find((m) => m.name === slot.name)) {
        const filled = filledValues[slot.name];
        return { ...slot, value: filled || null };
      }
      return slot;
    });

    // Check if any required fields are still empty
    const stillMissing = updatedSlots.filter((s) => s.required && !s.value);
    if (stillMissing.length > 0) {
      alert('Please fill all required fields before generating.');
      return;
    }

    onGenerate(updatedSlots);
  };

  const handleAutoFill = () => {
    // Auto-fill with best guesses
    const autoFilled: Record<string, string> = {};

    missingSlots.forEach((slot, index) => {
      // Find next available column that hasn't been used
      const usedValues = allSlots.map((s) => s.value).filter(Boolean);
      const availableColumns = allColumns.filter(
        (col) => !usedValues.some((v) => v?.includes(col.letter))
      );

      if (slot.name === 'lookupArray') {
        // Prefer first column (usually ID)
        autoFilled[slot.name] = availableColumns[0]?.fullRef || '';
      } else if (slot.name === 'returnArray') {
        // Prefer second column
        autoFilled[slot.name] = availableColumns[1]?.fullRef || availableColumns[0]?.fullRef || '';
      } else if (slot.name === 'range' || slot.name === 'sumRange') {
        // Prefer last numeric-looking column
        const lastCol = availableColumns[availableColumns.length - 1];
        autoFilled[slot.name] = lastCol?.range || '';
      } else if (slot.name === 'criteria') {
        autoFilled[slot.name] = '"Value"';
      } else if (slot.name === 'columnIndex') {
        autoFilled[slot.name] = '2';
      } else {
        autoFilled[slot.name] = availableColumns[index]?.range || '';
      }
    });

    setFilledValues(autoFilled);
  };

  const totalMissing = missingSlots.length;
  const filledCount = Object.values(filledValues).filter((v) => v).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-white dark:bg-[#0d0f14] shadow-2xl overflow-hidden"
        >
          {/* ============ HEADER ============ */}
          <div className="flex items-start gap-3 p-5 border-b border-gray-200 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Incomplete Prompt
              </h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                Please provide the missing information below
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ============ DETECTED INFO ============ */}
          <div className="px-5 py-3 bg-purple-500/[0.06] border-b border-purple-500/20">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="flex items-center gap-1 text-purple-500 dark:text-purple-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Detected: {formula}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">
                Confidence: {Math.round(confidence * 100)}%
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">
                {filledCount} / {totalMissing} filled
              </span>
            </div>
          </div>

          {/* ============ FIELDS ============ */}
          <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Show completed slots */}
            {allSlots.filter((s) => !missingSlots.find((m) => m.name === s.name)).length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                  ✓ Already Detected
                </p>
                {allSlots
                  .filter((s) => !missingSlots.find((m) => m.name === s.name))
                  .map((slot) => (
                    <div
                      key={slot.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[12px] text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {slot.label}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {slot.value}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Show missing slots */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                ⚠ Missing Information
              </p>

              {missingSlots.map((slot) => (
                <div key={slot.name} className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                    {slot.label}
                  </label>

                  {/* If columns available, show dropdown. Otherwise, text input. */}
                  {allColumns.length > 0 ? (
                    <select
                      value={filledValues[slot.name] || ''}
                      onChange={(e) => handleFieldChange(slot.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[13px] text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="">Select a column...</option>
                      {allColumns.map((col) => (
                        <option key={col.letter} value={col.fullRef}>
                          {col.letter} — {col.header}
                        </option>
                      ))}
                      {slot.name === 'criteria' && (
                        <option value='"Value"'>"Value" (custom)</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={filledValues[slot.name] || ''}
                      onChange={(e) => handleFieldChange(slot.name, e.target.value)}
                      placeholder="Enter value..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[13px] text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Suggested prompt */}
            {suggestedPrompt && (
              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  💡 Better Prompt Next Time
                </p>
                <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    {suggestedPrompt}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ============ ACTIONS ============ */}
          <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-400/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[12px] font-semibold hover:bg-purple-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill Best Guess
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={filledCount < totalMissing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${
                  filledCount === totalMissing
                    ? 'ai-purple-btn text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Generate Excel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// HELPER: Get all columns from files
// ============================================================

interface ColumnWithRef {
  letter: string;
  header: string;
  fullRef: string;   // e.g., "Sheet1!A:A"
  range: string;     // e.g., "A:A"
}

function getAllColumns(files: ParsedFile[]): ColumnWithRef[] {
  const columns: ColumnWithRef[] = [];

  files.forEach((file, fileIndex) => {
    const sheet = file.sheets[0];
    if (!sheet) return;

    const sheetPrefix = fileIndex === 0 ? '' : `'${file.fileName}'!`;

    getColumnOptions(sheet).forEach((opt) => {
      columns.push({
        letter: opt.letter,
        header: opt.header,
        fullRef: `${sheetPrefix}${opt.letter}:${opt.letter}`,
        range: `${opt.letter}:${opt.letter}`,
      });
    });
  });

  return columns;
}