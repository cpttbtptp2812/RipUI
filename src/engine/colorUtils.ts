/**
 * 颜色解析与 Tailwind 颜色映射工具
 */

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseCssColor(colorStr: string): RGB | null {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    };
  }

  // hex #ffffff or #fff
  const hexMatch = colorStr.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i) ||
                   colorStr.match(/^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i);
  if (hexMatch) {
    const expand = hexMatch[1].length === 1;
    const r = parseInt(expand ? hexMatch[1] + hexMatch[1] : hexMatch[1], 16);
    const g = parseInt(expand ? hexMatch[2] + hexMatch[2] : hexMatch[2], 16);
    const b = parseInt(expand ? hexMatch[3] + hexMatch[3] : hexMatch[3], 16);
    const a = hexMatch[4] ? parseInt(expand ? hexMatch[4] + hexMatch[4] : hexMatch[4], 16) / 255 : 1;
    return { r, g, b, a };
  }

  return null;
}

// 常见标准 Tailwind 色板映射字典
const TAILWIND_PALETTE: Record<string, RGB> = {
  'white': { r: 255, g: 255, b: 255, a: 1 },
  'black': { r: 0, g: 0, b: 0, a: 1 },
  'slate-50': { r: 248, g: 250, b: 252, a: 1 },
  'slate-100': { r: 241, g: 245, b: 249, a: 1 },
  'slate-200': { r: 226, g: 232, b: 240, a: 1 },
  'slate-300': { r: 203, g: 213, b: 225, a: 1 },
  'slate-400': { r: 148, g: 163, b: 184, a: 1 },
  'slate-500': { r: 100, g: 116, b: 139, a: 1 },
  'slate-600': { r: 71, g: 85, b: 105, a: 1 },
  'slate-700': { r: 51, g: 65, b: 85, a: 1 },
  'slate-800': { r: 30, g: 41, b: 59, a: 1 },
  'slate-900': { r: 15, g: 23, b: 42, a: 1 },
  'slate-950': { r: 2, g: 6, b: 23, a: 1 },
  
  'zinc-50': { r: 250, g: 250, b: 250, a: 1 },
  'zinc-100': { r: 244, g: 244, b: 245, a: 1 },
  'zinc-200': { r: 228, g: 228, b: 231, a: 1 },
  'zinc-300': { r: 212, g: 212, b: 216, a: 1 },
  'zinc-400': { r: 161, g: 161, b: 170, a: 1 },
  'zinc-500': { r: 113, g: 113, b: 122, a: 1 },
  'zinc-600': { r: 82, g: 82, b: 91, a: 1 },
  'zinc-700': { r: 63, g: 63, b: 70, a: 1 },
  'zinc-800': { r: 39, g: 39, b: 42, a: 1 },
  'zinc-900': { r: 24, g: 24, b: 27, a: 1 },
  'zinc-950': { r: 9, g: 9, b: 11, a: 1 },

  'blue-500': { r: 59, g: 130, b: 246, a: 1 },
  'blue-600': { r: 37, g: 99, b: 235, a: 1 },
  'indigo-500': { r: 99, g: 102, b: 241, a: 1 },
  'indigo-600': { r: 79, g: 70, b: 229, a: 1 },
  'emerald-500': { r: 16, g: 185, b: 129, a: 1 },
  'red-500': { r: 239, g: 68, b: 68, a: 1 },
  'amber-500': { r: 245, g: 158, b: 11, a: 1 },
};

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

export function toTailwindColor(prefix: 'bg' | 'text' | 'border', colorStr: string): string | null {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
    if (prefix === 'bg') return 'bg-transparent';
    if (prefix === 'border') return 'border-transparent';
    return null;
  }

  const rgb = parseCssColor(colorStr);
  if (!rgb) return null;

  if (rgb.a === 0) {
    return `${prefix}-transparent`;
  }

  // 匹配最近的已知色板（阈值很小才用标准命名，避免失真）
  let closestName = '';
  let minDiff = Infinity;
  for (const [name, target] of Object.entries(TAILWIND_PALETTE)) {
    const diff = colorDistance(rgb, target);
    if (diff < minDiff) {
      minDiff = diff;
      closestName = name;
    }
  }

  // 如果极其接近标准色（距离 < 10）
  if (minDiff < 10) {
    if (rgb.a < 0.99) {
      const alphaPercent = Math.round(rgb.a * 100);
      return `${prefix}-${closestName}/${alphaPercent}`;
    }
    return `${prefix}-${closestName}`;
  }

  // 否则使用 100% 精确的 Tailwind 任意值写法，保证 0 偏差
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  if (rgb.a < 0.99) {
    return `${prefix}-[rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})]`;
  }
  return `${prefix}-[#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}]`;
}

