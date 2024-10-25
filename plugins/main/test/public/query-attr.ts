import { CSS } from '../utils/CSS';

export function queryDataTestAttr(
  attr: string,
  selector: CSS.Selector = CSS.Attribute.Equals,
) {
  return `[data-test-subj${selector}="${attr}"]`;
}
