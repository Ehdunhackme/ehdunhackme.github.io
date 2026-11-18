// Keep the animated underline on the glyphs, independent of link hit-area padding.
function decorate(root) {
  const anchors = root.matches?.('a:not(.skip)') ? [root] : [...(root.querySelectorAll?.('a:not(.skip)') || [])];
  for (const anchor of anchors) {
    const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim() && !node.parentElement.closest('.link-label, svg, .link-icon')) nodes.push(node);
    }
    for (const node of nodes) {
      const span = document.createElement('span'); span.className = 'link-label';
      node.replaceWith(span); span.append(node);
    }
  }
}
decorate(document);
new MutationObserver(records => {
  for (const record of records) {
    if (record.target.nodeType === 1 && record.target.closest('a')) decorate(record.target.closest('a'));
    for (const node of record.addedNodes) if (node.nodeType === 1) decorate(node);
  }
}).observe(document.body, {subtree: true, childList: true});
