# Output to Telemetry alert settings

action.outputtelemetry = [0|1]
* Enable output to telemetry action

action.outputtelemetry.param.support = <bool>
* Whether data is part of support usage
* (optional)

action.outputtelemetry.param.anonymous = <bool>
* Whether data is part of anonymous usage
* (optional)

action.outputtelemetry.param.license = <bool>
* Whether data is part of license usage
* (optional)

action.outputtelemetry.param.optinrequired = <int>
* Opt-in level required
* (required)

action.outputtelemetry.param.component = <string>
* Component name
* (required)

action.outputtelemetry.param.type = [aggregate|event]
* Data type
* (optional)
