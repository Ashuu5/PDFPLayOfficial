// ============================================================
// HOME AI ASSISTANT — ChatGPT-style interface
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ArrowRight,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import {
  findToolMatch,
  askAI,
  type ChatMessage,
} from '../lib/aiService';

// ============================================================
// SUGGESTIONS POOL
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

// ============================================================
// SUGGESTIONS COMPONENT
// ============================================================
function Suggestions({
  onSelect,
  hidden,
}: {
  onSelect: (suggestion: string) => void;
  hidden: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const rotate = () => {
      const shuffled = [...SUGGESTIONS_POOL].sort(() => Math.random() - 0.5);
      setSuggestions(shuffled.slice(0, 3));
    };
    rotate();
    const interval = setInterval(rotate, 5000);
    return () => clearInterval(interval);
  }, []);

  if (hidden) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
        Try these
      </p>
      <div className="space-y-1.5">
        {suggestions.map((suggestion, i) => (
          <button
            key={`${suggestion}-${i}`}
            onClick={() => onSelect(suggestion)}
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
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function HomeAIAssistant() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{
    toolName: string;
    route: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasAtBottomRef = useRef(true);

  // ============ FOCUS INPUT ON MOUNT ============
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ============ TRACK IF USER IS AT BOTTOM ============
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    wasAtBottomRef.current = isAtBottom;
  };

  // ============ AUTO-SCROLL ONLY IF USER WAS AT BOTTOM ============
  useEffect(() => {
    if (wasAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isLoading]);

  // ============ HANDLE SUBMIT ============
  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const toolMatch = findToolMatch(trimmed);

      if (toolMatch) {
        setMatchInfo({
          toolName: toolMatch.toolName,
          route: toolMatch.route,
        });
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: trimmed },
          {
            role: 'assistant',
            content: `Opening ${toolMatch.toolName} for you...`,
          },
        ]);
        setInput('');
        setTimeout(() => navigate(toolMatch.route), 1200);
        return;
      }

      setIsLoading(true);
      setMatchInfo(null);

      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');

      // Force scroll to bottom on send
      wasAtBottomRef.current = true;

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      try {
        const aiResponse = await askAI(updatedMessages);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: aiResponse },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          },
        ]);
      } finally {
        setIsLoading(false);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    [messages, isLoading, navigate]
  );

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const handleClearChat = () => {
    setMessages([]);
    setMatchInfo(null);
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
        <div className="flex items-center gap-2">
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

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* CHAT MESSAGES — FIXED SCROLLABLE AREA */}
      {messages.length > 0 && (
        <div className="relative mb-4 shrink-0">
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="chat-scrollbar overflow-y-auto space-y-2.5 px-3 py-3 pr-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20"
            style={{
              height: '340px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139,92,246,0.6) rgba(0,0,0,0.1)',
            }}
          >
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
                  className={`px-3 py-2 rounded-xl text-[12px] leading-relaxed max-w-[85%] whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
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
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll hint — top fade */}
          <div
            className="absolute top-0 left-0 right-0 h-6 pointer-events-none rounded-t-lg"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)',
            }}
          />
        </div>
      )}

      {/* TOOL MATCH INDICATOR */}
      {matchInfo && (
        <div className="mb-4 px-3.5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 shrink-0">
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 mb-1">
            ✨ Opening {matchInfo.toolName}...
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Redirecting you now
          </p>
        </div>
      )}

      {/* INPUT BOX */}
      <div className="relative mb-4 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] pl-3 pr-2 py-1 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
          <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
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
            className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-white placeholder-gray-400 py-2 outline-none border-0 focus:outline-none focus:ring-0 focus:border-0"
            style={{
              outline: 'none',
              boxShadow: 'none',
              lineHeight: '1.4',
            }}
            disabled={isLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
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
      <Suggestions
        onSelect={handleSuggestionClick}
        hidden={messages.length > 0 || !!matchInfo}
      />

      {/* FOOTER HINT */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 shrink-0">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          Powered by AI · Supports all languages
        </p>
      </div>

      {/* SCROLLBAR STYLING */}
      <style>{`
        .chat-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.6);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.9);
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}