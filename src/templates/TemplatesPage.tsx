import React, { useState, useEffect } from 'react';
import { 
  Zap, Search, Sparkles, Copy, Check, Download, Trash2, 
  ExternalLink, Code, Eye, RefreshCw, FolderPlus,
  ArrowRight, Layers, FileCode, Globe, Layout, ChevronRight,
  Compass, MousePointer
} from 'lucide-react';
import { 
  getTemplates, deleteTemplate, saveTemplates, 
  DEFAULT_PRESET_TEMPLATES, RipTemplate 
} from '../storage/templateStorage';
import { 
  getDecompiledProjects, saveDecompiledProjects, 
  DEFAULT_DECOMPILED_PROJECTS 
} from '../storage/decompilerStorage';
import { DecompiledProject, DecompiledPage, DecompiledComponent } from '../engine/decompilerTypes';

type MainTab = 'decompiler' | 'components';
type CategoryFilter = 'All' | 'Card' | 'Button' | 'Navbar' | 'Pricing' | 'Dashboard' | 'Other';
type CodeFormat = 'react' | 'vue' | 'html';

export const TemplatesPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('decompiler');

  // 组件模板库状态
  const [templates, setTemplates] = useState<RipTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<RipTemplate | null>(null);
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('react');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 多页面反编译工程状态
  const [projects, setProjects] = useState<DecompiledProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DecompiledProject | null>(null);
  const [selectedPage, setSelectedPage] = useState<DecompiledPage | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<DecompiledComponent | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const tmplData = await getTemplates();
    setTemplates(tmplData);
    if (tmplData.length > 0 && !selectedTemplate) {
      setSelectedTemplate(tmplData[0]);
    }

    const projData = await getDecompiledProjects();
    setProjects(projData);
    if (projData.length > 0) {
      setSelectedProject(projData[0]);
      if (projData[0].pages.length > 0) {
        setSelectedPage(projData[0].pages[0]);
        if (projData[0].pages[0].components.length > 0) {
          setSelectedComponent(projData[0].pages[0].components[0]);
        }
      }
    }
    setLoading(false);
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

  const handleResetPresets = async () => {
    if (!confirm('确定重置恢复官方精选反编译工程与模板吗？')) return;
    await saveTemplates(DEFAULT_PRESET_TEMPLATES);
    await saveDecompiledProjects(DEFAULT_DECOMPILED_PROJECTS);
    setTemplates(DEFAULT_PRESET_TEMPLATES);
    setProjects(DEFAULT_DECOMPILED_PROJECTS);
    setSelectedProject(DEFAULT_DECOMPILED_PROJECTS[0]);
    if (DEFAULT_DECOMPILED_PROJECTS[0].pages[0]) {
      setSelectedPage(DEFAULT_DECOMPILED_PROJECTS[0].pages[0]);
      setSelectedComponent(DEFAULT_DECOMPILED_PROJECTS[0].pages[0].components[0]);
    }
  };

  // 生成当前页面的完整 React 代码
  const generateFullPageReactCode = (page: DecompiledPage): string => {
    const importNames = page.components.map((c, i) => `Component${i + 1}`);
    const jsxParts = page.components.map((c, i) => `        {/* ${c.name} */}\n        <Component${i + 1} />`);

    return `import React from 'react';

${page.components.map((c, i) => `// ================= ${c.name} (${c.category}) =================\n${c.reactCode}`).join('\n\n')}

/**
 * 页面反编译总装：${page.title} (${page.route})
 */
export const ${page.route === '/' ? 'HomePage' : 'Page_' + page.id.replace(/-/g, '_')}: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090b10] text-white flex flex-col gap-6 p-6">
      <header className="pb-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold">${page.title}</h1>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">${page.route}</span>
      </header>

      <main className="flex flex-col gap-6">
${jsxParts.join('\n\n')}
      </main>
    </div>
  );
};

