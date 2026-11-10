import { RipNode, ExtractionOptions } from './types';
import { convertComputedStylesToTailwind } from './cssToTailwind';

/**
 * 提取关键的计算样式子集（避免提取无用的数百个默认样式）
 */
function extractStyleSubset(el: Element): Record<string, string> {
  const computed = window.getComputedStyle(el);
  const subset: Record<string, string> = {};

  const keys: (keyof CSSStyleDeclaration)[] = [
    'display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap', 'gap',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign',
    'borderRadius', 'borderWidth', 'borderTopWidth', 'borderColor', 'borderStyle',
    'boxShadow', 'opacity', 'overflow', 'position', 'backdropFilter', 'cursor', 'transition'
  ];

  for (const k of keys) {
    const val = computed[k];
    if (val && typeof val === 'string' && val !== 'initial' && val !== 'auto') {
      subset[k as string] = val;
    }
  }

  return subset;
}

/**
 * 递归遍历与抽取真实 DOM 树
 */
export function extractDomTree(
  element: Element,
  options: Partial<ExtractionOptions> = {},
  depth = 0
): RipNode | null {
  if (!element || (options.maxDepth && depth > options.maxDepth)) {
    return null;
  }

  const tagName = element.tagName.toLowerCase();

  // 跳过 script, style, iframe 等污染标签
  if (['script', 'style', 'noscript', 'template', 'iframe'].includes(tagName)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  // 忽略尺寸为 0 且无内容的不可见元素
  if (rect.width === 0 && rect.height === 0 && !element.textContent?.trim()) {
    return null;
  }

  // 1. 特殊处理 SVG 矢量图形（100% 保真提取）
  if (tagName === 'svg') {
    const svgClone = element.cloneNode(true) as SVGElement;
    // 规范化属性
    const viewBox = svgClone.getAttribute('viewBox') || `0 0 ${rect.width || 24} ${rect.height || 24}`;
    svgClone.setAttribute('viewBox', viewBox);
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      tagName: 'svg',
      isSvg: true,
      svgContent: svgClone.outerHTML,
      attributes: {
        viewBox,
        fill: svgClone.getAttribute('fill') || 'currentColor'
      },
      computedStyles: extractStyleSubset(element),
      tailwindClasses: ['w-5', 'h-5', 'shrink-0'],
      children: [],
      width: rect.width,
      height: rect.height
    };
  }

  // 2. 普通元素提取
  const computedStyles = extractStyleSubset(element);
  const tailwindClasses = convertComputedStylesToTailwind(computedStyles, tagName);

  // 收集重要属性
  const attributes: Record<string, string> = {};
  if (element instanceof HTMLImageElement && element.src) {
    attributes.src = element.src;
    attributes.alt = element.alt || '';
  }
  if (element instanceof HTMLAnchorElement && element.href) {
    attributes.href = element.href;
  }
  if (element instanceof HTMLInputElement) {
    attributes.placeholder = element.placeholder || '';
    attributes.type = element.type || 'text';
  }

  // 3. 处理直接子文本节点
  let directText = '';
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent?.trim() || '';
      if (t) {
        directText += (directText ? ' ' : '') + t;
      }
    }
  }

  // 4. 递归处理子元素
  const children: RipNode[] = [];
  for (const child of Array.from(element.children)) {
    const childNode = extractDomTree(child, options, depth + 1);
    if (childNode) {
      children.push(childNode);
    }
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    tagName,
    text: directText || undefined,
    attributes,
    isSvg: false,
    computedStyles,
    tailwindClasses,
    children,
    width: rect.width,
    height: rect.height
  };
}
