import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What files can I convert?',
      answer:
        'ConvertX supports over 50 formats across images (JPG, PNG, WebP, AVIF, HEIC, GIF, BMP, TIFF, SVG), documents (PDF, DOCX, TXT, HTML, EPUB, MOBI), spreadsheets (XLSX, CSV), videos (MP4, WebM, MOV, MKV, AVI), and audio (MP3, WAV, AAC, FLAC, OGG, M4A).',
    },
    {
      question: 'Are my files secure?',
      answer:
        'Yes. We operate on a client-first security model. Whenever possible, your browser converts files locally using WebAssembly and Canvas. When server transcoding is required, connections are TLS 1.3 encrypted, and processed files are stored in sandboxed paths that cannot be accessed by anyone else.',
    },
    {
      question: 'How long are files stored?',
      answer:
        'All uploaded files and converted outputs are automatically and permanently deleted from our servers after 1 hour (3,600 seconds). You can also click the delete/trash button immediately after downloading to scrub your files instantly.',
    },
    {
      question: 'Is ConvertX free?',
      answer:
        'Yes, ConvertX is completely free to use with generous 500 MB per-file limits, batch processing for up to 10 files simultaneously, and zero artificial delays. For heavy creators needing 2 GB files and dedicated parallel cloud workers, a Pro subscription is available.',
    },
    {
      question: 'Do I need an account?',
      answer:
        'No. You can convert, compress, and download any file immediately without creating an account, logging in, or providing an email address.',
    },
    {
      question: 'What is ConvertX AI?',
      answer:
        'ConvertX AI is an intelligent natural-language assistant built directly into the platform. Instead of searching through dropdown menus, you can type natural commands like "Convert this PDF to Word" or "Compress this video for Discord", and ConvertX AI automatically selects and tunes the exact conversion settings for you.',
    },
    {
      question: 'What are the file size limits?',
      answer:
        'The free tier allows single files up to 500 MB and batches of up to 10 files simultaneously. Pro accounts can upload files up to 2 GB with unlimited simultaneous conversions.',
    },
  ];

  return (
    <section id="faq" className="w-full py-16 border-t border-slate-200/60 dark:border-slate-800/60 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Got Questions?
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Everything you need to know about ConvertX security, performance, and capabilities.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200/80 bg-white/70 overflow-hidden dark:border-slate-800 dark:bg-slate-900/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100/70 dark:border-slate-800/70 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
