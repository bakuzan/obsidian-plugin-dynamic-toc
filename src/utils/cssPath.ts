export default function cssPath<T extends Element>(element: T) {
  if (!(element instanceof Element)) {
    return;
  }

  const path = [];
  let el: Element = element;

  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();

    if (el.id) {
      selector += '#' + el.id;
      path.unshift(selector);
      break;
    } else {
      let sib: Element = el,
        nth = 1;

      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() == selector) {
          nth++;
        }
      }

      if (nth != 1) {
        selector += ':nth-of-type(' + nth + ')';
      }
    }

    path.unshift(selector);
    el = el.parentNode as Element;
  }

  return path.join(' > ');
}
