import { RipNode } from '../engine/types';

function indent(level: number): string {
  return '  '.repeat(level);
}

function nodeToVueTemplate(node: RipNode, level: number): string {
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
    return `${pad}<${tag}${classAttr}${extraAttrs} />`;
  }

  if (node.children.length === 0) {
    if (node.text) {
      return `${pad}<${tag}${classAttr}${extraAttrs}>${node.text}</${tag}>`;
    }
    return `${pad}<${tag}${classAttr}${extraAttrs} />`;
  }

  const childLines: string[] = [];
  if (node.text) {
    childLines.push(`${indent(level + 1)}${node.text}`);
  }
  for (const child of node.children) {
    childLines.push(nodeToVueTemplate(child, level + 1));
  }

  return `${pad}<${tag}${classAttr}${extraAttrs}>\n${childLines.join('\n')}\n${pad}</${tag}>`;
}

export function generateVueComponent(rootNode: RipNode): string {
  const templateBody = nodeToVueTemplate(rootNode, 1);

  return `<script setup lang="ts">
// Ripped with RipUI ⚡
</script>

<template>
${templateBody}
</template>
`;
}

