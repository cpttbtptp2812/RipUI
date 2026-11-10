import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Zap, MousePointer, Github, Bookmark, ArrowUpRight, Sparkles } from 'lucide-react';
import { getTemplates } from '../storage/templateStorage';
import '../index.css';

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
    <div className="w-[320px] bg-[#090b10] text-slate-100 p-4 space-y-3.5 font-sans border border-white/10 rounded-none shadow-2xl">
      {/* 头部：品牌与状态 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/25">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">RipUI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-medium">
                v0.1.0
              </span>
            </div>
            <span className="block text-[11px] text-slate-400">Real DOM to React + Tailwind</span>
          </div>
        </div>

        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* 主操作区：两张高质感卡片按钮 */}
      <div className="space-y-2.5 pt-0.5">
        {/* 卡片 1：圈选网页元素 (高光主操作) */}
        <button
          onClick={triggerInspect}
          className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 hover:border-cyan-400 text-white transition-all duration-200 group relative overflow-hidden shadow-lg shadow-cyan-950/40 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <MousePointer className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-cyan-200 transition-colors">
                  圈选网页元素
                </div>
                <div className="text-[10px] text-slate-400">物理级精确提取，零丢失</div>
              </div>
            </div>

            <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-cyan-300 shadow-sm">
              Alt + R
            </kbd>
          </div>
        </button>

        {/* 卡片 2：已有模板库 (在新页面打开) */}
        <button
          onClick={openTemplatesPage}
          className="w-full text-left p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white transition-all duration-200 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                  <span>已有组件模板库</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {templateCount}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">在新标签页大屏管理与预览</div>
              </div>
            </div>

            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </button>
      </div>

      {/* 底部信息条 */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Zero Hallucination</span>
        </span>

        <a
          href="https://github.com/cpttbtptp2812/RipUI"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Star on GitHub</span>
        </a>
      </div>
    </div>
  );
}

const root = document.getElementById('popup-root');
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
}
