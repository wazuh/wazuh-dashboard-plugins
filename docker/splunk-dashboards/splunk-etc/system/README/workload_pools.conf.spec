#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure workloads for splunk.
#
# There is a workload_pools.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name workload_pools.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see workload_pools.conf.example. You may need to restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each .conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file takes precedence.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.
#
# CAUTION: Do not alter the settings in the workload_pools.conf file unless you know
#     what you are doing.  Improperly configured worloads might result in
#     splunkd crashes, memory overuse, or both.

[general]
enabled = <bool>
* Specifies whether workload management has been enabled on the system or not.
* This setting only applies to the default stanza as a global setting.
* Default: false

default_pool = <string>
* Specifies the default workload pool to be used at runtime for search workloads.
* This setting is maintained for backward compatibility with previous releases.
  Its value is set but is not used in the current release. This value matches the
  default_pool value of [workload_category:search].
* This setting is only applicable when workload management has been enabled in
  the system. If workload management has been enabled, this is a mandatory setting.

ingest_pool = <string>
* Specifies the workload pool for splunkd and helper processes that control
  data ingestion and related actions in the Splunk deployment.
* This setting is maintained for backward compatibility with previous releases.
  Its value is set but is not used in the current release. This value matches the
  default_pool value of [workload_category:ingest].
* This setting is only applicable when workload management has been enabled in
  the system. If workload management has been enabled, this is a mandatory setting.

workload_pool_base_dir_name = <string>
* Specifies the base controller directory name for Splunk cgroups on Linux that is
  used by a Splunk deployment.
* Workload pools created from the workload management page are all created relative
  to this base directory.
* This setting is only applicable when workload management has been enabled in
  the system. If workload management has been enabled, this is a mandatory setting.
* Default: splunk

[workload_pool:<pool_name>]
cpu_weight = <number>
* Specifies the cpu weight to be used by this workload pool.
* This is a percentage of the total cpu resources available to the category to
  which the pool belongs.
* Default: not set

mem_weight = <number>
* Specifies the memory weight to be used by this workload pool.
* This is a percentage of the total memory resources available to the category to
  which the pool belongs.
* This is a mandatory parameter for the creation of a workload pool and only
  allows positive integral values.
* Default: not set

category = <string>
* Specifies the category to which this workload pool belongs.
* Required to create a workload pool.
* Valid categories are "search","misc" and "ingest".
* The "ingest" and "misc" categories each contain one pool only, which is the
  default_pool for the respective category.
* Default: not set

default_category_pool = <boolean>
* Specifies if this pool is the default pool for its category.
* Admin users can specify workload pools associated with roles. If no workload
  pool is found, the default_pool defined for this category is used.
* The first pool that is added to a category has this value set to 1.
* All other pools have this value set to 0.
* Required if workload management is enabled.
* Default: false

[workload_category:<category>]
* Specifies the resource allocation for workload pools in this category.
  The <category> value can be "search","ingest' or "misc".
cpu_weight = <number>
* Specifies the cpu weight to be used by this category.
* This is a percentage of the total cpu resources available to all categories.
* This parameter exists in the default configuration and is editable with values
  that are positive integer values less than 100.
* Default is set.

mem_weight = <number>
* Specifies the memory weight to be used by this category.
* This is a percentage of the total memory resources available to all categories.
* This parameter exists in the default configuration and is editable with values
  that are positive integer values less than 100.
* Default is set.
