/*
 * Wazuh app - Initial basic configuration file
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const initialWazuhConfig = `---
#
# Wazuh app - App configuration file
# Copyright (C) 2015-2020 Wazuh, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# Find more information about this on the LICENSE file.
#
# ======================== Wazuh app configuration file ========================
#
# Please check the documentation for more information on configuration options:
# https://documentation.wazuh.com/current/installation-guide/index.html
#
# Also, you can check our repository:
# https://github.com/wazuh/wazuh-kibana-app
#
# ------------------------------- Index patterns -------------------------------
#
# Default index pattern to use.
#pattern: wazuh-alerts-3.x-*
#
# ----------------------------------- Checks -----------------------------------
#
# Defines which checks must to be consider by the healthcheck
# step once the Wazuh app starts. Values must to be true or false.
#checks.pattern : true
#checks.template: true
#checks.api     : true
#checks.setup   : true
#
# --------------------------------- Extensions ---------------------------------
#
# Defines which extensions should be activated when you add a new API entry.
# You can change them after Wazuh app starts.
# Values must to be true or false.
#extensions.pci       : true
#extensions.gdpr      : true
#extensions.hipaa     : true
#extensions.nist      : true
#extensions.tsc       : true
#extensions.audit     : true
#extensions.oscap     : false
#extensions.ciscat    : false
#extensions.aws       : false
#extensions.gcp       : false
#extensions.virustotal: false
#extensions.osquery   : false
#extensions.docker    : false
#
# ---------------------------------- Time out ----------------------------------
#
# Defines maximum timeout to be used on the Wazuh app requests.
# It will be ignored if it is bellow 1500.
# It means milliseconds before we consider a request as failed.
# Default: 20000
#timeout: 20000
#
# -------------------------------- API selector --------------------------------
#
# Defines if the user is allowed to change the selected
# API directly from the Wazuh app top menu.
# Default: truepi
#api.selector: true
#
# --------------------------- Index pattern selector ---------------------------
#
# Defines if the user is allowed to change the selected
# index pattern directly from the Wazuh app top menu.
# Default: true
#ip.selector: true
#
# List of index patterns to be ignored
#ip.ignore: []
#
# -------------------------------- X-Pack RBAC ---------------------------------
#
# Custom setting to enable/disable built-in X-Pack RBAC security capabilities.
# Default: enabled
#xpack.rbac.enabled: true
#
# ------------------------------ wazuh-monitoring ------------------------------
#
# Custom setting to enable/disable wazuh-monitoring indices.
# Values: true, false, worker
# If worker is given as value, the app will show the Agents status
# visualization but won't insert data on wazuh-monitoring indices.
# Default: true
#wazuh.monitoring.enabled: true
#
# Custom setting to set the frequency for wazuh-monitoring indices cron task.
# Default: 900 (s)
#wazuh.monitoring.frequency: 900
#
# Configure wazuh-monitoring-3.x-* indices shards and replicas.
#wazuh.monitoring.shards: 2
#wazuh.monitoring.replicas: 0
#
# Configure wazuh-monitoring-3.x-* indices custom creation interval.
# Values: h (hourly), d (daily), w (weekly), m (monthly)
# Default: d
#wazuh.monitoring.creation: d
#
# Default index pattern to use for Wazuh monitoring
#wazuh.monitoring.pattern: wazuh-monitoring-3.x-*
#
#
# ------------------------------- App privileges --------------------------------
#admin: true
#
# ---------------------------- Hide manager alerts ------------------------------
# Hide the alerts of the manager in all dashboards and discover
#hideManagerAlerts: false
#
# ------------------------------- App logging level -----------------------------
# Set the logging level for the Wazuh App log files.
# Default value: info
# Allowed values: info, debug
#logs.level: info
#
#-------------------------------- API entries -----------------------------------
#The following configuration is the default structure to define an API entry.
#
#hosts:
#  - <id>:
#     url: http(s)://<url>
#     port: <port>
#     user: <user>
#     password: <password>

hosts:
  - default:
     url: https://localhost
     port: 55000
     user: foo
     password: bar

`;
