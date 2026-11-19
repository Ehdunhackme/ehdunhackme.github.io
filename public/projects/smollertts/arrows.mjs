export const ARROW_PATHS = {
  external: 'M7 17 17 7M7 7h10v10',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  sort: 'M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4',
  download: 'M12 3v12M7 10l5 5 5-5M5 16v4h14v-4',
};

// Paths, rather than font glyphs, keep the same shape on every platform.
export function arrowIcon(direction = 'external') {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({viewBox:'0 0 24 24', width:'14', height:'14', fill:'none', stroke:'currentColor', 'stroke-width':'1.6', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', focusable:'false', class:'ui-arrow'})) icon.setAttribute(key,value);
  const path = document.createElementNS(icon.namespaceURI, 'path');
  path.setAttribute('d', ARROW_PATHS[direction]); icon.append(path);
  return icon;
}
