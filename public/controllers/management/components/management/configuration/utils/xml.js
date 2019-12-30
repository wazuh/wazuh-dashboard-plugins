const parser = new DOMParser();

export const validateXML = (xml) => {
  const xmlReplaced = replaceIllegalXML(xml).replace(/..xml.+\?>/, '').replace(/\\</gm, '');
  const xmlDoc = parser.parseFromString(
    `<file>${xmlReplaced}</file>`,
    'text/xml'
  );
  const parsererror = xmlDoc.getElementsByTagName('parsererror');
  if (parsererror.length) {
    const xmlFullError = parsererror[0].textContent;
    return (xmlFullError.match('error\\s.+\n') || [])[0] ||
      'Error validating XML';
  }
  return false
}

export const replaceIllegalXML = (text) => {
  const oDOM = parser.parseFromString(text, 'text/html');
  const lines = oDOM.documentElement.textContent.split('\n');

  for (const line of lines) {
    const sanitized = replaceXML(line.trim(), '&', '&amp;');

    /**
     * Do not remove this condition. We don't want to replace
     * non-sanitized lines.
     */
    if (!line.includes(sanitized)) {
      text = replaceXML(text, line.trim(), sanitized);
    }
  }
  return text;
};

export const replaceXML = function(str, split, newstr) {
  return str.split(split).join(newstr);
};