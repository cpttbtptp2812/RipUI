import { DecompiledProject, DecompiledPage, DecompiledComponent, RecordingState } from '../engine/decompilerTypes';
import { RipNode } from '../engine/types';
import { generateReactComponent } from '../generators/reactGenerator';
import { generateVueComponent } from '../generators/vueGenerator';
import { generateHtmlSnippet } from '../generators/htmlGenerator';

const STORAGE_PROJECT_KEY = 'ripui_decompiled_projects';
const STORAGE_REC_STATE_KEY = 'ripui_recording_state';

// 官方精选预设反编译工程：Linear App Suite (多页面 + 多组件)
export const DEFAULT_DECOMPILED_PROJECTS: DecompiledProject[] = [
  {
    id: 'proj-linear-suite',
    name: 'Linear 极客管理套件 (多页面反编译)',
    domain: 'linear.app',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 2,
    pages: [
      {
        id: 'page-home',
        title: '产品落地首页 / Landing Page',
        url: 'https://linear.app/',
        route: '/',
        capturedAt: Date.now() - 3600000 * 48,
        components: [
          {
            id: 'comp-nav',
            name: '全站深色毛玻璃导航条',
            category: 'Navbar',
            tagName: 'nav',
            pageRoute: '/',
            capturedAt: Date.now() - 3600000 * 48,
            node: {
              id: 'node-nav',
              tagName: 'nav',
              isSvg: false,
              computedStyles: {},
              tailwindClasses: ['flex', 'items-center', 'justify-between', 'px-6', 'py-4', 'bg-[#0d0e12]/80', 'backdrop-blur-xl', 'border-b', 'border-white/10', 'text-white'],
              width: 1200,
              height: 64,
              attributes: {},
              children: [
                { id: 'logo', tagName: 'div', isSvg: false, computedStyles: {}, tailwindClasses: ['font-bold', 'text-base', 'tracking-tight'], text: 'LINEAR', attributes: {}, children: [], width: 80, height: 24 },
                { id: 'links', tagName: 'div', isSvg: false, computedStyles: {}, tailwindClasses: ['flex', 'items-center', 'gap-6', 'text-xs', 'text-slate-400'], attributes: {}, children: [
                  { id: 'l1', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['hover:text-white', 'cursor-pointer'], text: 'Features', attributes: {}, children: [], width: 50, height: 20 },
                  { id: 'l2', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['hover:text-white', 'cursor-pointer'], text: 'Changelog', attributes: {}, children: [], width: 60, height: 20 },
                  { id: 'l3', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['hover:text-white', 'cursor-pointer'], text: 'Pricing', attributes: {}, children: [], width: 40, height: 20 }
                ], width: 200, height: 24 },
                { id: 'cta', tagName: 'button', isSvg: false, computedStyles: {}, tailwindClasses: ['px-4', 'py-1.5', 'rounded-lg', 'bg-gradient-to-r', 'from-cyan-500', 'to-blue-600', 'text-xs', 'font-medium', 'text-white', 'shadow-md'], text: 'Get Started', attributes: {}, children: [], width: 90, height: 32 }
              ]
            },
            reactCode: `export const AppNavbar = () => (
  <nav className="flex items-center justify-between px-6 py-4 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/10 text-white">
    <div className="font-bold text-base tracking-tight">LINEAR</div>
    <div className="flex items-center gap-6 text-xs text-slate-400">
      <span className="hover:text-white cursor-pointer">Features</span>
      <span className="hover:text-white cursor-pointer">Changelog</span>
      <span className="hover:text-white cursor-pointer">Pricing</span>
    </div>
    <button className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-medium text-white shadow-md">
      Get Started
    </button>
  </nav>
);`,
            vueCode: `<template>
  <nav class="flex items-center justify-between px-6 py-4 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/10 text-white">
    <div class="font-bold text-base tracking-tight">LINEAR</div>
    <div class="flex items-center gap-6 text-xs text-slate-400">
      <span>Features</span>
      <span>Changelog</span>
      <span>Pricing</span>
    </div>
    <button class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-medium text-white shadow-md">
      Get Started
    </button>
  </nav>
</template>`,
            htmlCode: `<nav class="flex items-center justify-between px-6 py-4 bg-[#0d0e12]/80 backdrop-blur-xl border-b border-white/10 text-white">
  <div class="font-bold text-base tracking-tight">LINEAR</div>
  <button class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-medium text-white shadow-md">Get Started</button>
</nav>`
          },
          {
            id: 'comp-hero-btn',
            name: '发光主行动按钮 (Hero CTA Button)',
            category: 'Button',
            tagName: 'button',
            pageRoute: '/',
            capturedAt: Date.now() - 3600000 * 48,
            node: {
              id: 'node-btn',
              tagName: 'button',
              isSvg: false,
              computedStyles: {},
              tailwindClasses: ['px-6', 'py-3', 'rounded-xl', 'bg-gradient-to-r', 'from-cyan-500', 'via-sky-500', 'to-blue-600', 'text-white', 'text-sm', 'font-semibold', 'shadow-xl', 'shadow-cyan-500/25', 'hover:brightness-110', 'transition-all'],
              text: 'Start Using Linear Free ➔',
              width: 220,
              height: 48,
              attributes: {},
              children: []
            },
            reactCode: `export const PrimaryCtaButton = () => (
  <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white text-sm font-semibold shadow-xl shadow-cyan-500/25 hover:brightness-110 transition-all">
    Start Using Linear Free ➔
  </button>
);`,
            vueCode: `<template>
  <button class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white text-sm font-semibold shadow-xl shadow-cyan-500/25 hover:brightness-110 transition-all">
    Start Using Linear Free ➔
  </button>
</template>`,
            htmlCode: `<button class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white text-sm font-semibold shadow-xl shadow-cyan-500/25">Start Using Linear Free ➔</button>`
          }
        ]
      },
      {
        id: 'page-dashboard',
        title: '项目工作台 / Issues Dashboard',
        url: 'https://linear.app/workspace/issues',
        route: '/issues',
        capturedAt: Date.now() - 3600000 * 24,
        components: [
          {
            id: 'comp-issue-card',
            name: '任务状态卡片 (Issue Item Card)',
            category: 'Card',
            tagName: 'div',
            pageRoute: '/issues',
            capturedAt: Date.now() - 3600000 * 24,
            node: {
              id: 'node-iss',
              tagName: 'div',
              isSvg: false,
              computedStyles: {},
              tailwindClasses: ['rounded-xl', 'border', 'border-white/10', 'bg-[#12151c]/90', 'p-4', 'text-white', 'flex', 'items-center', 'justify-between'],
              width: 800,
              height: 56,
              attributes: {},
              children: [
                { id: 'left', tagName: 'div', isSvg: false, computedStyles: {}, tailwindClasses: ['flex', 'items-center', 'gap-3'], text: 'LIN-1024 · Refactor state engine', attributes: {}, children: [], width: 300, height: 20 },
                { id: 'tag', tagName: 'span', isSvg: false, computedStyles: {}, tailwindClasses: ['text-xs', 'px-2', 'py-0.5', 'rounded', 'bg-emerald-500/20', 'text-emerald-400'], text: 'Done', attributes: {}, children: [], width: 50, height: 20 }
              ]
            },
            reactCode: `export const IssueRow = () => (
  <div className="rounded-xl border border-white/10 bg-[#12151c]/90 p-4 text-white flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-cyan-400 font-mono text-xs">LIN-1024</span>
      <span className="text-sm">Refactor state engine</span>
    </div>
    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Done</span>
  </div>
);`,
            vueCode: `<template>
  <div class="rounded-xl border border-white/10 bg-[#12151c]/90 p-4 text-white flex items-center justify-between">
    <span>LIN-1024 · Refactor state engine</span>
    <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Done</span>
  </div>
</template>`,
            htmlCode: `<div class="rounded-xl border border-white/10 bg-[#12151c]/90 p-4 text-white flex items-center justify-between">
  <span>LIN-1024 · Refactor state engine</span>
  <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Done</span>
</div>`
          }
        ]
      }
    ],
    globalComponents: []
  }
];

