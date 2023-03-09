'''
DEPRECATED

  This script was originally used to set the deployment ID for cloud instances.

  Now, all cloud configuration is handled in splunk_instrumentation/bin/on_splunk_start.py

  This file remains to support legacy cloud provisioning logic, but is now a no-op.

  The previous doc string follows below.

Synopsis:

  splunk cmd python set_deployment_id.py -u SPLUNK_USER -p SPLUNK_PASSWORD --prefix PREFIX

Description:

  Sets the deployment ID for the instrumentation app via CLI. Intended for
  deployment automation purposes.

  Calls splunkd via the splunk-sdk, utilizing the same logic that generates
  the deployment ID in splunkweb during instrumentation opt-in via the web UI.

Expectations:

  SPLUNK_USER must have edit_telemetry_settings capability (the default for admin).
'''
from __future__ import print_function

print("set_deployment_id.py - This script is deprecated. Please remove any dependencies on it.")
exit(0)
