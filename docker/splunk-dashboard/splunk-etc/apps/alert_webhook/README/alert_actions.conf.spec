[webhook]

param.user_agent = <string>
* Configure value of the User-Agent header sent to the webhook receiver.

enable_allowlist = true|false
* Webhook allowlist feature flag to control URLs the webhook alert action can access.
* Default: true

allowlist.<name> = <string>
* A list of endpoints that the webhook action is permitted to query against.
* Each allowlist entry must be prefixed by "allowlist." and will be on its own line.
* Values are regex strings that must match allowed URLs.
* An example allowlist is as follows:
*   allowlist.endpoint1 = ^https:\/\/10\.201\..*
*   allowlist.endpoint2 = ^https:\/\/(.*\.|)company.com\/?.*
*   ...
* NOTE: by default, the allowlist will be enabled.
