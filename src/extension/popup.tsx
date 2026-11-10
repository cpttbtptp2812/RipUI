import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Zap, MousePointer, Github, Keyboard, Bookmark, ExternalLink } from 'lucide-react';
import { getTemplates } from '../storage/templateStorage';

function Popup() {
  const [templateCount, setTemplateCount] = useState(0);

  useEffect(() => {
    getTemplates().then((list) => setTemplateCount(list.length));
  }, []);

  const triggerInspect = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RIPUI' });
        window.close();
      }
    }
  };

  const openTemplatesPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL('templates.html') });
      window.close();
    } else {
      window.open('/templates.html', '_blank');
    }
  };

  return (
    <div className="p-4 space-y-3.5 bg-[#090b10] text-slate-100 w-[300px] select-none font-sans">
      {/* 头部 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">RipUI ⚡</span>
            <span className="block text-[10px] text-slate-400">Real DOM Ripper</span>
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
          v0.1.0
        </span>
      </div>

      {/* 核心操作 1：圈选网页元素 */}
      <button
        onClick={triggerInspect}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
      >
        <MousePointer className="w-3.5 h-3.5" />
        <span>圈选网页元素 (Alt + R)</span>
      </button>

      {/* 核心操作 2：打开已有模板库 */}
      <button
        onClick={openTemplatesPage}
        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-between px-3 transition-all cursor-pointer group"
      >
        <span className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>已有组件模板库</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {templateCount}
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </button>

      {/* 快捷键提示卡片 */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" />
          <span>快捷键:</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px] text-cyan-400">
          Alt + R
        </kbd>
      </div>

      {/* 底部链接 */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
        <span>Zero hallucination</span>
        <a
          href="https://github.com/cpttbtptp2812/RipUI"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}

const root = document.getElementById('popup-root');
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
}
