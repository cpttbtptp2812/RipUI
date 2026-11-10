import { RipNode } from '../engine/types';
import { generateReactComponent } from '../generators/reactGenerator';
import { generateVueComponent } from '../generators/vueGenerator';
import { generateHtmlSnippet } from '../generators/htmlGenerator';

export interface RipTemplate {
  id: string;
  name: string;
  category: 'Card' | 'Button' | 'Navbar' | 'Pricing' | 'Dashboard' | 'Other';
  sourceUrl?: string;
  createdAt: number;
  node: RipNode;
  reactCode: string;
  vueCode: string;
  htmlCode: string;
  tags?: string[];
}

// 4个开箱即用世界级预设模板
export const DEFAULT_PRESET_TEMPLATES: RipTemplate[] = [
  {
    id: 'preset-stripe-pricing',
    name: 'Stripe SaaS Pro 订阅卡片',
    category: 'Pricing',
    sourceUrl: 'https://stripe.com/pricing',
    createdAt: Date.now() - 3600000 * 24 * 2,
    tags: ['SaaS', 'Stripe', 'Pricing', 'Gradient'],
    node: {
      id: 'node-stripe',
      tagName: 'div',
      isSvg: false,
      computedStyles: {},
      tailwindClasses: ['relative', 'overflow-hidden', 'rounded-2xl', 'border', 'border-cyan-500/30', 'bg-gradient-to-b', 'from-slate-900', 'to-slate-950', 'p-6', 'text-white', 'shadow-2xl'],
      width: 360,
      height: 420,
      attributes: {},
      children: [
        {
          id: 'badge',
          tagName: 'div',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['inline-block', 'rounded-full', 'bg-cyan-500/10', 'px-3', 'py-1', 'text-xs', 'font-semibold', 'text-cyan-400', 'border', 'border-cyan-500/20', 'mb-4'],
          text: 'MOST POPULAR',
          attributes: {},
          children: [],
          width: 100,
          height: 24
        },
        {
          id: 'price-row',
          tagName: 'div',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['flex', 'items-baseline', 'gap-1', 'mb-2'],
          attributes: {},
          children: [
            { id: 'price', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['text-4xl', 'font-extrabold', 'tracking-tight'], text: '$29', attributes: {}, children: [], width: 70, height: 40 },
            { id: 'cycle', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['text-sm', 'text-slate-400'], text: '/ month', attributes: {}, children: [], width: 50, height: 20 }
          ],
          width: 200,
          height: 40
        },
        {
          id: 'desc',
          tagName: 'p',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['text-xs', 'text-slate-400', 'leading-relaxed', 'mb-6'],
          text: 'Everything you need to reverse engineer live components with zero loss and 100% SVG fidelity.',
          attributes: {},
          children: [],
          width: 300,
          height: 36
        },
        {
          id: 'btn',
          tagName: 'button',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['w-full', 'rounded-xl', 'bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'py-2.5', 'text-xs', 'font-semibold', 'text-white', 'shadow-lg', 'shadow-cyan-500/25', 'hover:brightness-110', 'transition-all'],
          text: 'Get Started Now ➔',
          attributes: {},
          children: [],
          width: 300,
          height: 38
        }
      ]
    },
    reactCode: `import React from 'react';

export const StripePricingCard: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl">
      <div className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-4">
        MOST POPULAR
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-extrabold tracking-tight">$29</span>
        <span className="text-sm text-slate-400">/ month</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-6">
        Everything you need to reverse engineer live components with zero loss and 100% SVG fidelity.
      </p>
      <button className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all">
        Get Started Now ➔
      </button>
    </div>
  );
};

export default StripePricingCard;`,
    vueCode: `<template>
  <div class="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl">
    <div class="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-4">
      MOST POPULAR
    </div>
    <div class="flex items-baseline gap-1 mb-2">
      <span className="text-4xl font-extrabold tracking-tight">$29</span>
      <span className="text-sm text-slate-400">/ month</span>
    </div>
    <p className="text-xs text-slate-400 leading-relaxed mb-6">
      Everything you need to reverse engineer live components with zero loss and 100% SVG fidelity.
    </p>
    <button class="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all">
      Get Started Now ➔
    </button>
  </div>
</template>`,
    htmlCode: `<div class="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white shadow-2xl">
  <div class="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-4">
    MOST POPULAR
  </div>
  <div class="flex items-baseline gap-1 mb-2">
    <span class="text-4xl font-extrabold tracking-tight">$29</span>
    <span class="text-sm text-slate-400">/ month</span>
  </div>
  <p class="text-xs text-slate-400 leading-relaxed mb-6">
    Everything you need to reverse engineer live components with zero loss and 100% SVG fidelity.
  </p>
  <button class="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all">
    Get Started Now ➔
  </button>
</div>`
  },
  {
    id: 'preset-linear-issue',
    name: 'Linear 极简 Issue 浮层卡片',
    category: 'Card',
    sourceUrl: 'https://linear.app',
    createdAt: Date.now() - 3600000 * 24,
    tags: ['Linear', 'Dark', 'Issue', 'Minimal'],
    node: {
      id: 'node-linear',
      tagName: 'div',
      isSvg: false,
      computedStyles: {},
      tailwindClasses: ['rounded-xl', 'border', 'border-white/10', 'bg-[#12151c]/90', 'backdrop-blur-xl', 'p-5', 'text-slate-200', 'shadow-xl', 'hover:border-cyan-500/30', 'transition-all'],
      width: 380,
      height: 180,
      attributes: {},
      children: [
        {
          id: 'lin-header',
          tagName: 'div',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['flex', 'items-center', 'justify-between', 'mb-3'],
          attributes: {},
          children: [
            { id: 'lin-id', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['font-mono', 'text-xs', 'text-cyan-400', 'bg-cyan-500/10', 'px-2', 'py-0.5', 'rounded'], text: 'LIN-5912', attributes: {}, children: [], width: 60, height: 20 },
            { id: 'lin-status', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['flex', 'items-center', 'gap-1.5', 'text-xs', 'text-emerald-400'], text: '● In Review', attributes: {}, children: [], width: 70, height: 20 }
          ],
          width: 340,
          height: 24
        },
        {
          id: 'lin-title',
          tagName: 'h4',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['text-sm', 'font-semibold', 'text-white', 'mb-2'],
          text: 'Real-time DOM reverse-engineering engine for AI UI Generation',
          attributes: {},
          children: [],
          width: 340,
          height: 24
        },
        {
          id: 'lin-footer',
          tagName: 'div',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['flex', 'items-center', 'justify-between', 'pt-3', 'border-t', 'border-white/5', 'text-[11px]', 'text-slate-400'],
          attributes: {},
          children: [
            { id: 'lin-author', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['font-medium'], text: 'Assignee: WangXu', attributes: {}, children: [], width: 100, height: 16 },
            { id: 'lin-priority', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['px-2', 'py-0.5', 'rounded', 'bg-rose-500/10', 'text-rose-400'], text: 'Urgent', attributes: {}, children: [], width: 45, height: 16 }
          ],
          width: 340,
          height: 20
        }
      ]
    },
    reactCode: `import React from 'react';

export const LinearIssueCard: React.FC = () => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12151c]/90 backdrop-blur-xl p-5 text-slate-200 shadow-xl hover:border-cyan-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">LIN-5912</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">● In Review</span>
      </div>
      <h4 className="text-sm font-semibold text-white mb-2">
        Real-time DOM reverse-engineering engine for AI UI Generation
      </h4>
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
        <span className="font-medium">Assignee: WangXu</span>
        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">Urgent</span>
      </div>
    </div>
  );
};

export default LinearIssueCard;`,
    vueCode: `<template>
  <div class="rounded-xl border border-white/10 bg-[#12151c]/90 backdrop-blur-xl p-5 text-slate-200 shadow-xl hover:border-cyan-500/30 transition-all">
    <div class="flex items-center justify-between mb-3">
      <span class="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">LIN-5912</span>
      <span class="flex items-center gap-1.5 text-xs text-emerald-400">● In Review</span>
    </div>
    <h4 class="text-sm font-semibold text-white mb-2">
      Real-time DOM reverse-engineering engine for AI UI Generation
    </h4>
    <div class="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
      <span class="font-medium">Assignee: WangXu</span>
      <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">Urgent</span>
    </div>
  </div>
</template>`,
    htmlCode: `<div class="rounded-xl border border-white/10 bg-[#12151c]/90 backdrop-blur-xl p-5 text-slate-200 shadow-xl hover:border-cyan-500/30 transition-all">
  <div class="flex items-center justify-between mb-3">
    <span class="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">LIN-5912</span>
    <span class="flex items-center gap-1.5 text-xs text-emerald-400">● In Review</span>
  </div>
  <h4 class="text-sm font-semibold text-white mb-2">
    Real-time DOM reverse-engineering engine for AI UI Generation
  </h4>
  <div class="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
    <span class="font-medium">Assignee: WangXu</span>
    <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">Urgent</span>
  </div>
</div>`
  },
  {
    id: 'preset-vercel-deploy',
    name: 'Vercel 流水线状态监控条',
    category: 'Dashboard',
    sourceUrl: 'https://vercel.com',
    createdAt: Date.now() - 3600000 * 12,
    tags: ['Vercel', 'CI/CD', 'Git', 'Status'],
    node: {
      id: 'node-vercel',
      tagName: 'div',
      isSvg: false,
      computedStyles: {},
      tailwindClasses: ['flex', 'items-center', 'justify-between', 'rounded-xl', 'border', 'border-white/10', 'bg-black/60', 'px-4', 'py-3', 'text-white'],
      width: 420,
      height: 60,
      attributes: {},
      children: [
        {
          id: 'v-left',
          tagName: 'div',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['flex', 'items-center', 'gap-3'],
          attributes: {},
          children: [
            { id: 'v-dot', tagName: 'div', isSvg: false, computedStyles: {}, tailwindClasses: ['w-2.5', 'h-2.5', 'rounded-full', 'bg-emerald-500', 'animate-pulse'], attributes: {}, children: [], width: 10, height: 10 },
            { id: 'v-branch', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['font-mono', 'text-xs', 'text-slate-300'], text: 'main (7ccf26e)', attributes: {}, children: [], width: 90, height: 18 }
          ],
          width: 140,
          height: 24
        },
        {
          id: 'v-url',
          tagName: 'span',
          isSvg: false,
          computedStyles: {},
          tailwindClasses: ['font-mono', 'text-xs', 'text-cyan-400', 'hover:underline', 'cursor-pointer'],
          text: 'ripui.vercel.app',
          attributes: {},
          children: [],
          width: 110,
          height: 18
        }
      ]
    },
    reactCode: `import React from 'react';

export const VercelDeployBar: React.FC = () => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-xs text-slate-300">main (7ccf26e)</span>
      </div>
      <span className="font-mono text-xs text-cyan-400 hover:underline cursor-pointer">
        ripui.vercel.app
      </span>
    </div>
  );
};

export default VercelDeployBar;`,
    vueCode: `<template>
  <div class="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white">
    <div class="flex items-center gap-3">
      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
      <span class="font-mono text-xs text-slate-300">main (7ccf26e)</span>
    </div>
    <span class="font-mono text-xs text-cyan-400 hover:underline cursor-pointer">
      ripui.vercel.app
    </span>
  </div>
</template>`,
    htmlCode: `<div class="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white">
  <div class="flex items-center gap-3">
    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
    <span class="font-mono text-xs text-slate-300">main (7ccf26e)</span>
  </div>
  <span class="font-mono text-xs text-cyan-400 hover:underline cursor-pointer">
    ripui.vercel.app
  </span>
</div>`
  }
];

const STORAGE_KEY = 'ripui_saved_templates';

/**
 * 读写存储（自动兼容 chrome.storage.local 与 localStorage）
 */
export async function getTemplates(): Promise<RipTemplate[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      if (data && Array.isArray(data[STORAGE_KEY]) && data[STORAGE_KEY].length > 0) {
        return data[STORAGE_KEY];
      }
    }
  } catch (e) {
    console.warn('[RipUI Storage] chrome.storage reading fallback', e);
  }

  // fallback localStorage
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // 默认填充预设模板并持久化
  await saveTemplates(DEFAULT_PRESET_TEMPLATES);
  return DEFAULT_PRESET_TEMPLATES;
}

export async function saveTemplates(templates: RipTemplate[]): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: templates });
    }
  } catch (e) {
    console.warn('[RipUI Storage] chrome.storage writing error', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn('[RipUI Storage] localStorage writing error', e);
  }
}

export async function addTemplate(template: RipTemplate): Promise<void> {
  const current = await getTemplates();
  // 插入到最前面
  const updated = [template, ...current.filter((t) => t.id !== template.id)];
  await saveTemplates(updated);
}

export async function deleteTemplate(id: string): Promise<RipTemplate[]> {
  const current = await getTemplates();
  const updated = current.filter((t) => t.id !== id);
  await saveTemplates(updated);
  return updated;
}