export async function getDecompiledProjects(): Promise<DecompiledProject[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const data = await chrome.storage.local.get(STORAGE_PROJECT_KEY);
      if (data && Array.isArray(data[STORAGE_PROJECT_KEY]) && data[STORAGE_PROJECT_KEY].length > 0) {
        return data[STORAGE_PROJECT_KEY];
      }
    }
  } catch (e) {}

  const raw = localStorage.getItem(STORAGE_PROJECT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  await saveDecompiledProjects(DEFAULT_DECOMPILED_PROJECTS);
  return DEFAULT_DECOMPILED_PROJECTS;
}

export async function saveDecompiledProjects(projects: DecompiledProject[]): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_PROJECT_KEY]: projects });
    }
  } catch (e) {}
  try {
    localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(projects));
  } catch (e) {}
}

export async function getRecordingState(): Promise<RecordingState> {
  const defaultState: RecordingState = {
    isRecording: false,
    projectId: '',
    projectName: '',
    capturedCount: 0,
    currentPageTitle: '',
    currentPageRoute: ''
  };

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const data = await chrome.storage.local.get(STORAGE_REC_STATE_KEY);
      if (data && data[STORAGE_REC_STATE_KEY]) return data[STORAGE_REC_STATE_KEY];
    }
  } catch (e) {}

  const raw = localStorage.getItem(STORAGE_REC_STATE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return defaultState;
}

