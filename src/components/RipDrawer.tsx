import React, { useState } from 'react';
import { Copy, Check, X, Layers, Sparkles, Download, BookmarkPlus, ExternalLink } from 'lucide-react';
import { RipNode, ExportFormat } from '../engine/types';
import { generateReactComponent } from '../generators/reactGenerator';
import { generateVueComponent } from '../generators/vueGenerator';
import { generateHtmlSnippet } from '../generators/htmlGenerator';
import { addTemplate } from '../storage/templateStorage';

interface RipDrawerProps {
  node: RipNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RipDrawer: React.FC<RipDrawerProps> = ({ node, isOpen, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('react');
  const [componentName, setComponentName] = useState('RippedComponent');
  const [copied, setCopied] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  // 模板保存表单状态
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'Card' | 'Button' | 'Navbar' | 'Pricing' | 'Dashboard' | 'Other'>('Card');

  if (!isOpen || !node) return null;

  const reactCode = generateReactComponent(node, componentName);
  const vueCode = generateVueComponent(node);
  const htmlCode = generateHtmlSnippet(node);

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
    const finalName = templateName.trim() || `${componentName} 模板`;
    await addTemplate({
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: finalName,
      category: templateCategory,
      sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      createdAt: Date.now(),
      node,
      reactCode,
      vueCode,
      htmlCode,
      tags: [templateCategory, node.tagName]
    });
    setSavingTemplate(false);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 4000);
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
  const totalNodes = countNodes(node);

  return (
    <div className="fixed inset-y-0 right-0 w-[560px] max-w-full bg-[#0d0e12]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-[9999999] text-slate-200 transition-all duration-300">
      {/* 头部导航 */}
      <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">RipUI Inspector</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            {totalNodes} DOM nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openTemplatesPage}
            title="查看已有模板中心 (在新页面打开)"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>模板库</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

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
      <div className="h-10 px-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 bg-white/[0.02]">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>&lt;{node.tagName}&gt; ({Math.round(node.width)}×{Math.round(node.height)}px)</span>
        </span>
        <span className="text-slate-500">100% Real Render Tree • Zero Guessing</span>
      </div>
    </div>
  );
};
