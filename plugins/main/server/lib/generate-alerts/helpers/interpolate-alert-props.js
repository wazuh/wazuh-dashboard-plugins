/**
 *
 * @param {string} str String with interpolations
 * @param {*} alert Alert object
 * @param {*} extra Extra parameters to interpolate what aren't in alert objet.
 * Only admit one level of depth
 */
function interpolateAlertProps(str, alert, extra = {}) {
  const matches = str.match(/{([\w\._]+)}/g);
  return (
    (matches &&
      matches.reduce((accum, cur) => {
        const match = cur.match(/{([\w\._]+)}/);
        const items = match[1].split('.');
        const value =
          items.reduce((a, c) => (a && a[c]) || extra[c] || undefined, alert) ||
          cur;
        return accum.replace(cur, value);
      }, str)) ||
    str
  );
}

module.exports.interpolateAlertProps = interpolateAlertProps;
