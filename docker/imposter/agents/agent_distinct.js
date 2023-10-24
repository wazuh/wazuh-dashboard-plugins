if (!String.prototype.includes) {
	String.prototype.includes = function(search, start) {
		'use strict';

		if (search instanceof RegExp) {
			throw TypeError('first argument must not be a RegExp');
		}
		if (start === undefined) { start = 0; }
		return this.indexOf(search, start) !== -1;
	};
}

function generateResponse(items, field, search){
  return {
    data: {
      affected_items: items.filter(function(item){
        return search ? item.includes(search) : true;
      }).map(function(item){
        var obj = {};
        obj[field] = item
        return obj;
      }),
      total_affected_items: 5,
      total_failed_items: 0,
      failed_items: []
    },
    message: "All selected agents information was returned",
    error: 0
  };
};

var mock = {
  'configSum': ['97fccbb67e250b7c80aadc8d0dc59abc', '97fccbb67e250b7c80aadc8d0dc59abd', '97fccbb67e250b7c80aadc8d0dc59abf', '97fccbb67e250b7c80aadc8d0dc59abe'],
  'dateAdd': ['2022-08-25T16:17:46Z', '2022-08-25T17:17:46Z', '2022-08-25T18:17:46Z'],
  'id': ['001', '002','003','004','005'],
  'ip': ['127.0.0.1', '127.0.0.2','127.0.0.3','127.0.0.4','127.0.0.5'],
  'group': ['default', 'windows', 'linux', 'rhel', 'arch'],
  'group_config_status': ['not synced', 'synced'],
  'lastKeepAlive': ['2022-08-25T16:17:46Z', '2022-08-25T17:17:46Z', '2022-08-25T18:17:46Z'],
  'manager': ['test.com', 'test2.com'],
  'mergedSum': ['e669d89eba52f6897060fc65a45300ac', 'e669d89eba52f6897060fc65a45300ad', 'e669d89eba52f6897060fc65a45300ae', 'e669d89eba52f6897060fc65a45300af'],
  'name': ['linux-agent', 'windows-agent'],
  'node_name': ['node01', 'node02', 'node03'],
  'os.platform': ['ubuntu', 'windows', 'darwin', 'amzn'],
  'status': ['active', 'disconnected', 'pending', 'never_connected'],
  'version': ['4.3.10', '4.4.0']
};

var field = context.request.queryParams.fields;
var search = context.request.queryParams.search;

var responseJSON = generateResponse(mock[field], field, search);

respond()
  .withStatusCode(200)
  .withData(JSON.stringify(responseJSON))