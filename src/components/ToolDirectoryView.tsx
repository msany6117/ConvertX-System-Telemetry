import React, { useState } from 'react';
import { Search, ArrowRight, Grid, Video, Music, Image as ImageIcon, FileText, Minimize2, Scale } from 'lucide-react';
import { TOOLS_LIST } from '../data/tools';

interface ToolDirectoryViewProps {
  onSelectTool: (route: string) => void;
  initialCategory?: string;
}

export const ToolDirectoryView: React.FC<ToolDirectoryViewProps> = ({ onSelectTool, initialCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const categories = [
    { id: 'all', label: 'All Tools', icon: Grid },
    { id: 'image', label: 'Image Tools', icon: ImageIcon },
    { id: 'video', label: 'Video Tools', icon: Video },
    { id: 'audio', label: 'Audio Tools', icon: Music },
    { id: 'pdf', label: 'PDF Suite', icon: FileText },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'compression', label: 'Compression', icon: Minimize2 },
    { id: 'utility', label: 'Utilities', icon: Scale },
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Complete Tool Index
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All File Tools & Converters
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Over 50+ free online converters, compressors, editors, and measurement calculators.
        </p>

        {/* Search input in directory */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools by name or format..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-100 dark:focus:ring-slate-100 shadow-2xs"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
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
        {filteredTools.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No tools found matching your search. Try another format or keyword.
          </div>
        ) : (
          filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.route)}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                    {tool.category}
                  </span>
                  {tool.badge && (
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="text-[11px] font-medium text-slate-400">
                  {tool.outputFormats.map((f) => f.toUpperCase()).join(', ')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
