# Wazuh integrations
This folder contains a docker environment with all the necessary to test integrations with Splunk and Elasticsearch, from the Wazuh Indexer as well as from the Wazuh manager. 

## Docker compose content:
- 1 Splunk Indexer 9.0.4
- 1 Wazuh stack (indexer, dashboard and manager). In the manager container there is also a Splunk Forwarder and a Logstash in the `/opt` folder
- 1 Elastic stack (Elasticsearch,Kibana and the setup container)
- 1 Opensearch stack (Opensearch and Opensearch dashboards)
- 1 Logstash 8.6.2 
- 1 Generator that will automatically generate all the required certificates and download the required packages

## Additional content: 
- Dashboards for Splunk and Kibana
- Sample alerts for the last 7 days after starting the environments. Those are inside the wazuh-manager in `/var/ossec/logs/alerts/sample_alerts.json`

## Requirement:
- Internet connection
- Docker
- Docker compose

## Usage
In the .env file it is possible to configure the desired version of the Wazuh stack. It will only work with already released versions. 

After that, running `docker compose up -d` will start all the containers. Once the start process finishes, it is possible to configure the desired integrations. To stop the environment and cleare it, use `docker compose down`.

The Splunk Indexer instance is accessible from https://localhost:8000, credentials `admin:password`

The Wazuh Dashboard instance is accessible from https://localhost:5601 credentials `admin:SecretPassword`

The Kibana instance is accessible from http://localhost:5602 credentials `elastic:changeme`


The Opensearch dashboards instance is accessible from http://localhost:5603 credentials `admin:admin`


