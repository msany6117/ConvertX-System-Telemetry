import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Layers } from 'lucide-react';
import { TOOLS_LIST } from '../data/tools';
import { ToolItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (route: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut ⌘K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? TOOLS_LIST.filter((tool) => {
        const q = query.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.inputFormats.some((f) => f.includes(q)) ||
          tool.outputFormats.some((f) => f.includes(q)) ||
          tool.category.includes(q)
        );
      })
    : TOOLS_LIST.slice(0, 8);

  const handleSelect = (route: string) => {
    onSelectTool(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Search Input Box */}
        <div className="flex items-center border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, formats (e.g. jpg to webp, compress video)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching tools found for "{query}". Try "jpg", "mp4", "pdf", or "compress".
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleSelect(tool.route)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Layers className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-white truncate">
                          {tool.name}
                        </span>
                        {tool.badge && (
                          <span className="rounded bg-blue-50 dark:bg-blue-950 px-1 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
          <span>Search ConvertX open-source utilities</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
