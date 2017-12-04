// Require some libraries
const needle = require('needle');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

module.exports = (server, options) => {

	const reachAPI = (wapi_config) => {
		// Now, let's see whether they have a 2.x or 3.x version

		if (wapi_config.cluster_info === undefined) { // No cluster_info in the API configuration data -> 2.x version
	        needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
	            username:           wapi_config.user,
	            password:           wapi_config.password,
	            rejectUnauthorized: !wapi_config.insecure
	        })
	        .then((response) => {
	            if (parseInt(response.body.error) === 0 && response.body.data) {
	                needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/status`, {}, { // Checking the cluster status
	                    username:           wapi_config.user,
	                    password:           wapi_config.password,
	                    rejectUnauthorized: !wapi_config.insecure
	                })
	                .then((response) => {
	                    if (!response.body.error) {
	                        if (response.body.data.enabled === 'yes') { // If cluster mode is active
	                            needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/node`, {}, {
	                                username:           wapi_config.user,
	                                password:           wapi_config.password,
	                                rejectUnauthorized: !wapi_config.insecure
	                            })
	                            .then((response) => {
	                                if (!response.body.error) {
	                                    wapi_config.cluster_info = {};
	                                    wapi_config.cluster_info.status = 'enabled';
	                                    wapi_config.cluster_info.manager = wapi_config.manager;
	                                    wapi_config.cluster_info.node = response.body.data.node;
	                                    wapi_config.cluster_info.cluster = response.body.data.cluster;
	                                } else if (response.body.error){
										server.log([blueWazuh, 'initialize', 'error'], 'Could not get cluster/node information for ', wapi_config.manager);
	                                }
	                            });
	                        }
	                        else { // Cluster mode is not active
	                            wapi_config.cluster_info = {};
	                            wapi_config.cluster_info.status = 'disabled';
	                            wapi_config.cluster_info.cluster = 'Disabled';
	                            wapi_config.cluster_info.manager = wapi_config.manager;
	                        }

				        	// We filled data for the API, let's insert it now
							elasticRequest.callWithInternalUser('update', { 
								index: '.new-wazuh', 
								type: 'wazuh-configuration',
								body: {
									'doc': {
										"api_user": wapi_config.user,
										"api_password": wapi_config.password,
										"url": wapi_config.url,
										"api_port": wapi_config.port,
										"manager": wapi_config.manager,
				          				"cluster_info" : {
				            				"manager" : wapi_config.manager,
				            				"node" : wapi_config.cluster_info.node,
				            				"cluster" : wapi_config.cluster_info.cluster,
				            				"status" : wapi_config.cluster_info.status
				          				},
									}
								} 
							})
							.then((resp) => {
								server.log([blueWazuh, 'initialize', 'info'], 'Successfully updated proper cluster information for ' + wapi_config.manager);
							})
							.catch((err) => {
								server.log([blueWazuh, 'initialize', 'error'], 'Could not update proper cluster information for ' + wapi_config.manager);
							});
	                    } else {
							server.log([blueWazuh, 'initialize', 'error'], 'Could not get cluster/status information for ', wapi_config.manager);
	                    }
	                });
	            } else {
					server.log([blueWazuh, 'initialize', 'error'], 'The API responded with some kind of error for ', wapi_config.manager);
	            }
	        })
	        .catch(error => {
	        	// We weren't able to reach the API, reorganize data and fill with sample node and cluster name information
				elasticRequest.callWithInternalUser('update', { 
					index: '.new-wazuh', 
					type: 'wazuh-configuration',
					body: {
						'doc': {
							"api_user": wapi_config.user,
							"api_password": wapi_config.password,
							"url": wapi_config.url,
							"api_port": wapi_config.port,
							"manager": wapi_config.manager,
	          				"cluster_info" : {
	            				"manager" : wapi_config.manager,
	            				"node" : "nodata",
	            				"cluster" : "nodata",
	            				"status" : "disabled"
	          				},
						}
					} 
				})
				.then((resp) => {
					server.log([blueWazuh, 'initialize', 'info'], 'Successfully updated sample cluster information for ' + wapi_config.manager);
				})
				.catch((err) => {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not update sample cluster information ' + wapi_config.manager);
				});
	        });
		} else { // 3.x version
			// Nothing to be done, cluster_info is present
		}
	};

	// Reindex a .wazuh index from 2.x to .wazuh and .wazuh-version in 3.x
	const reindexOldVersion = () => {
		server.log([blueWazuh, 'initialize', 'info'], `Old version detected. Proceeding to reindex.`);

		let configuration = {
		  "source": {
		    "index": ".wazuh",
		    "type": "wazuh-configuration"
		  },
		  "dest": {
		    "index": ".new-wazuh"
		  }
		};

		// 1st, reindex the wazuh-configuration type of documents 
		elasticRequest.callWithInternalUser('reindex', {
			body: configuration
		})
		.then((result) => {
			// Now we need to properly replace the cluster_info into the configuration
			elasticRequest.callWithInternalUser('get', {
				index: ".new-wazuh",
				type: "wazuh-configuration"
			})
			.then((data) => {
				for (var i =0; i < data.length; i++) {
					reachAPI(data[i]);
				}
			})
			.catch((error) => {
				server.log([blueWazuh, 'initialize', 'error'], 'Something happened while getting old API configuration data.');
			});
		})
		.catch((error) => {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not begin the reindex process.');
		});
	};

    module.exports = reindexOldVersion;
};
