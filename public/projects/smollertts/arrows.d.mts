export type ArrowDirection = 'external' | 'up' | 'down' | 'sort' | 'download';
export const ARROW_PATHS: Record<ArrowDirection,string>;
export function arrowIcon(direction?: ArrowDirection): SVGSVGElement;
