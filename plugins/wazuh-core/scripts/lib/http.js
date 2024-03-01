function request(url, options, body) {
  let requestPackage;
  if (url.startsWith('http:')) {
    requestPackage = require('http');
  } else if (url.startsWith('https:')) {
    requestPackage = require('https');
  } else {
    throw new Error('URL should start with "http" or "https"');
  }

  let urlOptions = new URL(url);

  return new Promise((resolve, reject) => {
    const req = requestPackage.request(urlOptions, options, response => {
      let data = '';

      // A chunk of data has been recieved
      response.on('data', chunk => {
        data += chunk;
      });

      // The whole response has been received. Print out the result
      response.on('end', () => {
        response.body = data;
        resolve(response);
      });

      // Manage the error
      response.on('error', error => {
        reject(error);
      });
    });

    // Manage the request error
    req.on('error', reject);

    // Send body
    if (body) {
      let payload = body;
      if (
        options &&
        options.headers &&
        options.headers['content-type'] === 'application/json'
      ) {
        payload = JSON.stringify(body);
        req.write(payload);
      } else if (typeof body.pipe === 'function') {
        body.pipe(req);
        return;
      } else {
        req.write(payload);
      }
    }

    req.end();
  });
}

function createRequest(method) {
  return function (url, options, body) {
    options.method = method;
    return request(url, options, body);
  };
}

module.exports.client = {
  head: createRequest('HEAD'),
  get: createRequest('GET'),
  post: createRequest('POST'),
  put: createRequest('PUT'),
  delete: createRequest('DELETE'),
  request: request,
};
