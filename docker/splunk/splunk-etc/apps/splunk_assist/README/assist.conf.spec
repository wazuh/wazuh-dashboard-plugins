[metadata]
instance_id = UUID
* Sets a per-instance id that can be used to identify this node to the teleport APIs.
* Default: _

[cloud]
scs_environment = production
* Determines the cloud cluster the app will talk to
* Default: production

heartbeat_interval_seconds=10
* The default interval that the supervisor will contact the cloud, this can be overrided by the cloud.
* Default: 10

connectivity_test_url=https://www.splunk.com
* Used to determine if the app has outbound internet connectivity
* Default: https://www.splunk.com

[supervisor]
local_port = _
* When the HTTP server is running, the port the supervisor is currently listening on.
* Default: _ (not running)

ca_cert = _
* When the HTTP server is running, the certificate to trust for TLS connections.
* Default: _ (not running)

local_path = _
* If the supervisor updates, the location of the update is specified here.
* Default: _ (not updated)

[ui]
assets_url = url
* Indicates from where the ui bundle should be downloaded, requires SUD to be enabled.
* Default: Splunk CDN

sig_url = url
* Indicates from where the ui bundle signature should be downloaded, requires SUD to be enabled.
* Default: Splunk CDN

assets_root = path
* Indicates where on the file system ui assets are being served from
* Default: _ (not available)

etag = string
* Stores the etag of the last downloaded ui bundle
* Default: _ (not update downloaded)

[updates]
etag = string
* Stores the etag of the last downloaded supervisor update
* Default: _ (not update downloaded)

global_url = url
* Used to query globally released supervisor updates
* Default: Splunk CDN

tenant_url = url
* Used to query tenant-scoped supervisor updates
* Default: Splunk CDN

sphost_url = url
* Used to query supervisor host scoped supervisor updates
* Default: Splunk CDN
