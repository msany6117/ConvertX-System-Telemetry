import React, { useState } from 'react';
import { Search, ArrowRight, Grid, Video, Music, Image as ImageIcon, FileText, Minimize2, Scale } from 'lucide-react';
import { TOOLS_LIST } from '../data/tools';
import { FileCategory } from '../types';

interface ToolDirectoryViewProps {
  onSelectTool: (route: string) => void;
}

export const ToolDirectoryView: React.FC<ToolDirectoryViewProps> = ({ onSelectTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Tools', icon: Grid },
    { id: 'image', label: 'Image Tools', icon: ImageIcon },
    { id: 'video', label: 'Video Tools', icon: Video },
    { id: 'audio', label: 'Audio Tools', icon: Music },
    { id: 'pdf', label: 'PDF Tools', icon: FileText },
    { id: 'compression', label: 'Compression', icon: Minimize2 },
    { id: 'utility', label: 'Converters & Utilities', icon: Scale },
  ];

  const filteredTools = TOOLS_LIST.filter((tool) => {
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const q = filterQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.inputFormats.some((f) => f.includes(q)) ||
      tool.outputFormats.some((f) => f.includes(q));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Complete Tool Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Over 50+ free online converters, compressors, editors, and measurement calculators. Powered entirely by open-source engines.
        </p>

        {/* Search input in directory */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools by name or format..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.route)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {tool.name.slice(0, 3).toUpperCase()}
                </div>
                {tool.badge && (
                  <span className="rounded bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {tool.badge}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {tool.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase">
                {tool.inputFormats.length > 0 && (
                  <span>
                    {tool.inputFormats.slice(0, 2).join('/')} → {tool.outputFormats[0]}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                Open Tool <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
