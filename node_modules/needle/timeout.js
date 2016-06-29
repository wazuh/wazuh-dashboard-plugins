var defaultOptions = {
  timeout: 5000,
  read_timeout: 5000,
  rejectUnauthorized: false
};

var needle = require('./');

needle.get('timeout.com', function(err, resp) {
  console.log(arguments);
})
