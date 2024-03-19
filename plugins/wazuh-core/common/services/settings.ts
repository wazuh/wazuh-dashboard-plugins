/**
 * Format the pair value-label to display the pair.
 * If label and the string of value are equals, only displays the value, if not, displays both.
 * @param value
 * @param label
 * @returns
 */
export function formatLabelValuePair(label, value) {
  return label !== `${value}` ? `${value} (${label})` : `${value}`;
}
