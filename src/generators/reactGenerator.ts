import { RipNode } from '../engine/types';

function indent(level: number): string {
  return '  '.repeat(level);
}

function nodeToJsx(node: RipNode, level: number): string {
  const pad = indent(level);

  // 1. SVG 直接保留或渲染
  if (node.isSvg && node.svgContent) {
    // 将 class 替换为 className
    const cleanSvg = node.svgContent
      .replace(/class=/g, 'className=')
      .replace(/stroke-width=/g, 'strokeWidth=')
      .replace(/stroke-linecap=/g, 'strokeLinecap=')
      .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
      .replace(/fill-rule=/g, 'fillRule=')
      .replace(/clip-rule=/g, 'clipRule=');
    return `${pad}${cleanSvg}`;
  }

  const tag = node.tagName === 'a' ? 'a' : node.tagName;
  const classAttr = node.tailwindClasses.length > 0 
    ? ` className="${node.tailwindClasses.join(' ')}"` 
    : '';

  // 构建其他常用属性
  let extraAttrs = '';
  if (node.attributes.src) extraAttrs += ` src="${node.attributes.src}"`;
  if (node.attributes.alt) extraAttrs += ` alt="${node.attributes.alt}"`;
  if (node.attributes.href) extraAttrs += ` href="${node.attributes.href}"`;
  if (node.attributes.placeholder) extraAttrs += ` placeholder="${node.attributes.placeholder}"`;
  if (node.attributes.type) extraAttrs += ` type="${node.attributes.type}"`;

  // 自闭合标签
  if (['img', 'input', 'hr', 'br'].includes(tag)) {
    return `${pad}<${tag}${classAttr}${extraAttrs} />`;
  }

  // 无子元素且仅有文本
  if (node.children.length === 0) {
    if (node.text) {
      return `${pad}<${tag}${classAttr}${extraAttrs}>${node.text}</${tag}>`;
    }
    return `${pad}<${tag}${classAttr}${extraAttrs} />`;
  }

  // 含有子元素
  const childLines: string[] = [];
  if (node.text) {
    childLines.push(`${indent(level + 1)}${node.text}`);
  }
  for (const child of node.children) {
    childLines.push(nodeToJsx(child, level + 1));
  }

  return `${pad}<${tag}${classAttr}${extraAttrs}>\n${childLines.join('\n')}\n${pad}</${tag}>`;
}

export function generateReactComponent(rootNode: RipNode, componentName = 'RippedComponent'): string {
  const jsxBody = nodeToJsx(rootNode, 2);

  return `import React from 'react';

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
${jsxBody}
  );
};

export default ${componentName};
`;
}

