import { toTailwindColor } from './colorUtils';

/**
 * 将 px 数值转换为 Tailwind 的标准 spacing 阶梯 (4px = 1)
 */
function pxToTailwind(val: string, prefix: string): string | null {
  if (!val || val === '0px' || val === '0') {
    return `${prefix}-0`;
  }
  const match = val.match(/^([\d.]+)px$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (num === 0) return `${prefix}-0`;

  // 常用对照表
  const scaleMap: Record<number, string> = {
    1: 'px',
    2: '0.5',
    4: '1',
    6: '1.5',
    8: '2',
    10: '2.5',
    12: '3',
    14: '3.5',
    16: '4',
    20: '5',
    24: '6',
    28: '7',
    32: '8',
    36: '9',
    40: '10',
    44: '11',
    48: '12',
    56: '14',
    64: '16',
    72: '18',
    80: '20',
    96: '24'
  };

  const closest = scaleMap[Math.round(num)];
  if (closest) {
    return `${prefix}-${closest}`;
  }

  // fallback to arbitrary value
  return `${prefix}-[${num}px]`;
}

/**
 * 核心样式转 Tailwind 转换器
 */
export function convertComputedStylesToTailwind(styles: Record<string, string>, tagName: string): string[] {
  const classes: string[] = [];

  // 1. Display
  const display = styles.display || '';
  if (display === 'flex') {
    classes.push('flex');
    if (styles.flexDirection === 'column') classes.push('flex-col');
    if (styles.flexWrap === 'wrap') classes.push('flex-wrap');
    
    // Justify
    const jc = styles.justifyContent;
    if (jc === 'center') classes.push('justify-center');
    else if (jc === 'space-between') classes.push('justify-between');
    else if (jc === 'space-around') classes.push('justify-around');
    else if (jc === 'flex-end') classes.push('justify-end');
    else if (jc === 'flex-start') classes.push('justify-start');

    // Align Items
    const ai = styles.alignItems;
    if (ai === 'center') classes.push('items-center');
    else if (ai === 'flex-start') classes.push('items-start');
    else if (ai === 'flex-end') classes.push('items-end');
    else if (ai === 'baseline') classes.push('items-baseline');
  } else if (display === 'inline-flex') {
    classes.push('inline-flex');
    if (styles.flexDirection === 'column') classes.push('flex-col');
    if (styles.alignItems === 'center') classes.push('items-center');
    if (styles.justifyContent === 'center') classes.push('justify-center');
  } else if (display === 'grid') {
    classes.push('grid');
  } else if (display === 'inline-block') {
    classes.push('inline-block');
  } else if (display === 'none') {
    classes.push('hidden');
  }

  // 2. Gap
  if (styles.gap && styles.gap !== 'normal' && styles.gap !== '0px') {
    const gapCls = pxToTailwind(styles.gap, 'gap');
    if (gapCls) classes.push(gapCls);
  }

  // 3. Spacing (Padding)
  const pt = styles.paddingTop || '0px';
  const pr = styles.paddingRight || '0px';
  const pb = styles.paddingBottom || '0px';
  const pl = styles.paddingLeft || '0px';

  if (pt === pr && pr === pb && pb === pl && pt !== '0px') {
    const p = pxToTailwind(pt, 'p');
    if (p) classes.push(p);
  } else {
    if (pl === pr && pl !== '0px') {
      const px = pxToTailwind(pl, 'px');
      if (px) classes.push(px);
    } else {
      if (pl !== '0px') classes.push(pxToTailwind(pl, 'pl') || '');
      if (pr !== '0px') classes.push(pxToTailwind(pr, 'pr') || '');
    }

    if (pt === pb && pt !== '0px') {
      const py = pxToTailwind(pt, 'py');
      if (py) classes.push(py);
    } else {
      if (pt !== '0px') classes.push(pxToTailwind(pt, 'pt') || '');
      if (pb !== '0px') classes.push(pxToTailwind(pb, 'pb') || '');
    }
  }

  // 4. Colors & Background
  const bg = styles.backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    const bgCls = toTailwindColor('bg', bg);
    if (bgCls) classes.push(bgCls);
  }

  // 5. Typography (仅对含有文本或基础标签生效)
  const color = styles.color;
  if (color && color !== 'inherit') {
    const textCls = toTailwindColor('text', color);
    if (textCls) classes.push(textCls);
  }

  // Font Size & Weight
  const fontSize = styles.fontSize;
  if (fontSize) {
    const num = parseFloat(fontSize);
    if (num <= 12) classes.push('text-xs');
    else if (num <= 14) classes.push('text-sm');
    else if (num <= 16) classes.push('text-base');
    else if (num <= 18) classes.push('text-lg');
    else if (num <= 20) classes.push('text-xl');
    else if (num <= 24) classes.push('text-2xl');
    else if (num <= 30) classes.push('text-3xl');
    else if (num <= 36) classes.push('text-4xl');
  }

  const weight = styles.fontWeight;
  if (weight) {
    const w = parseInt(weight, 10);
    if (w >= 700) classes.push('font-bold');
    else if (w >= 600) classes.push('font-semibold');
    else if (w >= 500) classes.push('font-medium');
    else if (w >= 400) classes.push('font-normal');
  }

  if (styles.textAlign && styles.textAlign !== 'start') {
    if (styles.textAlign === 'center') classes.push('text-center');
    else if (styles.textAlign === 'right') classes.push('text-right');
  }

  // 6. Borders & Rounded
  const br = styles.borderRadius;
  if (br && br !== '0px') {
    const num = parseFloat(br);
    if (num >= 9999 || br === '50%') classes.push('rounded-full');
    else if (num <= 4) classes.push('rounded-sm');
    else if (num <= 6) classes.push('rounded');
    else if (num <= 8) classes.push('rounded-md');
    else if (num <= 12) classes.push('rounded-lg');
    else if (num <= 16) classes.push('rounded-xl');
    else if (num <= 24) classes.push('rounded-2xl');
    else classes.push(`rounded-[${br}]`);
  }

  const bw = styles.borderTopWidth || styles.borderWidth;
  if (bw && bw !== '0px') {
    classes.push(bw === '1px' ? 'border' : `border-[${bw}]`);
    const bc = styles.borderColor;
    if (bc && bc !== 'transparent') {
      const bcCls = toTailwindColor('border', bc);
      if (bcCls) classes.push(bcCls);
    }
  }

  // 7. Effects & Shadows
  const shadow = styles.boxShadow;
  if (shadow && shadow !== 'none') {
    if (shadow.includes('rgba(0, 0, 0, 0.05)')) classes.push('shadow-sm');
    else if (shadow.includes('rgba(0, 0, 0, 0.1)')) classes.push('shadow-md');
    else if (shadow.includes('rgba(0, 0, 0, 0.25)')) classes.push('shadow-xl');
    else classes.push('shadow');
  }

  // 8. Backdrop Filter
  const bf = styles.backdropFilter;
  if (bf && bf !== 'none' && bf.includes('blur')) {
    classes.push('backdrop-blur-md');
  }

  // 9. Cursor
  if (styles.cursor === 'pointer') {
    classes.push('cursor-pointer');
  }

  // 10. Transition
  if (styles.transition && styles.transition !== 'none' && styles.transition !== 'all 0s ease 0s') {
    classes.push('transition-all duration-200');
  }

  return classes.filter(Boolean);
}

