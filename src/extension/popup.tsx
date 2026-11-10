import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Zap, MousePointer, Github, Bookmark, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { getTemplates } from '../storage/templateStorage';
import '../index.css';

function Popup() {
  const [templateCount, setTemplateCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    getTemplates().then((list) => setTemplateCount(list.length));
  }, []);

  const triggerInspect = async () => {
    setStatusMsg('');
    setIsActivating(true);

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      // 处于本地调试环境
      setStatusMsg('本地调试模式，请按 Alt + R 测试');
      setIsActivating(false);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatusMsg('未检测到活跃网页标签');
        setIsActivating(false);
        return;
      }

      const url = tab.url || '';
      // 检查 Chrome / Edge 内部特权受限页面
      if (
        url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('edge://') || 
        url.startsWith('about:') ||
        url.includes('chromewebstore.google.com')
      ) {
        setStatusMsg('⚠️ 浏览器系统/扩展页面受安全保护，请在常规网站(如百度/GitHub等)中使用！');
        setIsActivating(false);
        return;
      }

      // 1. 尝试直接给当前页面发消息激活
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RIPUI' }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          // 说明该网页在扩展安装前就已打开，尚未注入 content.js，现场动态注入！
          if (chrome.scripting) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id! },
                files: ['content.js']
              });

              // 注入完成后立即触发开启
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_RIPUI' }, () => {
                  window.close();
                });
              }, 150);
            } catch (err: any) {
              console.error('[RipUI] 动态注入失败:', err);
              setStatusMsg('请刷新一下当前网页即可激活圈选');
              setIsActivating(false);
            }
          } else {
            setStatusMsg('请刷新当前网页后重试');
            setIsActivating(false);
          }
        } else {
          // 成功激活，直接关闭弹窗
          window.close();
        }
      });
    } catch (err: any) {
      console.error('[RipUI popup error]', err);
      setStatusMsg('激活失败: ' + (err.message || '未知异常'));
      setIsActivating(false);
    }
  };

  const openTemplatesPage = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime?.getURL) {
      const targetUrl = chrome.runtime.getURL('templates.html');
      chrome.tabs.create({ url: targetUrl }, () => {
        window.close();
      });
    } else {
      window.open('/templates.html', '_blank');
    }
  };

  return (
    <div className="w-[324px] bg-[#0d1017] text-slate-100 p-3.5 space-y-3 font-sans border border-cyan-500/30 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* 顶部微光发光氛围 */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* 头部：品牌卡片框 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-white/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">RipUI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-medium">
                v0.1.0
              </span>
            </div>
            <span className="block text-[11px] text-slate-400">Real DOM to React + Tailwind</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>READY</span>
        </div>
      </div>

      {/* 异常或提示横幅 */}
      {statusMsg && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2 animate-fadeIn relative z-10 leading-snug">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 核心操作区：独立边框卡片 */}
      <div className="space-y-2 relative z-10">
        {/* 卡片 1：圈选网页元素 (高光主操作，带发光边框) */}
        <button
          onClick={triggerInspect}
          disabled={isActivating}
          className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-blue-600/15 hover:from-cyan-500/25 hover:to-blue-600/25 border border-cyan-500/40 hover:border-cyan-400 text-white transition-all duration-200 group relative overflow-hidden shadow-md shadow-cyan-950/50 cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-inner">
                <MousePointer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-cyan-200 transition-colors flex items-center gap-1">
                  <span>{isActivating ? '正在唤起圈选...' : '圈选网页元素'}</span>
                </div>
                <div className="text-[10px] text-slate-400">物理级精准提取，零丢失</div>
              </div>
            </div>

            <div className="px-2 py-1 rounded-md bg-black/50 border border-cyan-500/30 font-mono text-[10px] text-cyan-300 shadow-sm flex items-center gap-1">
              <span>Alt</span>
              <span>+</span>
              <span>R</span>
            </div>
          </div>
        </button>

        {/* 卡片 2：已有组件模板库 (磨砂金边框卡片) */}
        <button
          onClick={openTemplatesPage}
          className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-amber-500/30 hover:border-amber-400/60 text-slate-200 hover:text-white transition-all duration-200 group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-inner">
                <Bookmark className="w-4 h-4" />
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

            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-300 group-hover:bg-amber-500/10 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      </div>

      {/* 底部信息托盘卡片 */}
      <div className="pt-2 px-1 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5 text-slate-400">
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
