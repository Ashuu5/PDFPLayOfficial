// ============================================================
// RULE ENGINE — Prompt ko padho aur formula detect karo
// ============================================================

export type FormulaType =
  | 'XLOOKUP'
  | 'VLOOKUP'
  | 'HLOOKUP'
  | 'SUM'
  | 'SUMIF'
  | 'AVERAGE'
  | 'COUNT'
  | 'COUNTIF'
  | 'IF'
  | 'CONCATENATE'
  | 'UNKNOWN';

export interface FormulaSlot {
  name: string;
  label: string;
  value: string | null;
  required: boolean;
}

export interface ParseResult {
  formula: FormulaType;
  confidence: number; // 0 to 1
  slots: FormulaSlot[];
  missingSlots: FormulaSlot[];
  warnings: string[];
  suggestedPrompt: string | null;
  userLanguage: 'en' | 'ur' | 'mixed';
}

// ============================================================
// KEYWORD DETECTION
// ============================================================

const FORMULA_KEYWORDS: Record<FormulaType, string[]> = {
  XLOOKUP: [
    'xlookup', 'x lookup', 'x-lookup',
    'match karo', 'match kro', 'match',
    'dhoondho', 'dhondo', 'dhoond',
    'laao', 'lao', 'lay aao',
    'find and return', 'lookup and return',
    'se match', 'se compare',
  ],
  VLOOKUP: [
    'vlookup', 'v lookup', 'v-lookup',
    'vertical lookup', 'column match',
  ],
  HLOOKUP: [
    'hlookup', 'h lookup', 'h-lookup',
    'horizontal lookup', 'row match',
  ],
  SUM: [
    'sum', 'total', 'total karo', 'jama karo', 'jama',
    'add karo', 'add kro', 'add all',
    'sum karo', 'sum kro',
    'grand total', 'overall total',
  ],
  SUMIF: [
    'sumif', 'sum if',
    'conditional sum', 'condition ke saath sum',
    'agar wale ka total',
    'specific rows ka total',
  ],
  AVERAGE: [
    'average', 'mean', 'ausat', 'ausat nikaalo',
    'average karo', 'average nikaalo',
  ],
  COUNT: [
    'count', 'count karo', 'ginti', 'ginti karo',
    'kitne', 'kitni', 'how many',
    'number of rows', 'total rows',
  ],
  COUNTIF: [
    'countif', 'count if',
    'conditional count', 'condition wali ginti',
  ],
  IF: [
    'if', 'agar', 'agar toh', 'agar warna',
    'condition', 'condition lagao',
    'if else', 'if error', 'iferror',
  ],
  CONCATENATE: [
    'concatenate', 'concat', 'merge text',
    'milao', 'jodo', 'jod do',
    'combine text', 'text merge',
  ],
  UNKNOWN: [],
};

// ============================================================
// FILE REFERENCE DETECTION
// ============================================================

const FILE_PATTERNS = [
  /file\s*(\d+)/gi,
  /file\s*([a-z0-9_\-]+)/gi,
  /first\s+file/gi,
  /second\s+file/gi,
  /pehli\s+file/gi,
  /doosri\s+file/gi,
];

const COLUMN_PATTERNS = [
  /column\s+([a-z])/gi,
  /\b([a-z])\s+column/gi,
  /col\s+([a-z])/gi,
  /([a-z])\s*col\b/gi,
];

const CELL_PATTERNS = [
  /\b([a-z])(\d+)\b/gi,
];

// ============================================================
// LANGUAGE DETECTION
// ============================================================

