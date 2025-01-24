function http({ method, url, options }) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://')
      ? require('https')
      : require('http');

    const requestMethod = method.toLowerCase();
    client[requestMethod](url, res => {
      let data = [];
      const response = {
        headers: res.headers,
      };

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        const body = Buffer.concat(data).toString();
        response.body = body;
        if (response.headers['content-type'] === 'application/json') {
          response.body = JSON.parse(body);
        } else {
          try {
            response.body = JSON.parse(body);
          } catch {}
        }
        resolve(response);
      });
    }).on('error', err => {
      response.error = err;
      reject(res);
    });
  });
}

module.exports = http;
