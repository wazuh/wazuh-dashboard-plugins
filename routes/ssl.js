module.exports = function (server, options) {

    function replyWithError(e, reply) {
        reply({ title: e.toString(), message: e.toString(), stack: e.stack }).code(400);
    }

    /*
    * POST /api/wazuh/ssl/verify
    * Body: {url: , auth: }
    * Returns if the given wazuh-api url is working over SSL
    *
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh/ssl/verify',
        handler: function (req, reply) {
            var needle = require('needle');

            try {
                var url = req.payload.url;
            } catch (e) {
                reply({ 'result': 'missing url param in body' }).code(404);
                return;
            }

            if(url.indexOf('https://') == -1) {
                if (url.indexOf('http://') == -1) {
                    reply({ 'result': 'protocol_error' });
                } else {
                    needle.get(url, function (error, response) {
                        if (response && response.statusCode == 401) {
                            reply({ 'result': 'unauthorized' });
                        } else {
                            reply({ 'result': 'not_running' });
                        }
                    });
                }
                return;
            }

            var insecureUrl = url.replace('https', 'http');

            needle.get(url, function (error, response) {
                if (!error && response.statusCode == 200) {
                    //It's working over http
                    reply({ 'result': 'http' });
                    return;
                }
            });

            needle.get(url, function (error, response) {
                if (response && response.statusCode == 401) {
                    //It's working without problem
                    reply({ 'result': 'unauthorized' });
                } else {
                    needle.get(url, { rejectUnauthorized: false }, function (error, response) {
                        if (response) {
                            //Selfsigned certificate
                            reply({ 'result': 'self_signed' });
                        } else {
                            reply({ 'result': 'not_running' });
                        }
                    });
                }
            });
        }
    });
};