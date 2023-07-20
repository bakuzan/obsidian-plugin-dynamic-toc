import cssPath from './cssPath';

const styleToTypeMap = new Map([
  // Unordered
  ['bullet', ''],
  ['circle', 'C'],
  ['square', 'S'],
  // Ordered
  ['number', '1'],
  ['roman', 'I'],
  ['alpha', 'A']
]);

export function setListType(
  tocContainer: HTMLElement,
  style: string,
  level_styles?: string
) {
  const levelStyles = level_styles ? level_styles.split(',') : [style];
  const lists = [
    ...Array.from(tocContainer.querySelectorAll('ol')),
    ...Array.from(tocContainer.querySelectorAll('ul'))
  ];

  for (const list of lists) {
    const elPath = cssPath(list);
    const depth = elPath.match(/li/g)?.length ?? 0;

    const lvlStyle = levelStyles[depth];
    const listType = styleToTypeMap.get(lvlStyle);

    list.setAttribute('type', listType);
  }
  console.groupEnd();
}
