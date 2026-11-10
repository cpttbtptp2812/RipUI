import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, X, Layers, Sparkles, Download, BookmarkPlus, 
  ExternalLink, ArrowLeft, MousePointer, Bookmark, Clock, 
  ChevronRight, Code, Zap 
} from 'lucide-react';
import { RipNode, ExportFormat } from '../engine/types';
import { generateReactComponent } from '../generators/reactGenerator';
import { generateVueComponent } from '../generators/vueGenerator';
import { generateHtmlSnippet } from '../generators/htmlGenerator';
import { addTemplate, getTemplates } from '../storage/templateStorage';
import { captureComponentToProject, getRecordingState, setRecordingState } from '../storage/decompilerStorage';
import { RecordingState } from '../engine/decompilerTypes';

interface HistoryItem {
  id: string;
  node: RipNode;
  time: string;
}

interface RipDrawerProps {
  node: RipNode | null;
  isOpen: boolean;
  onClose: () => void;
  onStartInspect?: () => void;
}

export const RipDrawer: React.FC<RipDrawerProps> = ({ 
  node, 
  isOpen, 
  onClose,
  onStartInspect 
}) => {
  const [currentView, setCurrentView] = useState<'code' | 'home'>('code');
  const [format, setFormat] = useState<ExportFormat>('react');
  const [componentName, setComponentName] = useState('RippedComponent');
  const [copied, setCopied] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [templateCount, setTemplateCount] = useState(0);
  const [recState, setRecState] = useState<RecordingState | null>(null);
  const [addedToProject, setAddedToProject] = useState(false);

  // 历史抓取记录
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentNode, setCurrentNode] = useState<RipNode | null>(node);

  // 模板保存表单状态
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'Card' | 'Button' | 'Navbar' | 'Pricing' | 'Dashboard' | 'Other'>('Card');

  const refreshRecState = () => {
    getRecordingState().then(setRecState);
  };

  useEffect(() => {
    refreshRecState();
  }, []);

  // 当外部传入新节点时，推入历史并切入代码视图
  useEffect(() => {
    if (node) {
      setCurrentNode(node);
      setCurrentView('code');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory((prev) => [
        { id: Math.random().toString(36).substr(2, 7), node, time: timeStr },
        ...prev.filter(item => item.node.id !== node.id).slice(0, 7)
      ]);
    }
  }, [node]);

  useEffect(() => {
    getTemplates().then((list) => setTemplateCount(list.length));
  }, [templateSaved]);

  if (!isOpen) return null;

  const targetNode = currentNode || node;

  const reactCode = targetNode ? generateReactComponent(targetNode, componentName) : '';
  const vueCode = targetNode ? generateVueComponent(targetNode) : '';
  const htmlCode = targetNode ? generateHtmlSnippet(targetNode) : '';

  let generatedCode = '';
  if (format === 'react') generatedCode = reactCode;
  else if (format === 'vue') generatedCode = vueCode;
  else generatedCode = htmlCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const ext = format === 'react' ? 'tsx' : format === 'vue' ? 'vue' : 'html';
    const filename = `${componentName}.${ext}`;
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {
    if (!targetNode) return;
    const finalName = templateName.trim() || `${componentName} 模板`;
    await addTemplate({
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: finalName,
      category: templateCategory,
      sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      createdAt: Date.now(),
      node: targetNode,
      reactCode,
      vueCode,
      htmlCode,
      tags: [templateCategory, targetNode.tagName]
    });
    setSavingTemplate(false);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 4000);
  };

  const handleAddToProject = async () => {
    if (!targetNode) return;
    await captureComponentToProject(targetNode, componentName, templateCategory);
    setAddedToProject(true);
    refreshRecState();
    setTimeout(() => setAddedToProject(false), 4000);
  };

  const openTemplatesPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL('templates.html') });
    } else {
      window.open('/templates.html', '_blank');
    }
  };

  const countNodes = (n: RipNode): number => {
    return 1 + n.children.reduce((acc, curr) => acc + countNodes(curr), 0);
  };
  const totalNodes = targetNode ? countNodes(targetNode) : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-[560px] max-w-full bg-[#0d0e12]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-[9999999] text-slate-200 transition-all duration-300 font-sans">
      {/* 头部导航 */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
        {currentView === 'code' ? (
          /* 代码视图头部：包含清晰的「返回主页」按钮 */
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all group"
              title="返回插件控制台主页 (不关闭抽屉)"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>返回主页</span>
            </button>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wide text-white">提取详情</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {totalNodes} DOM nodes
              </span>
            </div>
          </div>
        ) : (
          /* 主页视图头部 */
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">RipUI 控制台</span>
              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Hub
              </span>
            </div>
          </div>
        )}

        {/* 右侧快捷链接 & 彻底收起按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={openTemplatesPage}
            title="查看已有模板中心 (在新页面打开)"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>模板库</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="收起侧边栏"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 视图内容切换 */}
      {currentView === 'home' ? (
        /* =================== 插件主页视图 (Home View) =================== */
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 快捷操作两张大卡片 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 卡片 1：重新圈选 */}
            <button
              onClick={() => {
                if (onStartInspect) {
                  onStartInspect();
                } else {
                  onClose();
                }
              }}
              className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 hover:from-cyan-500/25 hover:to-blue-600/25 border border-cyan-500/40 text-left transition-all group cursor-pointer shadow-lg shadow-cyan-950/20"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-105 transition-transform">
                <MousePointer className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-white group-hover:text-cyan-200 transition-colors">
                圈选网页元素
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                快捷键 <span className="font-mono text-cyan-300">Alt + R</span>
              </div>
            </button>

            {/* 卡片 2：打开模板库 */}
            <button
              onClick={openTemplatesPage}
              className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-amber-500/30 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {templateCount}
                </span>
              </div>
              <div className="font-semibold text-xs text-slate-200 group-hover:text-white transition-colors">
                已有组件模板库
              </div>
              <div className="text-[10px] text-slate-400 mt-1">新标签页全屏查看 ➔</div>
            </button>
          </div>

          {/* 卡片 3：多页面全站反编译工程工作室 */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-blue-900/20 border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-white">多页面反编译工程工作室</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Full-App Decompiler
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              支持录制多个页面（首页、详情、看板、弹窗等），每个按钮与卡片均自动反编译为独立 React 模块并编排整站工程。
            </p>

            <button
              onClick={openTemplatesPage}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>打开全套多页面反编译工作大屏</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 若当前已有选中的组件，提供一键切回代码大卡片 */}
          {targetNode && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>当前抽取的组件</span>
                </div>
                <div className="text-xs text-white font-mono">
                  &lt;{targetNode.tagName}&gt; ({Math.round(targetNode.width)}×{Math.round(targetNode.height)}px · {totalNodes} 节点)
                </div>
              </div>
              <button
                onClick={() => setCurrentView('code')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>查看代码</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 历史抓取列表 */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>本次会话抓取历史 ({history.length})</span>
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-white/10 text-slate-500 text-xs">
                暂无抓取记录，点击上方「圈选网页元素」或按 Alt + R 开启
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentNode(item.node);
                      setCurrentView('code');
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      item.node.id === targetNode?.id
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                      <div>
                        <span className="text-xs font-mono font-semibold text-white">
                          &lt;{item.node.tagName}&gt;
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">
                          {Math.round(item.node.width)}×{Math.round(item.node.height)}px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.time}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =================== 代码详情视图 (Code View) =================== */
        <>
          {/* 存为模板快捷提醒横幅 */}
          {templateSaved && (
            <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已成功保存为组件模板！</span>
              </span>
              <button
                onClick={openTemplatesPage}
                className="font-bold underline hover:text-white transition-colors flex items-center gap-1"
              >
                去模板库查看 ➔
              </button>
            </div>
          )}

          {/* 录入反编译工程成功横幅 */}
          {addedToProject && (
            <div className="px-5 py-2.5 bg-indigo-500/15 border-b border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300 animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>已成功反编译并录入当前多页面工程！</span>
              </span>
              <button
                onClick={openTemplatesPage}
                className="font-bold underline hover:text-white transition-colors flex items-center gap-1"
              >
                查看反编译工程大屏 ➔
              </button>
            </div>
          )}

          {/* 控制栏：格式选择 & 操作按钮 */}
          <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              {/* Format Tabs */}
              <div className="flex p-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                <button
                  onClick={() => setFormat('react')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    format === 'react'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  React (TSX)
                </button>
                <button
                  onClick={() => setFormat('vue')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    format === 'vue'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vue 3
                </button>
                <button
                  onClick={() => setFormat('html')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    format === 'html'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  HTML
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddToProject}
                  title="将此组件反编译并录入当前全站多页面工程"
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-indigo-300 hover:text-white transition-all text-xs flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>录入反编译工程</span>
                </button>

                <button
                  onClick={() => setSavingTemplate(true)}
                  title="将当前抽取的组件存入模版库"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all text-xs flex items-center gap-1.5"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>存为模版</span>
                </button>

                <button
                  onClick={handleDownload}
                  title="下载文件"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className={`px-3.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* 存为模板弹出式填写区 */}
            {savingTemplate && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <BookmarkPlus className="w-4 h-4" />
                    <span>存为新模板</span>
                  </span>
                  <button
                    onClick={() => setSavingTemplate(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">模板名称:</label>
                    <input
                      type="text"
                      placeholder="例如: Stripe Pro 结算卡片"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-2.5 py-1 rounded bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">分类:</label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value as any)}
                      className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="Card">Card 卡片</option>
                      <option value="Pricing">Pricing 定价</option>
                      <option value="Button">Button 按钮</option>
                      <option value="Navbar">Navbar 导航</option>
                      <option value="Dashboard">Dashboard 看板</option>
                      <option value="Other">Other 其他</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSavingTemplate(false)}
                    className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    确认存入模板库
                  </button>
                </div>
              </div>
            )}

            {format === 'react' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 shrink-0">Component Name:</span>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs w-48"
                />
              </div>
            )}
          </div>

          {/* 代码预览区 */}
          <div className="flex-1 overflow-auto p-4 bg-[#090a0d] font-mono text-[12px] leading-relaxed select-text">
            <pre className="text-slate-300 whitespace-pre overflow-x-auto">
              <code>{generatedCode}</code>
            </pre>
          </div>

          {/* 底部状态 */}
          {targetNode && (
            <div className="h-10 px-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 bg-white/[0.02]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>&lt;{targetNode.tagName}&gt; ({Math.round(targetNode.width)}×{Math.round(targetNode.height)}px)</span>
              </span>
              <span className="text-slate-500">100% Real Render Tree • Zero Guessing</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
