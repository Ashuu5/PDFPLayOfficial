// ============================================================
// HOME AI ASSISTANT — DeepSeek-style interface
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ArrowRight,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import {
  findToolMatch,
  askAI,
  type ChatMessage,
} from '../lib/aiService';

// ============================================================
// SUGGESTIONS POOL — rotates every 2 seconds
// ============================================================
const SUGGESTIONS_POOL = [
  'Merge PDF files',
  'Split PDF into pages',
  'Compress PDF file size',
  'PDF to Word conversion',
  'Word to PDF conversion',
  'Rotate PDF pages',
  'Protect PDF with password',
  'Unlock a PDF file',
  'Create an Excel report',
  'Make me a CV',
  'Generate an invoice',
  'Create a business proposal',
  'Make a report card',
  'Generate ATS resume',
  'Make a cover letter',
  'Create a contract',
  'JPG to PDF',
  'PDF to JPG',
  'Extract pages from PDF',
  'Add watermark to PDF',
  'Sign a PDF',
  'Make a student certificate',
  'Create a purchase order',
  'Make meeting minutes',
  'Compress multiple files',
];

export default function HomeAIAssistant() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{
    toolName: string;
    route: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============ ROTATING SUGGESTIONS ============
  useEffect(() => {
    const rotateSuggestions = () => {
      const shuffled = [...SUGGESTIONS_POOL].sort(() => Math.random() - 0.5);
      setSuggestions(shuffled.slice(0, 3));
    };

    rotateSuggestions();
    const interval = setInterval(rotateSuggestions, 2000);
    return () => clearInterval(interval);
  }, []);

  // ============ AUTO-SCROLL ============
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============ HANDLE SUBMIT ============
  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. Check if it matches a tool
    const toolMatch = findToolMatch(text);

    if (toolMatch) {
      // Direct route to the tool
      setMatchInfo({
        toolName: toolMatch.toolName,
        route: toolMatch.route,
      });
      setTimeout(() => navigate(toolMatch.route), 800);
      return;
    }

    // 2. Otherwise ask AI
    setIsLoading(true);
    setMatchInfo(null);
    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      const aiResponse = await askAI(updatedMessages);
      setMessages([...updatedMessages, { role: 'assistant', content: aiResponse }]);
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSubmit(suggestion);
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6 h-full">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            AI Assistant
          </h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Ask anything · Get instant help
          </p>
        </div>
      </div>

      {/* CHAT MESSAGES (if any) */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-[300px] overflow-y-auto space-y-2.5 px-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`px-3 py-2 rounded-xl text-[12px] leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* TOOL MATCH INDICATOR */}
      {matchInfo && (
        <div className="mb-4 px-3.5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 mb-1">
            ✨ Opening {matchInfo.toolName}...
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Redirecting you now
          </p>
        </div>
      )}

      {/* INPUT BOX */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2.5 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
          <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSubmit(input)}
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* SUGGESTIONS */}
      {messages.length === 0 && !matchInfo && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Try these
          </p>
          <div className="space-y-1.5">
            {suggestions.map((suggestion, i) => (
              <button
                key={`${suggestion}-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-purple-400/50 hover:bg-purple-500/[0.05] transition-all text-left group"
              >
                <span className="text-[12px] text-gray-700 dark:text-gray-300 truncate">
                  {suggestion}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER HINT */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          Powered by AI · Supports all languages
        </p>
      </div>
    </div>
  );
}