export default ${page.route === '/' ? 'HomePage' : 'Page_' + page.id.replace(/-/g, '_')};
`;
  };

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
                RipUI · 逆向反编译工作台
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400">多页面全套反编译 · 页面/按钮/组件代码工程化</p>
          </div>
        </div>

        {/* 顶部中间：主模式切换 */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setMainTab('decompiler')}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              mainTab === 'decompiler'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>多页面全套反编译工程</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white">
              {projects.length} 套
            </span>
          </button>

          <button
            onClick={() => setMainTab('components')}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              mainTab === 'components'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>独立组件模板库</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white">
              {templates.length}
            </span>
          </button>
        </div>

        {/* 右侧全局操作 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetPresets}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重置预设工程</span>
          </button>

          <a
            href="https://github.com/cpttbtptp2812/RipUI"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 模式 1：多页面全套反编译工程工作室 (Decompiler Studio)         */}
      {/* ============================================================== */}
      {mainTab === 'decompiler' && selectedProject && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-12 gap-6">
          {/* 左侧：工程页面树与交互组件 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            {/* 项目概览卡片 */}
            <div className="p-4 rounded-2xl bg-[#0f121a] border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {selectedProject.domain}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedProject.pages.length} Pages · {selectedProject.pages.reduce((acc, p) => acc + p.components.length, 0)} Components
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white">
                {selectedProject.name}
              </h3>
            </div>

            {/* 多页面树 (Pages Tree) */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              <div className="text-xs text-slate-400 font-semibold px-1 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-cyan-400" />
                <span>录制与反编译的页面列表</span>
              </div>

              {selectedProject.pages.map((page) => {
                const isPageSelected = selectedPage?.id === page.id;
                return (
                  <div
                    key={page.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isPageSelected
                        ? 'bg-[#121622] border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#0f121a]/80 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* 页面主条 */}
                    <div
                      onClick={() => {
                        setSelectedPage(page);
                        if (page.components.length > 0) setSelectedComponent(page.components[0]);
                      }}
                      className="p-3.5 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCode className={`w-4 h-4 ${isPageSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">
                            {page.title}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {page.route}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {page.components.length} 个组件
                      </span>
                    </div>

                    {/* 展开当前页面内反编译出的独立按钮与组件 */}
                    {isPageSelected && (
                      <div className="px-3 pb-3 space-y-1.5 pt-1 border-t border-white/5 bg-black/20">
                        <div className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                          页面包含的反编译组件:
                        </div>
                        {page.components.map((comp) => {
                          const isCompSelected = selectedComponent?.id === comp.id;
                          return (
                            <div
                              key={comp.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComponent(comp);
                              }}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                isCompSelected
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                                  {comp.category}
                                </span>
                                <span className="truncate font-medium">{comp.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                &lt;{comp.tagName}&gt;
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：多页面与组件渲染画布 + 完整工程代码 */}
          <div className="col-span-12 lg:col-span-8 flex flex-col rounded-2xl bg-[#0d1017] border border-white/10 overflow-hidden shadow-2xl">
            {selectedPage && (
              <>
                {/* 顶部操作条 */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>反编译装配：{selectedPage.title}</span>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {selectedPage.route}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedComponent ? `当前查看组件：${selectedComponent.name} (${selectedComponent.category})` : '全页面装配模式'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const fullCode = generateFullPageReactCode(selectedPage);
                        handleCopyCode(fullCode, selectedPage.id);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      {copiedId === selectedPage.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === selectedPage.id ? 'Copied Full Page!' : '复制整页 React 源码'}</span>
                    </button>
                  </div>
                </div>

                {/* 画布预览区：渲染当前反编译的交互效果 */}
                <div className="p-6 border-b border-white/10 bg-[#080a0f] flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
                  <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>Real Render Tree Preview (100% Tailwind Output)</span>
                  </div>

                  {selectedComponent ? (
                    <div 
                      className="w-full max-w-2xl my-4 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: selectedComponent.htmlCode }}
                    />
                  ) : (
                    <div className="space-y-4 w-full max-w-2xl my-4">
                      {selectedPage.components.map(comp => (
                        <div key={comp.id} dangerouslySetInnerHTML={{ __html: comp.htmlCode }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 源代码区：展示完整 React + Tailwind TSX 代码 */}
                <div className="flex-1 p-4 bg-[#05070a] font-mono text-xs overflow-auto max-h-[420px] select-text">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {selectedComponent 
                          ? `React TSX Component: <${selectedComponent.name.replace(/\s+/g, '')} />` 
                          : `Full Page Module: pages${selectedPage.route === '/' ? '/index.tsx' : selectedPage.route + '.tsx'}`}
                      </span>
                    </span>
                    <span className="text-slate-500">Zero Vision Hallucination • Clean React Code</span>
                  </div>
                  <pre className="text-slate-300 leading-relaxed overflow-x-auto">
                    <code>
                      {selectedComponent ? selectedComponent.reactCode : generateFullPageReactCode(selectedPage)}
                    </code>
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 模式 2：独立组件模板库 (Component Hub)                        */}
      {/* ============================================================== */}
      {mainTab === 'components' && (
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-12 gap-6">
          {/* 左侧：分类过滤与卡片流 */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
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

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {templates.map((template) => {
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
                        <span className="text-[10px] text-slate-500">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {template.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：单组件代码大屏 */}
          <div className="col-span-12 lg:col-span-7 flex flex-col rounded-2xl bg-[#0d1017] border border-white/10 overflow-hidden shadow-2xl">
            {selectedTemplate && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedTemplate.name}</h3>
                    <p className="text-xs text-slate-400">{selectedTemplate.category} · {selectedTemplate.sourceUrl || '本地截取'}</p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(selectedTemplate.reactCode, selectedTemplate.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedId === selectedTemplate.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === selectedTemplate.id ? 'Copied' : 'Copy React'}</span>
                  </button>
                </div>
                <div className="p-6 border-b border-white/10 bg-[#090b10] flex items-center justify-center">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlCode }} />
                </div>
                <div className="flex-1 p-4 bg-[#05070a] font-mono text-xs overflow-auto">
                  <pre className="text-slate-300"><code>{selectedTemplate.reactCode}</code></pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
