import React, { useState, useEffect } from 'react';
import { 
  Zap, Search, Sparkles, Copy, Check, Download, Trash2, 
  ExternalLink, Code, Eye, RefreshCw, Upload, FolderPlus,
  ArrowRight, ShieldCheck, Layers, Tag
} from 'lucide-react';
import { 
  getTemplates, deleteTemplate, saveTemplates, 
  DEFAULT_PRESET_TEMPLATES, RipTemplate 
} from '../storage/templateStorage';

type CategoryFilter = 'All' | 'Card' | 'Button' | 'Navbar' | 'Pricing' | 'Dashboard' | 'Other';
type CodeFormat = 'react' | 'vue' | 'html';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<RipTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<RipTemplate | null>(null);
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('react');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getTemplates();
    setTemplates(data);
    if (data.length > 0 && !selectedTemplate) {
      setSelectedTemplate(data[0]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('确定删除该组件模版吗？')) return;
    const updated = await deleteTemplate(id);
    setTemplates(updated);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(updated[0] || null);
    }
  };

  const handleResetPresets = async () => {
    if (!confirm('确定重置恢复官方精选预设模板吗？')) return;
    await saveTemplates(DEFAULT_PRESET_TEMPLATES);
    setTemplates(DEFAULT_PRESET_TEMPLATES);
    setSelectedTemplate(DEFAULT_PRESET_TEMPLATES[0]);
  };

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadTemplate = (template: RipTemplate) => {
    const ext = codeFormat === 'react' ? 'tsx' : codeFormat === 'vue' ? 'vue' : 'html';
    const content = codeFormat === 'react' ? template.reactCode : codeFormat === 'vue' ? template.vueCode : template.htmlCode;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 过滤后的模板列表
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !search.trim() || 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 顶部导航 */}
      <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                RipUI · 模板中心
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Templates Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400">已保存的 React + Tailwind 逆向组件库</p>
          </div>
        </div>

        {/* 右侧全局操作 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetPresets}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重置预设</span>
          </button>

          <a
            href="https://github.com/cpttbtptp2812/RipUI"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <span>GitHub 源码</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* 主体工作台：双栏布局 */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-12 gap-6">
        {/* 左侧：分类选择 & 模板卡片列表 */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {/* 搜索栏 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索模板名称、标签或分类..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0f121a] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
            />
          </div>

          {/* 分类过滤 Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['All', 'Pricing', 'Card', 'Dashboard', 'Button', 'Navbar', 'Other'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat === 'All' ? '全部模板' : cat}
              </button>
            ))}
          </div>

          {/* 模板列表 */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-slate-500 space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm">暂无符合条件的模板</p>
                <p className="text-xs">在任意网页用快捷键 Alt + R 圈选组件并点击「存为模板」即可入库</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#131722] border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#0f121a]/80 border-white/5 hover:border-white/20 hover:bg-[#121520]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {template.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => handleDelete(template.id, e)}
                            title="删除模板"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {template.name}
                      </h4>

                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {template.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-3 text-[11px] text-slate-400">
                      <span className="truncate max-w-[200px] text-slate-500">
                        {template.sourceUrl ? new URL(template.sourceUrl).hostname : 'Local Canvas'}
                      </span>
                      <span className="text-cyan-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>查看与复制代码</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：模板详细预览与代码查看大屏 */}
        <div className="col-span-12 lg:col-span-7 flex flex-col rounded-2xl bg-[#0d1017] border border-white/10 overflow-hidden shadow-2xl">
          {selectedTemplate ? (
            <>
              {/* 大屏顶部栏 */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>{selectedTemplate.name}</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {selectedTemplate.category}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    来源：{selectedTemplate.sourceUrl || '本地截取'}
                  </p>
                </div>

                {/* 格式切换 Tabs */}
                <div className="flex items-center gap-2">
                  <div className="flex p-1 rounded-lg bg-black/40 border border-white/10 text-xs">
                    <button
                      onClick={() => setCodeFormat('react')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        codeFormat === 'react'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      React (TSX)
                    </button>
                    <button
                      onClick={() => setCodeFormat('vue')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        codeFormat === 'vue'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vue 3
                    </button>
                    <button
                      onClick={() => setCodeFormat('html')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        codeFormat === 'html'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      HTML
                    </button>
                  </div>

                  <button
                    onClick={() => handleDownloadTemplate(selectedTemplate)}
                    title="下载源码文件"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const code = codeFormat === 'react' ? selectedTemplate.reactCode : codeFormat === 'vue' ? selectedTemplate.vueCode : selectedTemplate.htmlCode;
                      handleCopyCode(code, selectedTemplate.id);
                    }}
                    className={`px-3.5 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
                      copiedId === selectedTemplate.id
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
                    }`}
                  >
                    {copiedId === selectedTemplate.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === selectedTemplate.id ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* 上半部分：真实渲染渲染预览 (Live Preview) */}
              <div className="p-6 border-b border-white/10 bg-[#090b10] flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>Interactive Live Preview</span>
                </div>

                <div 
                  className="w-full max-w-md my-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlCode }}
                />
              </div>

              {/* 下半部分：代码展示区 */}
              <div className="flex-1 p-4 bg-[#05070a] font-mono text-xs overflow-auto max-h-[380px] select-text">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Generated Code ({codeFormat.toUpperCase()})</span>
                  </span>
                  <span className="text-slate-500">Tailwind CSS Classes Included</span>
                </div>
                <pre className="text-slate-300 leading-relaxed overflow-x-auto">
                  <code>
                    {codeFormat === 'react' 
                      ? selectedTemplate.reactCode 
                      : codeFormat === 'vue' 
                        ? selectedTemplate.vueCode 
                        : selectedTemplate.htmlCode}
                  </code>
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-3">
              <Layers className="w-12 h-12 text-slate-700" />
              <p className="text-sm">请选择左侧模板以查看预览与代码</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

