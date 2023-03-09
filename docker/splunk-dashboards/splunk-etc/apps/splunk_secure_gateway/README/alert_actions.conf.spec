[ssg_mobile_alert]
is_custom = 1
disabled = 0
label = Mobile Alert
description = Sends an alert to mobile devices!
icon_path = mobileIcon.png
payload_format = json
param.alert_description = $description$
param.alert_id=$id$
param.alert_severity=0
param.alert_time=$trigger_time$
param.app_name = $app$
param.owner = $owner$
param.results_link = $results_link$
python.version = python3