## Configuring integrations
The complete guide for integrations can be found [here](https://docs.google.com/document/d/1QotuX58m9f_GFJbLK-aZ74PDsf-SzmM8VoEhvrlkza0/edit)

### Splunk from manager
To integrate Splunk from the manager, the first step is to configure the required indices. To do that, attach a terminal to the Splunk instance and create a file `/opt/splunk/etc/system/local/indexes.conf`, with the following content:

```
[wazuh-alerts]
coldPath = $SPLUNK_DB/wazuh/colddb
enableDataIntegrityControl = 1
enableTsidxReduction = 1
homePath = $SPLUNK_DB/wazuh/db
maxTotalDataSizeMB = 512000
thawedPath = $SPLUNK_DB/wazuh/thaweddb
timePeriodInSecBeforeTsidxReduction = 15552000
tsidxReductionCheckPeriodInSec =
```

This will create the index `wazuh-alerts`. After that, restart the Splunk instance. 


The next step is to attach a terminal to the wazuh-manager instance, which also contains the Splunk Forwarder. And create the following files:

`/opt/splunkforwarder/etc/system/local/inputs.conf`: This will tell our forwarder to look for the alerts file. For this example we will use `sample_alerts.json`, as it contains more alerts to test the dashboards. But to monitor a production instance, the steps are the same but changing to `alerts.json`. 
The content of the file is:

```
[monitor:///var/ossec/logs/alerts/sample_alerts.json]
disabled = 0
host = buildkitsandbox
index = wazuh-alerts
sourcetype = wazuh-alerts
```

`/opt/splunkforwarder/etc/system/local/props.conf`: this contains configuration for the index. 
The content of the file is:

```
[wazuh-alerts]
DATETIME_CONFIG =
INDEXED_EXTRACTIONS = json
KV_MODE = none
NO_BINARY_CHECK = true
category = Application
disabled = false
pulldown_type = true
```

`/opt/splunkforwarder/etc/system/local/outputs.conf`: this contains the information of the Splunk instance to which the forwarder will send the information. 
The content of the file is:

```
defaultGroup = default-autolb-group

[tcpout:default-autolb-group]
server = indexer:9997

[tcpout-server://indexer:9997]
```

After that, the integration is completed. It should be possible to see the logs from the Splunk interface, in `Search & reporting` running the `index='wazuh-alerts'`query.

### Splunk from indexer
To integrate Splunk from the Wazuh Indexer, we will use Logstash, that is in the `/opt` folder of the Wazuh Manager container. 
The first step is to [generate a http event collector token](https://docs.splunk.com/Documentation/Splunk/8.0.5/Data/UsetheHTTPEventCollector) in the Splunk interface, selecting the `wazuh-alerts` index. To create that index, refer to the previous instructions (Splunk from manager)

Next, we need to install the [logstash-input-opensearch plugin](https://github.com/opensearch-project/logstash-input-opensearch), running from the `/opt/logstash` folder:

```
bin/logstash-plugin install logstash-input-opensearch
```

Then, we will use the Logstash Keystore to store the credentials. The LOGSTASH_KEYSTORE_PASS variable is predefined in the container. After the last three commands, it will ask for each value. `IN_USER`:admin `IN_PWD`:SecretPassword `SP_AUTH`: Splunk <the previously generated token>.

```
bin/logstash-keystore create
bin/logstash-keystore add IN_USER
bin/logstash-keystore add IN_PWD
bin/logstash-keystore add SP_AUTH
```

The next step is to create a `pipeline.conf` file. The certificates are already loaded in the container. The content is the following:

```
input {
  opensearch {
	hosts =>  ["wazuh.indexer:9200"]
	user  =>  "${IN_USER}"
	password  =>  "${IN_PWD}"
	index =>  "wazuh-alerts-4.x-*"
	ssl => true
	ca_file => "/etc/ssl/root-ca.pem"
	query =>  '{
   	 "query": {
   		 "range": {
   			 "@timestamp": {
   				 "gt": "now-1m"
   			 }
   		 }
   	 }
	}'
	schedule => "* * * * *"
  }
}
output {
    http {
    	format => "json" # format of forwarded logs
    	http_method => "post" # HTTP method used to forward logs
    	url => "https://splunk:8088/services/collector/raw" # endpoint to forward logs to
    	headers => ["Authorization", "${SP_AUTH}"]
        cacert => "/etc/ssl/root-ca.pem"
	}
	stdout{}
}
```

The `stdout` will show the logs in the console as they are being read. It is useful in case of errors to verify if it is an error reading the logs or writing them.

Then, we have to run logstash with the recently created pipeline:

```
bin/logstash -f pipeline.conf --log.level info
```

It is possible to change the log level for troubleshooting in case that it fails.

After this configuration, the integration should be completed, and it can be verified in the same way as in the previous instructions.


### Elastic from manager
To integrate Elastic from the manager, we are going to use Logstash, that it is already in the manager container, inside the `/opt` folder.

The first step is storing the credentials in the logstash keystore . The LOGSTASH_KEYSTORE_PASS variable is predefined in the container. After the last two commands, it will ask for each value. `ES_USER`:elastic `ES_PWD`:changeme 

These command should be executed from the `/opt/logstash-8.6.2` folder:

```
bin/logstash-keystore create
bin/logstash-keystore add ES_USER
bin/logstash-keystore add ES_PWD
```

After that, we will create a `pipeline.conf` file. The certificates are already loaded in the container. In this example we will use the `sample_alerts.json` file. To configure it in a production environment, just change it to `alerts.json`. The content is the following:

```
input {
  file {
    id => "wazuh_alerts"
    codec => "json"
    start_position => "beginning"
    stat_interval => "1 second"
    path => "/var/ossec/logs/alerts/sample_alerts.json"
    mode => "tail"
    ecs_compatibility => "disabled"
  }
}


output {
    elasticsearch {
        hosts => "es01"
        index => "wazuh-alerts-4.x-%{+YYYY.MM.dd}"
        user => "${ES_USER}"
        password => "${ES_PWD}"
        ssl => true
        cacert => '/etc/certs/elastic/ca/ca.crt'
    }
	stdout{}
}
```

The `stdout` will show the logs in the console as they are being read. It is useful in case of errors to verify if it is an error reading the logs or writing them.
Then, we have to run logstash with the recently created pipeline:

```
bin/logstash -f pipeline.conf --log.level info
```

It is possible to change the log level for troubleshooting in case that it fails.

After this configuration, the integration is completed. To verify that it's working, enter Kibana from http://localhost:5602, and navigate to `Discover`. If no log is shown, it is possible that a new data view is needed. To configure it, click on the button on the top-left margin, under the navigation bar, click on `Create a data view`, write `wazuh-alerts-4.x` as name, and in the `Index pattern` field write `wazuh-alerts-4.x*`. Select `timestamp` as the Timestamp field. It is important to select `timestamp` and not `@timestamp`. Then click on `Save data view to Kibana`.


### Elastic from indexer
To integrate Elastic from the Wazuh Indexer, we will also use logstash. 

The first step is to install the [logstash-input-opensearch plugin](https://github.com/opensearch-project/logstash-input-opensearch), running from the `/opt/logstash` folder:

```
bin/logstash-plugin install logstash-input-opensearch
```

Then we need to store the credentials in the logstash keystore. The LOGSTASH_KEYSTORE_PASS variable is predefined in the container. After the last four commands, it will ask for each value. `ES_USER`:elastic `ES_PWD`:changeme, `IN_USER`:admin, `IN_PWD`: SecretPassword

```
bin/logstash-keystore create
bin/logstash-keystore add ES_USER
bin/logstash-keystore add ES_PWD
bin/logstash-keystore add IN_USER
bin/logstash-keystore add IN_PWD
```

After that, we will create a `pipeline.conf` file. The certificates are already loaded in the container. The content is the following:

```
input {
  opensearch {
	hosts =>  ["wazuh.indexer:9200"]
	user  =>  "${IN_USER}"
	password  =>  "${IN_PWD}"
	index =>  "wazuh-alerts-4.x-%{+YYYY.MM.dd}"
	ssl => true
	ca_file => "/etc/ssl/root-ca.pem"
	query =>  '{
   	 "query": {
   		 "range": {
   			 "@timestamp": {
   				 "gt": "now-1m"
   			 }
   		 }
   	 }
	}'
	schedule => "* * * * *"
  }
}

output {
    elasticsearch {
        hosts => "es01"
        index => "wazuh-alerts-4.x-dashboards"
        user => "${ES_USER}"
        password => "${ES_PWD}"
        ssl => true
        cacert => '/etc/certs/elastic/ca/ca.crt'
    }
	stdout{}
}
```

The `stdout` will show the logs in the console as they are being read. It is useful in case of errors to verify if it is an error reading the logs or writing them.

Then, we have to run logstash with the recently created pipeline:

```
bin/logstash -f pipeline.conf --log.level info
```

It is possible to change the log level for troubleshooting in case that it fails.

After this configuration, the integration is completed. To verify that it's working, enter Kibana from http://localhost:5602, and navigate to `Discover`. If no log is shown, it is possible that a new data view is needed. To configure it, click on the button on the top-left margin, under the navigation bar, click on `Create a data view`, write `wazuh-alerts-4.x` as name, and in the `Index pattern` field write `wazuh-alerts-4.x*`. Select `timestamp` as the Timestamp field. It is important to select `timestamp` and not `@timestamp`. Then click on `Save data view to Kibana`.


### Opensearch from manager
To integrate Opensearch from the manager, we are going to use Logstash, that it is already in the manager container, inside the `/opt` folder.

The first step is storing the credentials in the logstash keystore . The LOGSTASH_KEYSTORE_PASS variable is predefined in the container. After the last two commands, it will ask for each value. `OS_USER`:admin `OS_PWD`:admin 

Then, we have to install the [logstash-output-opensearch plugin](https://github.com/opensearch-project/logstash-output-opensearch), running from the `/opt/logstash` folder:

```
bin/logstash-plugin install logstash-output-opensearch
```

These command should be executed from the `/opt/logstash` folder:

```
bin/logstash-keystore create
bin/logstash-keystore add OS_USER
bin/logstash-keystore add OS_PWD
```

After that, we will create a `pipeline.conf` file. The certificates are already loaded in the container. In this example we will use the `sample_alerts.json` file. To configure it in a production environment, just change it to `alerts.json`. The content is the following:

```
input {
  file {
    id => "wazuh_alerts"
    codec => "json"
    start_position => "beginning"
    stat_interval => "1 second"
    path => "/var/ossec/logs/alerts/sample_alerts.json"
    mode => "tail"
    ecs_compatibility => "disabled"
  }
}


output {
    opensearch {
    	hosts => ["opensearch"]
    	auth_type => {
        	type => 'basic'
        	user => '${OS_USER}'
        	password => '${OS_PWD}'
      	}
    	index  => "wazuh-alerts-4.x-%{+YYYY.MM.dd}"
    	ssl => true
    	cacert => "/etc/ssl/root-ca.pem"
	}
	stdout{}
}
```

The `stdout` will show the logs in the console as they are being read. It is useful in case of errors to verify if it is an error reading the logs or writing them.

Then, we have to run logstash with the recently created pipeline:

```
bin/logstash -f pipeline.conf --log.level info
```

It is possible to change the log level for troubleshooting in case that it fails.

After this configuration, the integration is completed. To verify that it's working, enter Opensearch Dashboards from http://localhost:5603, and navigate to `Discover`. If no log is shown, it is possible that a new index pattern is needed. To create it, open the left bar, go to `Stack Management`, click on `Create index pattern`, write `wazuh-alerts-4.x*` as name, click on `Next step`, select `timestamp` as Time field. It is important to select `timestamp` and not `@timestamp`. Then click on `Create index pattern`


### Opensearch from indexer
To integrate Elastic from the Wazuh Indexer, we will also use logstash. 

The first step is to install the [logstash-input-opensearch plugin](https://github.com/opensearch-project/logstash-input-opensearch) and [logstash-output-opensearch plugin](https://github.com/opensearch-project/logstash-output-opensearch), running from the `/opt/logstash` folder:

```
bin/logstash-plugin install logstash-input-opensearch logstash-output-opensearch
```

Then we need to store the credentials in the logstash keystore. The LOGSTASH_KEYSTORE_PASS variable is predefined in the container. After the last four commands, it will ask for each value. `OS_USER`:admin `OS_PWD`:admin, `IN_USER`:admin, `IN_PWD`: SecretPassword

```
bin/logstash-keystore create
bin/logstash-keystore add OS_USER
bin/logstash-keystore add OS_PWD
bin/logstash-keystore add IN_USER
bin/logstash-keystore add IN_PWD
```

After that, we will create a `pipeline.conf` file. The certificates are already loaded in the container. The content is the following:

```
input {
  opensearch {
	hosts =>  ["wazuh.indexer:9200"]
	user  =>  "${IN_USER}"
	password  =>  "${IN_PWD}"
	index =>  "wazuh-alerts-4.x-*"
	ssl => true
	ca_file => "/etc/ssl/root-ca.pem"
	query =>  '{
   	 "query": {
   		 "range": {
   			 "@timestamp": {
   				 "gt": "now-1m"
   			 }
   		 }
   	 }
	}'
	schedule => "* * * * *"
  }
}

output {
    opensearch {
    	hosts => ["opensearch"]
    	auth_type => {
        	type => 'basic'
        	user => '${OS_USER}'
        	password => '${OS_PWD}'
      	}
    	index  => "wazuh-alerts-4.x-%{+YYYY.MM.dd}"
    	ssl => true
    	cacert => "/etc/ssl/root-ca.pem"
	}
	stdout{}
}
```

The `stdout` will show the logs in the console as they are being read. It is useful in case of errors to verify if it is an error reading the logs or writing them.

Then, we have to run logstash with the recently created pipeline:

```
bin/logstash -f pipeline.conf --log.level info
```

It is possible to change the log level for troubleshooting in case that it fails.

After this configuration, the integration is completed. To verify that it's working, enter Opensearch Dashboards from http://localhost:5603, and navigate to `Discover`. If no log is shown, it is possible that a new index pattern is needed. To create it, open the left bar, go to `Stack Management`, click on `Create index pattern`, write `wazuh-alerts-4.x*` as name, click on `Next step`, select `timestamp` as Time field. It is important to select `timestamp` and not `@timestamp`. Then click on `Create index pattern`



## Import dashboards
### Splunk 
The Splunk dashboards are located in `extra/dashboards/Splunk`. The steps to import them to the indexer are the following:
- Open a dashboard file and copy all its content
- In the indexer navigate to `Search & Reporting`, `Dashboards`, click `Create New Dashboard`, write the title and select `Dashboard Studio`, select `Grid` and click on `Create`
- On the top menu, there is a `Source` icon. Click on it, and replace all the content with the copied content from the dashboard file. After that, click on `Back` and click on `Save`.
- Repeat the steps for all the desired dashboards.

### Elastic and Opensearch
The Elastic dashboards are located in `extra/dashboards/Kibana and Opensearch-dashboards`. The steps to import them to the indexer are the following:
- Open the Elastic web interface
- Expand the left bar, and go to `Stack management`
- Click on `Saved Objects`, select `Import`, click on the `Import` icon and browse the dashboard file. It is possible to import only the desired dashboard, or the file `all-dashboards.ndjson`, that contains all the dashboards.
- Click on Import.
- Repeat the steps for all the desired dashboards.

After that, the dashboard should be imported. It can be seen opening the left bar and selecting `Dashboard`. 