function detectLanguage(prompt: string): 'en' | 'ur' | 'mixed' {
  const urduWords = [
    'karo', 'kro', 'karna', 'karna hai', 'chahiye', 'chahiyay',
    'dhoondho', 'dhondo', 'laao', 'lao', 'jama', 'jama karo',
    'ausat', 'ginti', 'milao', 'jodo', 'agar', 'se', 'ko', 'ka', 'ki', 'ke',
    'mein', 'hai', 'hain', 'yeh', 'woh', 'kya', 'kaise',
  ];

  const lowerPrompt = prompt.toLowerCase();
  const urduMatches = urduWords.filter((w) => lowerPrompt.includes(w)).length;
  const englishMatches = (lowerPrompt.match(/\b(sum|total|average|match|lookup|count|if|column|file|find|return)\b/g) || []).length;

  if (urduMatches > 0 && englishMatches > 0) return 'mixed';
  if (urduMatches > englishMatches) return 'ur';
  return 'en';
}

// ============================================================
// FORMULA DETECTION
// ============================================================

function detectFormula(prompt: string): { formula: FormulaType; confidence: number } {
  const lowerPrompt = prompt.toLowerCase();

  const scores: Record<FormulaType, number> = {
    XLOOKUP: 0,
    VLOOKUP: 0,
    HLOOKUP: 0,
    SUM: 0,
    SUMIF: 0,
    AVERAGE: 0,
    COUNT: 0,
    COUNTIF: 0,
    IF: 0,
    CONCATENATE: 0,
    UNKNOWN: 0,
  };

  // Count keyword matches
  (Object.keys(FORMULA_KEYWORDS) as FormulaType[]).forEach((formula) => {
    FORMULA_KEYWORDS[formula].forEach((keyword) => {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        // Longer keywords get higher score
        scores[formula] += keyword.length;
      }
    });
  });

  // Find highest score
  let bestFormula: FormulaType = 'UNKNOWN';
  let bestScore = 0;
  (Object.keys(scores) as FormulaType[]).forEach((formula) => {
    if (scores[formula] > bestScore) {
      bestScore = scores[formula];
      bestFormula = formula;
    }
  });

  // Calculate confidence (max possible is around 100)
  const confidence = Math.min(bestScore / 30, 1);

  return { formula: bestFormula, confidence };
}

// ============================================================
// EXTRACT COLUMNS & FILES
// ============================================================

function extractColumns(prompt: string): string[] {
  const columns: string[] = [];

  COLUMN_PATTERNS.forEach((pattern) => {
    const matches = prompt.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) columns.push(match[1].toUpperCase());
    }
  });

  CELL_PATTERNS.forEach((pattern) => {
    const matches = prompt.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) columns.push(match[1].toUpperCase());
    }
  });

  return Array.from(new Set(columns));
}

function extractCells(prompt: string): string[] {
  const cells: string[] = [];
  CELL_PATTERNS.forEach((pattern) => {
    const matches = prompt.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2]) cells.push(match[1].toUpperCase() + match[2]);
    }
  });
  return Array.from(new Set(cells));
}

// ============================================================
// BUILD SLOTS
// ============================================================

