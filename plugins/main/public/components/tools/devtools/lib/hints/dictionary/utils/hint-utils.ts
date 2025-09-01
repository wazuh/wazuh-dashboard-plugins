import type { HintItem } from '../types';

export function dedupeByText(
  items: Array<HintItem | string>,
): Array<HintItem | string> {
  const seen: Record<string, boolean> = {};
  return items.filter(item => {
    const key = String((item as any).text ?? item);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

export function sortCaseInsensitive(
  items: Array<HintItem | string>,
): Array<HintItem | string> {
  return items.sort((a: any, b: any) => {
    const A = ((a && (a.displayText || a.text)) || a || '')
      .toString()
      .toUpperCase();
    const B = ((b && (b.displayText || b.text)) || b || '')
      .toString()
      .toUpperCase();
    if (A < B) return -1;
    if (A > B) return 1;
    return 0;
  });
}

export function limitToSingleQuestionMark(
  items: Array<HintItem | string>,
): Array<HintItem | string> {
  return items.map((chain: any) => {
    if (typeof chain !== 'string' && typeof chain?.text !== 'string')
      return chain;
    const target: string = typeof chain === 'string' ? chain : chain.text;
    let t = 0;
    const replaced = target.replace(/\?/g, () => {
      t++;
      return t > 1 ? '' : '?';
    });
    if (typeof chain === 'string') return replaced;
    return { ...chain, text: replaced };
  });
}