export async function setRecordingState(state: RecordingState): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_REC_STATE_KEY]: state });
    }
  } catch (e) {}
  try {
    localStorage.setItem(STORAGE_REC_STATE_KEY, JSON.stringify(state));
  } catch (e) {}
}

/**
 * 录制捕获一个组件，自动归档到当前页面和项目中
 */
export async function captureComponentToProject(
  node: RipNode,
  componentName: string,
  category: DecompiledComponent['category']
): Promise<void> {
  const rec = await getRecordingState();
  const projects = await getDecompiledProjects();

  const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageTitle = typeof document !== 'undefined' ? (document.title || 'Untitled Page') : 'Current Page';

  let currentProject = projects.find(p => p.id === rec.projectId);
  if (!currentProject) {
    // 自动以当前域名创建项目
    currentProject = {
      id: `proj-${Date.now()}`,
      name: `${domain} 全站反编译工程`,
      domain,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages: [],
      globalComponents: []
    };
    projects.unshift(currentProject);
  }

  // 检查是否已有该页面
  let page = currentProject.pages.find(p => p.route === pathname);
  if (!page) {
    page = {
      id: `page-${Date.now()}`,
      title: pageTitle,
      url,
      route: pathname,
      components: [],
      capturedAt: Date.now()
    };
    currentProject.pages.push(page);
  }

  const reactCode = generateReactComponent(node, componentName);
  const vueCode = generateVueComponent(node);
  const htmlCode = generateHtmlSnippet(node);

  const decompiledComp: DecompiledComponent = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: componentName || `${node.tagName} 组件`,
    category,
    tagName: node.tagName,
    pageRoute: pathname,
    node,
    reactCode,
    vueCode,
    htmlCode,
    capturedAt: Date.now()
  };

  page.components.unshift(decompiledComp);
  currentProject.updatedAt = Date.now();

  await saveDecompiledProjects(projects);

  // 更新录制状态计数
  rec.isRecording = true;
  rec.projectId = currentProject.id;
  rec.projectName = currentProject.name;
  rec.capturedCount = currentProject.pages.reduce((acc, p) => acc + p.components.length, 0);
  rec.currentPageTitle = pageTitle;
  rec.currentPageRoute = pathname;
  await setRecordingState(rec);
}
