import React, { useState } from 'react';
import { Copy, Check, X, Code, Eye, Layers, Sparkles, Download } from 'lucide-react';
import { RipNode, ExportFormat } from '../engine/types';
import { generateReactComponent } from '../generators/reactGenerator';
import { generateVueComponent } from '../generators/vueGenerator';
import { generateHtmlSnippet } from '../generators/htmlGenerator';

interface RipDrawerProps {
  node: RipNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RipDrawer: React.FC<RipDrawerProps> = ({ node, isOpen, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('react');
  const [componentName, setComponentName] = useState('PricingCard');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !node) return null;

  let generatedCode = '';
  if (format === 'react') {
    generatedCode = generateReactComponent(node, componentName);
  } else if (format === 'vue') {
    generatedCode = generateVueComponent(node);
  } else {
    generatedCode = generateHtmlSnippet(node);
  }

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

  // 统计节点总数
  const countNodes = (n: RipNode): number => {
    return 1 + n.children.reduce((acc, curr) => acc + countNodes(curr), 0);
  };
  const totalNodes = countNodes(node);

  return (
    <div className="fixed inset-y-0 right-0 w-[540px] max-w-full bg-[#0d0e12]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-[9999999] text-slate-200 transition-all duration-300">
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

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 控制栏：格式选择 & 组件命名 */}
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
              onClick={handleDownload}
              title="Download file"
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
              {copied ? 'Copied!' : 'Copy Component'}
            </button>
          </div>
        </div>

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
