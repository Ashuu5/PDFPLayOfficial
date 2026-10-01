// ============================================================
// HOME AI ASSISTANT — ChatGPT-style chat interface
// No suggestions · Copy button · Markdown rendering
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import { askAI, type ChatMessage } from '../lib/aiService';

export default function HomeAIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasAtBottomRef = useRef(true);

  // ============ FOCUS INPUT ON MOUNT ============
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ============ TRACK SCROLL POSITION ============
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    wasAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  // ============ AUTO-SCROLL ON NEW MESSAGES ============
  useEffect(() => {
    if (wasAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [messages, isLoading]);

  // ============ AUTO-RESIZE TEXTAREA ============
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  // ============ HANDLE SUBMIT ============
  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setIsLoading(true);

      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
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
            content:
              'Sorry, something went wrong. Please try again in a moment.',
          },
        ]);
      } finally {
        setIsLoading(false);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // silent fail
    }
  };

  // ============================================================
  // MARKDOWN-LIKE RENDERING
  // ============================================================
  const applyInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={key++} className="font-bold text-white">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          // Bullet points
          if (
            line.trim().startsWith('•') ||
            line.trim().startsWith('- ') ||
            line.trim().startsWith('* ')
          ) {
            const text = line.replace(/^[\s•\-*]+/, '');
            return (
              <div key={idx} className="flex gap-2 pl-1">
                <span className="text-purple-400 shrink-0">•</span>
                <span>{applyInlineFormatting(text)}</span>
              </div>
            );
          }

          // Numbered list
          const numMatch = line.match(/^(\d+)\.\s+(.+)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex gap-2 pl-1">
                <span className="text-purple-400 shrink-0 font-semibold">
                  {numMatch[1]}.
                </span>
                <span>{applyInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          // Headings (### or ##)
          if (line.startsWith('### ')) {
            return (
              <div
                key={idx}
                className="font-bold text-purple-300 text-[13px] mt-2"
              >
                {line.replace('### ', '')}
              </div>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <div
                key={idx}
                className="font-bold text-purple-300 text-[13px] mt-2"
              >
                {line.replace('## ', '')}
              </div>
            );
          }

          // Empty line
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }

          // Regular paragraph
          return <div key={idx}>{applyInlineFormatting(line)}</div>;
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm h-full flex flex-col overflow-hidden">
      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">
              AI Assistant
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Ask me anything
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            New Chat
          </button>
        )}
      </div>

      {/* ============ CHAT AREA ============ */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="chat-scrollbar flex-1 overflow-y-auto px-5 py-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(139,92,246,0.5) transparent',
          minHeight: '340px',
          maxHeight: '420px',
        }}
      >
        {/* Empty state — welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.6)]">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-2">
              How can I help you today?
            </h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              Ask me anything — questions, writing help, ideas, explanations, or
              just a friendly chat.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* AI Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Message bubble */}
            <div className="flex flex-col gap-1 max-w-[85%]">
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white rounded-tr-md'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-tl-md'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                ) : (
                  <div className="break-words">
                    {renderMessageContent(msg.content)}
                  </div>
                )}
              </div>

              {/* Copy button for AI messages */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="self-start flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="mb-4 flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-3.5 py-3 rounded-2xl rounded-tl-md bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ============ INPUT AREA ============ */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-200 dark:border-white/10 shrink-0 bg-white/50 dark:bg-transparent">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] pl-3.5 pr-2 py-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Assistant..."
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-white placeholder-gray-400 py-1.5 outline-none border-0 focus:outline-none focus:ring-0 focus:border-0 resize-none leading-snug"
            style={{
              outline: 'none',
              boxShadow: 'none',
              maxHeight: '140px',
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
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
          AI may make mistakes. Verify important information.
        </p>
      </div>

      {/* ============ SCROLLBAR STYLING ============ */}
      <style>{`
        .chat-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 3px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
}