function buildSlots(formula: FormulaType, prompt: string, columns: string[]): FormulaSlot[] {
  const cells = extractCells(prompt);

  switch (formula) {
    case 'XLOOKUP':
      return [
        {
          name: 'lookupValue',
          label: 'Lookup Value (what to find)',
          value: cells[0] ? `File1!${cells[0]}` : null,
          required: true,
        },
        {
          name: 'lookupArray',
          label: 'Lookup Column in File 2 (where to search)',
          value: columns[1] ? `File2!${columns[1]}:${columns[1]}` : null,
          required: true,
        },
        {
          name: 'returnArray',
          label: 'Return Column from File 2 (what to bring back)',
          value: columns[2] ? `File2!${columns[2]}:${columns[2]}` : null,
          required: true,
        },
      ];

    case 'VLOOKUP':
      return [
        {
          name: 'lookupValue',
          label: 'Lookup Value (what to find)',
          value: cells[0] ? `File1!${cells[0]}` : null,
          required: true,
        },
        {
          name: 'tableArray',
          label: 'Table Array in File 2',
          value: columns[1] ? `File2!${columns[1]}:${columns[columns.length - 1] || 'Z'}` : null,
          required: true,
        },
        {
          name: 'columnIndex',
          label: 'Column Index Number (which column to return)',
          value: null,
          required: true,
        },
      ];

    case 'SUM':
      return [
        {
          name: 'range',
          label: 'Column to Sum',
          value: columns[0] ? `${columns[0]}:${columns[0]}` : null,
          required: true,
        },
      ];

    case 'SUMIF':
      return [
        {
          name: 'range',
          label: 'Column to Check (criteria column)',
          value: columns[0] ? `${columns[0]}:${columns[0]}` : null,
          required: true,
        },
        {
          name: 'criteria',
          label: 'Criteria (what value to match)',
          value: null,
          required: true,
        },
        {
          name: 'sumRange',
          label: 'Column to Sum',
          value: columns[1] ? `${columns[1]}:${columns[1]}` : null,
          required: true,
        },
      ];

    case 'AVERAGE':
      return [
        {
          name: 'range',
          label: 'Column to Average',
          value: columns[0] ? `${columns[0]}:${columns[0]}` : null,
          required: true,
        },
      ];

    case 'COUNT':
      return [
        {
          name: 'range',
          label: 'Column to Count',
          value: columns[0] ? `${columns[0]}:${columns[0]}` : null,
          required: true,
        },
      ];

    case 'COUNTIF':
      return [
        {
          name: 'range',
          label: 'Column to Check',
          value: columns[0] ? `${columns[0]}:${columns[0]}` : null,
          required: true,
        },
        {
          name: 'criteria',
          label: 'Criteria',
          value: null,
          required: true,
        },
      ];

    case 'IF':
      return [
        {
          name: 'condition',
          label: 'Condition (e.g., A2 > 40)',
          value: null,
          required: true,
        },
        {
          name: 'trueValue',
          label: 'Value if TRUE',
          value: null,
          required: true,
        },
        {
          name: 'falseValue',
          label: 'Value if FALSE',
          value: null,
          required: true,
        },
      ];

    case 'CONCATENATE':
      return [
        {
          name: 'columns',
          label: 'Columns to Combine',
          value: columns.length > 0 ? columns.join(', ') : null,
          required: true,
        },
      ];

    default:
      return [];
  }
}

// ============================================================
// MAIN PARSE FUNCTION
// ============================================================

export function parsePrompt(prompt: string): ParseResult {
  const userLanguage = detectLanguage(prompt);
  const { formula, confidence } = detectFormula(prompt);
  const columns = extractColumns(prompt);
  const slots = buildSlots(formula, prompt, columns);
  const missingSlots = slots.filter((s) => s.required && !s.value);

  const warnings: string[] = [];

  if (formula === 'UNKNOWN') {
    warnings.push(
      'Could not detect a formula from your prompt. Please mention what you want to do (e.g., match, sum, average, count).'
    );
  }

  if (confidence < 0.5 && formula !== 'UNKNOWN') {
    warnings.push(
      `Low confidence (${Math.round(confidence * 100)}%) in detecting the formula. Please verify.`
    );
  }

  if (missingSlots.length > 0) {
    warnings.push(
      `${missingSlots.length} required field(s) are missing. Please provide them below, or use Auto-fill.`
    );
  }

  // Build suggested prompt
  let suggestedPrompt: string | null = null;
  if (missingSlots.length > 0 && formula !== 'UNKNOWN') {
    const exampleValues: Record<string, string> = {
      lookupValue: 'A2',
      lookupArray: 'Sheet2 column A',
      returnArray: 'Sheet2 column D',
      range: 'column D',
      criteria: '"Food"',
      sumRange: 'column C',
      condition: 'A2 > 40',
      trueValue: '"Pass"',
      falseValue: '"Fail"',
    };

    const parts = missingSlots.map((s) => {
      const ex = exampleValues[s.name] || '...';
      return `${s.label.replace(/\(.*?\)/g, '').trim()}: ${ex}`;
    });

    suggestedPrompt = `Try a prompt like: "${parts.join(', ')}"`;
  }

  return {
    formula,
    confidence,
    slots,
    missingSlots,
    warnings,
    suggestedPrompt,
    userLanguage,
  };
}