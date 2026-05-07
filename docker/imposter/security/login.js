const Base64 = Java.type('java.util.Base64');
const Mac = Java.type('javax.crypto.Mac');
const SecretKeySpec = Java.type('javax.crypto.spec.SecretKeySpec');
const ByteArray = Java.type('byte[]');

// Allocate a Java byte[] from a hex string
const hexToBytes = (hex) => {
  const arr = new ByteArray(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i >> 1] = (parseInt(hex[i], 16) << 4) | parseInt(hex[i + 1], 16);
  }
  return arr;
};

// Encode a Java byte[] to base64url (no padding)
const base64url = (bytes) =>
  Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

// Encode an ASCII string to a Java byte[] without Java String interop
const toBytes = (str) => {
  const arr = new ByteArray(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xFF;
  return arr;
};

const header = {
  alg: 'HS256',
  typ: 'JWT',
  kid: 'vpaas-magic-cookie-1fc542a3e4414a44b2611668195e2bfe/4f4910',
};

const nbf = Date.now() - 1000;
const claims = {
  iss: 'wazuh',
  aud: 'Wazuh API REST',
  nbf: nbf,
  exp: nbf + 3600000,
  sub: 'wazuh',
  rbac_roles: [1],
  rbac_mode: 'white',
};

const headerB64 = base64url(toBytes(JSON.stringify(header)));
const payloadB64 = base64url(toBytes(JSON.stringify(claims)));
const signingInput = headerB64 + '.' + payloadB64;

const keyBytes = hexToBytes('616161');
const mac = Mac.getInstance('HmacSHA256');
mac.init(new SecretKeySpec(keyBytes, 'HmacSHA256'));
const signature = base64url(mac.doFinal(toBytes(signingInput)));

const jwt = signingInput + '.' + signature;

respond()
  .withStatusCode(200)
  .withData(JSON.stringify({ data: { token: jwt, error: 0 } }));
