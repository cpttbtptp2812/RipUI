export interface ComputedStyleSubset {
  display: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  gap?: string;
  gridTemplateColumns?: string;
  
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  textAlign?: string;
  letterSpacing?: string;
  
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  
  boxShadow?: string;
  opacity?: string;
  overflow?: string;
  position?: string;
  zIndex?: string;
  backdropFilter?: string;
  cursor?: string;
  transform?: string;
  transition?: string;
}

export interface RipNode {
  id: string;
  tagName: string;
  text?: string;
  attributes: Record<string, string>;
  isSvg: boolean;
  svgContent?: string;
  computedStyles: Record<string, string>;
  tailwindClasses: string[];
  children: RipNode[];
  width: number;
  height: number;
}

export interface ExtractionOptions {
  includeTailwind: boolean;
  inlineSvg: boolean;
  cleanEmptyContainers: boolean;
  maxDepth: number;
  componentName?: string;
}

export type ExportFormat = 'react' | 'vue' | 'html';

