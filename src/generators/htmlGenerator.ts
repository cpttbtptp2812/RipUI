import { RipNode } from '../engine/types';

function indent(level: number): string {
  return '  '.repeat(level);
}

function nodeToHtml(node: RipNode, level: number): string {
  const pad = indent(level);

  if (node.isSvg && node.svgContent) {
    return `${pad}${node.svgContent}`;
  }

  const tag = node.tagName;
  const classAttr = node.tailwindClasses.length > 0 
    ? ` class="${node.tailwindClasses.join(' ')}"` 
    : '';

  let extraAttrs = '';
  if (node.attributes.src) extraAttrs += ` src="${node.attributes.src}"`;
  if (node.attributes.alt) extraAttrs += ` alt="${node.attributes.alt}"`;
  if (node.attributes.href) extraAttrs += ` href="${node.attributes.href}"`;
  if (node.attributes.placeholder) extraAttrs += ` placeholder="${node.attributes.placeholder}"`;
  if (node.attributes.type) extraAttrs += ` type="${node.attributes.type}"`;

  if (['img', 'input', 'hr', 'br'].includes(tag)) {
    return `${pad}<${tag}${classAttr}${extraAttrs}>`;
  }

  if (node.children.length === 0) {
    if (node.text) {
      return `${pad}<${tag}${classAttr}${extraAttrs}>${node.text}</${tag}>`;
    }
    return `${pad}<${tag}${classAttr}${extraAttrs}></${tag}>`;
  }

  const childLines: string[] = [];
  if (node.text) {
    childLines.push(`${indent(level + 1)}${node.text}`);
  }
  for (const child of node.children) {
    childLines.push(nodeToHtml(child, level + 1));
  }

  return `${pad}<${tag}${classAttr}${extraAttrs}>\n${childLines.join('\n')}\n${pad}</${tag}>`;
}

export function generateHtmlSnippet(rootNode: RipNode): string {
  return nodeToHtml(rootNode, 0);
}
