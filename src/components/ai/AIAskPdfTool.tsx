import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  FileCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { safeFetchJson } from '../../utils/apiClient';
import mammoth from 'mammoth';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  'Provide a 3-paragraph executive summary of this document.',
  'What are the primary conclusions, findings, or results?',
  'List all actionable recommendations or next steps.',
  'Are there any notable risks, limitations, or disclaimers mentioned?',
];

export const AIAskPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [docStats, setDocStats] = useState<{ wordCount: number; pages?: number } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsExtracting(true);
    setExtractError(null);
    setMessages([]);

    try {
      let text = '';
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase();

      if (ext === 'docx') {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (ext === 'pdf') {
        // Dynamic import of pdfjs-dist for client-side text extraction
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        let fullText = '';
        for (let i = 1; i <= Math.min(numPages, 50); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullText += `\n--- Page ${i} ---\n` + pageText;
        }
        text = fullText;
        setDocStats({ wordCount: text.split(/\s+/).filter(Boolean).length, pages: numPages });
      } else {
        // Plain text / markdown fallback
        text = await uploadedFile.text();
      }

      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('Could not extract readable text from document. It might be scanned or image-based (try using PDF OCR tool).');
      }

      setExtractedText(trimmed);
      const words = trimmed.split(/\s+/).filter(Boolean).length;
      if (!docStats?.pages) {
        setDocStats({ wordCount: words });
      }

      // Add welcoming greeting
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `I've analyzed **${uploadedFile.name}** (${words.toLocaleString()} words). You can now ask any question, request summaries, or explore specific sections!`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error('[Document Extraction Error]', err);
      setExtractError(err?.message || 'Failed to extract text from document.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || inputQuery;
    if (!query.trim() || isThinking || !extractedText) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);
    setTimeout(scrollToBottom, 50);

    try {
      const data = await safeFetchJson('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'ask_pdf',
          input: query.trim(),
          options: {
            documentContext: extractedText.substring(0, 40000),
          },
        }),
      });

      const reply = data?.result || "I couldn't process this question right now. Please try again.";
      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[Ask PDF Error]', err);
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: 'Sorry, I encountered an error while analyzing the document. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map((m) => `[${m.sender.toUpperCase()}]: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ask-pdf-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ask PDF (Document Chatbot)</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              Contextual Intelligence
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload PDF or DOCX documents to extract insights, summarize complex clauses, and ask detailed questions.
          </p>
        </div>
      </div>

      {!file || !extractedText ? (
        /* UPLOAD ZONE */
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all space-y-4"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-sm">
              {isExtracting ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <FileText className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isExtracting ? 'Analyzing and reading document...' : 'Upload PDF or Word Document'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports PDF, DOCX, and TXT files up to 50MB. Instant client-side text parsing.
              </p>
            </div>

            <button
              type="button"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Choose Document
            </button>
          </div>

          {extractError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{extractError}</div>
            </div>
          )}
        </div>
      ) : (
        /* CHAT INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SIDEBAR: DOCUMENT INFO & QUICK PROMPTS */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Document
                </span>
                <button
                  onClick={() => {
                    setFile(null);
                    setExtractedText('');
                    setMessages([]);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Change
                </button>
              </div>

              <div className="flex items-start gap-2.5">
                <FileCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {docStats?.pages ? `${docStats.pages} pages · ` : ''}
                    {docStats?.wordCount.toLocaleString()} words
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleExportChat}
                  disabled={messages.length <= 1}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium flex items-center gap-1 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Export Chat
                </button>
              </div>
            </div>

            {/* QUICK QUESTIONS CHIPS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Suggested Inquiries
              </span>
              <div className="space-y-1.5">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isThinking}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/40 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs transition-colors flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div className="lg:col-span-3 flex flex-col h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{m.text}</div>

                    {m.sender === 'assistant' && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-3 justify-start items-center text-slate-400 text-xs animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Analyzing document sections...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT FORM */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a question about this document..."
                  disabled={isThinking}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isThinking}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                  title="Send Question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
