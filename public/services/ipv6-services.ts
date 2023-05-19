export function compressIPv6(ip: string) {
  if (typeof ip !== 'string') {
    return ip;
  }
  if (ip?.split(':').length !== 8) {
    return ip;
  }

  let output = ip
    .split(':')
    .map(terms => terms.replace(/\b0+/g, '') || '0')
    .join(':');
  const zeros = Array.from(output.matchAll(/\b:?(?:0+:?){2,}/g));
  if (zeros.length > 0) {
    let max = '';
    zeros.forEach(item => {
      if (item[0].replace(/:/g, '').length > max.replace(/:/g, '').length) {
        max = item[0];
      }
    });
    output = output.replace(max, '::');
  }
  return output;
}
