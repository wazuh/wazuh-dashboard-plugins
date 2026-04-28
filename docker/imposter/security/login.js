/**
 * Mock JWT for POST /security/user/authenticate (Wazuh API 4.4+).
 * Uses Java HMAC-SHA256 (Nashorn-compatible) — do not load jsrsasign from
 * GitHub master; upstream added ES6+ (`const`) which Nashorn cannot parse.
 */
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets');
var Mac = Java.type('javax.crypto.Mac');
var SecretKeySpec = Java.type('javax.crypto.spec.SecretKeySpec');
var Base64 = Java.type('java.util.Base64');

var header = {
  alg: 'HS256',
  typ: 'JWT',
  kid: 'vpaas-magic-cookie-1fc542a3e4414a44b2611668195e2bfe/4f4910',
};

var nbf = new Date().getTime() - 1000;
var claims = {
  iss: 'wazuh',
  aud: 'Wazuh API REST',
  nbf: nbf,
  exp: nbf + 3600000,
  sub: 'wazuh',
  rbac_roles: [1],
  rbac_mode: 'white',
};

function b64urlSegment(obj) {
  var json = JSON.stringify(obj);
  var data = new java.lang.String(json).getBytes(StandardCharsets.UTF_8);
  return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
}

var secret = '616161';
var signingInput = b64urlSegment(header) + '.' + b64urlSegment(claims);
var mac = Mac.getInstance('HmacSHA256');
var keySpec = new SecretKeySpec(
  new java.lang.String(secret).getBytes(StandardCharsets.UTF_8),
  'HmacSHA256'
);
mac.init(keySpec);
var sigBytes = mac.doFinal(
  new java.lang.String(signingInput).getBytes(StandardCharsets.UTF_8)
);
var signature = Base64.getUrlEncoder().withoutPadding().encodeToString(sigBytes);
var jwt = signingInput + '.' + signature;

var resp = {
  data: {
    token: jwt,
    error: 0,
  },
};

respond()
  .withStatusCode(200)
  .withData(JSON.stringify(resp));
