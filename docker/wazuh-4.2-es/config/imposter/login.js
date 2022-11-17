exports = {};

load('https://raw.githubusercontent.com/kjur/jsrsasign/master/npm/lib/jsrsasign.js', exports);
header = {
  "alg": "HS256",
  "typ": "JWT",
  "kid": "vpaas-magic-cookie-1fc542a3e4414a44b2611668195e2bfe/4f4910"
};

// The second part of the token is the payload, which contains the claims.
// Claims are statements about an entity (typically, the user) and 
// additional data. There are three types of claims: 
// registered, public, and private claims.
nbf = Date.now()-1000;

claims = {
  "iss": "wazuh",
  "aud": "Wazuh API REST",
  "nbf": nbf,
  "exp": nbf+3600000,
  "sub": "wazuh",
  "rbac_roles": [
    1
  ],
  "rbac_mode": "white"
};


jwt = KJUR.jws.JWS.sign("HS256", JSON.stringify(header), JSON.stringify(claims), "616161");

resp = {
  "data": {
    "token": jwt,
    "error": 0
  }
};

respond()
    .withStatusCode(200)
    .withData(JSON.stringify(resp));
	    

