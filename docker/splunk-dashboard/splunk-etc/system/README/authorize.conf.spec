#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# create roles in authorize.conf.
#
# There is an authorize.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name authorize.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see authorize.conf.example. You must restart the Splunk instance
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

[default]
srchFilterSelecting = <boolean>
* Determines whether a role's search filters are used for selecting or
  eliminating during role inheritance.
* If "true", the search filters are used for selecting. The filters are joined
  with an OR clause when combined.
* If "false", the search filters are used for eliminating. The filters are joined
  with an AND clause when combined.
* Example:
  * role1 srchFilter = sourcetype!=ex1 with selecting=true
  * role2 srchFilter = sourcetype=ex2 with selecting = false
  * role3 srchFilter = sourcetype!=ex3 AND index=main with selecting = true
  * role3 inherits from role2 and role 2 inherits from role1
  * Resulting srchFilter = ((sourcetype!=ex1) OR
    (sourcetype!=ex3 AND index=main)) AND ((sourcetype=ex2))
* Default: true

[capability::<capability>]
* DO NOT edit, remove, or add capability stanzas. The existing capabilities
  are the full set of Splunk system capabilities.
* the Splunk platform adds all of its capabilities this way.
* For the default list of capabilities and assignments, see authorize.conf
  under the 'default' directory.
* Only alphanumeric characters and "_" (underscore) are allowed in
  capability names.
  Examples:
  * edit_visualizations
  * view_license1
* Descriptions of specific capabilities are listed below.

[role_<roleName>]
<capability> = <enabled>
* A capability that is enabled for this role. You can list many capabilities
  for each role.
* NOTE: 'enabled' is the only accepted value here, as capabilities are
  disabled by default.
* Roles inherit all capabilities from imported roles, and you cannot disable
  inherited capabilities.
* Role names cannot have uppercase characters. Usernames, however, are
  case-insensitive.
* Role names cannot contain spaces, colons, semicolons, or forward slashes.

importRoles = <semicolon-separated list>
* A list of other roles and their associated capabilities that the Splunk
  platform should import.
* Importing other roles also imports the other aspects of that role, such as
  allowed indexes to search.
* Default: A role imports no other roles

grantableRoles = <semicolon-separated list>
* A list of roles that determines which users, roles, and capabilities
  that a user with a specific set of permissions can manage.
* This setting lets you limit the scope of user, role, and capability
  management that these users can perform.
* When you set 'grantableRoles', a user that holds a role with the
  'edit_roles_grantable' and 'edit_user' capabilities can do only the
  following with regards to access control management for the Splunk
  Enterprise instance:
  * They can edit only the roles that contain capabilities that are a
    union of the capabilities in the roles that you specify
    with this setting.
  * Any new roles that they create can contain only the capabilities
    that are a union of these capabilities.
  * Any new roles that they create can search only the indexes that
    have been assigned to all roles that have been specified with
    this setting.
  * They can see only users who have been assigned roles that contain
    capabilities that are a union of these capabilities.
  * They can assign users only to roles whose assigned capabilities are a
    union of these capabilities.
* For this setting to work, you must assign a user at least one role
  that:
  * Has both the 'edit_roles_grantable' and 'edit_user' capabilities
    assigned to it, and
  * Does NOT have the 'edit_roles' capability assigned to it.
* Example:
  * Consider a Splunk instance where role1-role4 have the
    following capabilities:

    role1: cap1, cap2, cap3
    role2: cap4, cap5, cap6
    role3: cap1, cap6
    role4: cap4, cap8

  * And user1-user4 have been assigned the following roles:
    user1: role1
    user2: role2
    user3: role3
    user4: role4

  * If you define the 'grantableRoles' setting as follows for
    the 'power' role:

  *      [role_power]
  *      grantableRoles = role1;role2

  * and edit the role so that the 'edit_roles_grantable'
    capability is selected, and the 'edit_roles' capability
    is not selected, then a user that has been assigned the 'power' role
    can make only the following access control changes on the instance:
    * View or edit the following users: user1, user2, user3
    * Assign the following roles: role1, role2, role3
    * Create roles with the following capabilities: cap1, cap2, cap3,
    cap4, cap5, cap6
* Only the 'admin' role holds the 'edit_roles_grantable' capability on
  a new Splunk Enterprise installation.
* If you make changes to the 'admin' role, 'grantableRoles' is set to
  "admin".
* This setting does not work if you use tokens to authenticate into a
  Splunk Enterprise instance.
* Default (if 'admin' role is edited): admin
* Default (otherwise): No default

srchFilter = <semicolon-delimited list>
* A list of search filters for this role.
* To override any search filters from imported roles, set this to "*", as
  the 'admin' role does.
* Default: the Splunk platform does not perform search filtering

fieldFilter-<fieldname> = <option>
* Use the 'fieldFilter' configuration to apply a field filter to a specific role
  at search time. This field filter affects the results of searches run by
  users that have the role. The field filter can remove indexed or default
  fields from the results, or it can censor values of specific fields when
  those fields appear in the results.
  * NOTE: Role-based field filters do not support searches that use generating
    commands other than the 'search' command.
* The values available for <option> depend on whether the value of <fieldname>
  is "_raw" or any other field name.
  * When the value of <fieldname> is "_raw", <option> is a sed expression.
    * The sed expression acts on searches to which this filter is applied. The
      sed expression replaces strings in search results that are matched by a
      regular expression (s) or transliterates characters found in search
      results with corresponding characters provided by the sed expression (y).
      * The syntax for using the sed (s) command to replace strings in search
        results that are matched by a regular expression is:
	       s/<regex>/<replacement>/<flags>
      * <regex> is a PCRE regular expression, which can include capturing
        groups.
      * <replacement> is a string that replaces the regular expression match.
        Use \<n> for back references, where <n> is a single digit.
      * <flags> can either be "g", to globally replace all matches, or a
        number to replace a specified number of matches. Other sed flags for
        the (s) command are not supported.
    * The syntax for using the sed (y) command to transliterate characters
      that the Splunk software finds in search results with corresponding
      characters that you provide is:
	       y/<source_characters>/<destination_characters>/
      * The (y) command syntax transliterates the <source_characters> in
        search results with corresponding <destination_characters> that you
        provide in the expression.
      * For example, 'y/abc/def/' replaces 'a' with 'd', 'b' with 'e', and 'c'
        with 'f'. This expression would change the string 'aaabbc' to
        'dddeef'.
      * The lists of <source_characters> and <destination_characters> must
        contain the same number of characters.
  * When the value of <fieldname> is any field name other than "_raw", <option>
    can be [NULL|SHA256|SHA512|<string>].
    * NULL: If <option> is NULL, the Splunk software removes the <fieldname>
      from results of searches to which this filter is applied.
    * SHA256: The Splunk software hashes the <fieldname> value with SHA-256
      encryption wherever the <fieldname> appears in results of searches to
      which this filter is applied.
    * SHA512: The Splunk software hashes the <fieldname> value with SHA-512
      encryption wherever the <fieldname> appears in results of searches to
      which this filter is applied.
    * <string>: The Splunk software replaces the <fieldname> value with the
      specified <string> wherever the <fieldname> appears in results of
      searches to which this filter is applied.
* The Splunk software processes 'fieldFilter' configurations at search time
  ahead of all other search-time operations that add fields to events,
  including field extractions.
  * This means that <fieldname> must be an indexed or default field. Fields
    that are extracted or added at search time do not exist when 'fieldFilter'
    configurations are processed.
* You cannot use wildcards to specify multiple fields for <fieldname>.
* The following example shows how you can use the 'fieldFilter' configuration
  to perform operations on fields in searches run by users with a specific role:
  * At your organization, the indexed field 'user_name' is sensitive for
    security reasons. You have a role named A, and you want users with the A
    role to be unable to access the 'user_name' field in their search results.
    Meanwhile, users with other roles should be able to see 'user_name' fields
    and values as usual.
    * If you want to remove the field from the results of searches run by
      people with role A, apply the following configuration to role A. This
      configuration provides a NULL value for <option>, which means that
      'user_name' is removed from the results of searches by people with role A:
        fieldFilter-user_name = NULL
    * If you want users with role A to see the 'user_name' field in results,
      but with censored values, such as 'user_name = XXXX', apply the following
      configuration to role A:
        fieldFilter-user_name = XXXX
* When you specify 'fieldFilter' configurations for a role that is importing
  other roles (also with 'fieldFilter' configurations), the Splunk software
  processes 'fieldFilter' configurations for the imported roles before it
  processes 'fieldFilter' configurations for roles that are importing other
  roles.
  * For example, say role A has 'fieldFilter-user_name = YYY' and role B has
    'fieldFilter-user_name = XXXX'. If role B imports role A, the Splunk
    software will process the 'fieldFilter' defined for role A first, and
    then it will process the 'fieldFilter' defined for role B. This means that
    users with role B always see 'user_name = XXXX' in their results because
    the role B 'fieldFilter' configuration is processed last.
* The Splunk software runs each role in an import hierarchy only once. If
  multiple roles in an import hierarchy apply a 'fieldFilter' configuration to
  a field, the Splunk software runs them in the order of imported roles to
  roles that are importing other roles in the import hierarchy, from left to
  right as listed in 'importRoles'.
* Do not use the 'fieldFilter' to add new fields. Use calculated fields if you
  want to add fields at search time.
* No default.

fieldFilterLimit = [sourcetype::<sourcetype>|host::<host>|source::<source>]
* Use the 'fieldFilterLimit' configuration to limit the field filters that are
  specified in a role to events with a specific 'host', 'source', or 'source
  type'.
* For example, say role A has this 'fieldFilter' configuration, which
  censors values of the 'user_name' field in searches run by users with that
  role:
     fieldFilter-user_name = xxxx
  * By itself, 'fieldFilter-user_name' configuration applies to all events with
    the 'user_name' field.
  * To apply 'fieldFilter-user_name' only to events that have the 'user_name'
    field and the "zebra" 'source type', you can add this 'fieldFilterLimit'
    configuration to role A:
     fieldFilterLimit = sourcetype::zebra
* When a 'fieldFilterLimit' setting is associated with a role, it applies to
  all 'fieldFilter' settings also associated with that role.
* You can specify only one value. 'fieldFilterLimit' does not support
  statements that include wildcards or the following operators: AND, OR.
* No default.

srchTimeWin = <integer>
* Maximum time range, in seconds, of a search.
* The Splunk platform applies this search time range limit backwards from the
  latest time specified for a search.
* If a user has multiple roles with distinct search time range limits, or has
  roles that inherit from roles with distinct search time range limits,
  the Splunk platform applies the least restrictive search time range limits to
  the role.
  * For example, if user X has role A (srchTimeWin = 30s), role B (srchTimeWin
    = 60s), and role C (srchTimeWin = 3600s), user X gets a maximum search time
    range of 1 hour.
* When set to '-1', the role does not have a search time range limit. This
  value can be overidden by the maximum search time range value of an inherited
  role.
* When set to '0' (infinite), the role does not have a search time range limit.
  This value cannot be overidden by the maximum search time range value of an
  inherited role.
* This setting does not apply to real-time searches.
* Default: -1

srchTimeEarliest = <integer>
* The earliest event time that can be searched, in seconds before the current
  wall clock time.
* If a user is a member of a role with a 'srchTimeEarliest' limit, or a role
  that inherits from other roles with 'srchTimeEarliest' limits, the Splunk
  platform applies the least restrictive time limit from the roles to the user.
  * For example, if a user is a member of role A (srchTimeEarliest = 86400),
    and inherits role B (srchTimeEarliest = 3600) and role C
    (srchTimeEarliest = -1 (default)), the user gets an effective earliest time
    limit of 1 day (86400 seconds) ago.
* When set to '-1', the role does not have a earliest time limit. This
  value can be overidden by the earliest time value of an inherited role.
* When set to '0' (infinite), the role does not have an earliest time limit.
  This value cannot be overidden by the earliest time limit value of an
  inherited role.
* This setting does not apply to real-time searches.
* Default: -1

srchDiskQuota = <integer>
* The maximum amount of disk space, in megabytes, that can be used by search
  jobs for a specific user with this role.
* In search head clustering environments, this setting takes effect on a
  per-member basis. There is no cluster-wide accounting.
* The dispatch manager checks the quota at the dispatch time of a search.
  Additionally, the search process checks the quota at intervals that are defined
  in the 'disk_usage_update_period' setting in limits.conf as long as the
  search is active.
* A user can occasionally exceed the quota because the search process does
  not constantly check the quota.
* Exceeding this quota causes the search to be auto-finalized immediately,
  even if there are results that have not yet been returned.
* When set to 0, this setting does not limit the amount of disk space that
  search jobs for a user with the role can use.
* Default: 100

srchJobsQuota = <integer>
* The maximum number of concurrently running historical searches that a user
  with this role can have.
* When set to 0, this setting does not limit the number of historical search
  jobs that can run concurrently for a user with this role.
* When 'enable_cumulative_quota = true' in limits.conf, the
  'cumulativeSrchJobsQuota' setting overrides this setting.
  * For example, under this condition, if you have a role named 'foo' for which
    'cumulativeSrchJobsQuota = 350' while 'srchJobsQuota = 100' and you have 4
    users with the 'foo' role, those users can only run 350 searches
    concurrently. If you set 'enable_cumulative_quota = false' those users can
    run 400 searches concurrently.
* This setting excludes real-time searches. See the 'rtSrchJobsQuota' setting.
* Default: 3

rtSrchJobsQuota = <integer>
* The maximum number of concurrently running real-time searches that a user
  with this role can have.
* When set to 0, this setting does not limit the number of real-time search
  jobs that can run concurrently for a user with this role.
* When 'enable_cumulative_quota = true' in limits.conf, the
  'cumulativeRTSrchJobsQuota' setting overrides this setting.
  * For example, under this condition, if you have a role named 'foo' for which
    'cumulativeRTSrchJobsQuota = 350' while 'rtSrchJobsQuota = 100' and you
    have 4 users with the 'foo' role, those users can only run 350 searches
    concurrently. If you set 'enable_cumulative_quota = false' those users can
    run 400 searches concurrently.
* Default: 6

srchMaxTime = <integer><unit>
* The maximum amount of time that search jobs from specific users with this role are
  allowed to run.
* After a search runs for this amount of time, it auto-finalizes.
* If the role inherits from other roles, the value of the 'srchMaxTime' setting is
  specified in the included roles.
* This maximum value does not apply to real-time searches.
* Examples: 1h, 10m, 2hours, 2h, 2hrs, 100s
* Default: 100days

srchIndexesDefault = <semicolon-separated list>
* A list of indexes to search when no index is specified.
* These indexes can be wild-carded ("*"), with the exception that "*" does not
  match internal indexes.
* To match internal indexes, start with an underscore ("_"). All internal indexes are
  represented by "_*".
* The wildcard character "*" is limited to match either all the non-internal
  indexes or all the internal indexes, but not both at once.
* No default.

srchIndexesAllowed = <semicolon-separated list>
* A list of indexes that this role is allowed to search.
* Follows the same wildcarding semantics as the 'srchIndexesDefault' setting.
* No default.

srchIndexesDisallowed = <semicolon-separated list>
* A list of indexes that this role does not have permission to search on or delete.
* 'srchIndexesDisallowed' takes precedence over 'srchIndexesAllowed', 'srchIndexesDefault'
  and 'deleteIndexesAllowed'. If you specify indexes in both this setting and the
  other settings, users will be unable to search on or delete those indexes.
* Follows the same wildcarding semantics as the 'srchIndexesDefault' setting.
* If you make any changes in the "Indexes" Settings panel for a role in Splunk Web,
  those values take precedence, and any wildcards you specify in this setting are lost.
* All search heads and search peers must be running Splunk Enterprise version
  8.1.0 or higher.
* No default.

deleteIndexesAllowed = <semicolon-separated list>
* A list of indexes that this role is allowed to delete.
* This setting must be used in conjunction with the 'delete_by_keyword' capability.
* Follows the same wildcarding semantics as the 'srchIndexesDefault' setting.
* No default.

cumulativeSrchJobsQuota = <integer>
* The maximum total number of concurrently running historical searches
  across all members of this role.
* For this setting to take effect, you must set the 'enable_cumulative_quota'
  setting to "true" in limits.conf.
* If a user belongs to multiple roles, the user's searches count against
  the role with the largest cumulative search quota. Once the quota for
  that role is consumed, the user's searches count against the role with
  the next largest quota, and so on.
* In search head clustering environments, this setting takes effect on a
  per-member basis. There is no cluster-wide accounting.
* When set to 0, this setting does not limit the number of real-time search
  jobs that can run concurrently across all users with this role.
* Default: 0

cumulativeRTSrchJobsQuota = <integer>
* The maximum total number of concurrently running real-time searches
  across all members of this role.
* For this setting to take effect, you must set the 'enable_cumulative_quota'
  setting to "true" in limits.conf.
* If a user belongs to multiple roles, the user's searches count against
  the role with the largest cumulative search quota. Once the quota for
  that role is consumed, the user's searches count against the role with
  the next largest quota, and so on.
* In search head clustering environments, this setting takes effect
  on a per-member basis. There is no cluster-wide accounting.
* When set to 0, this setting does not limit the number of historical search
  jobs that can run concurrently across all users with this role.
* Default: 0

####
# Descriptions of Splunk system capabilities.
# Capabilities are added to roles to which users are then assigned.
# When a user is assigned a role, they acquire the capabilities added to that role.
####

[tokens_auth]
* Settings for token authorization.

expiration = <relative-time-modifier>|never
* The relative time when an authorization token expires.
* The syntax for using time modifiers is:
  * [+]<time_integer><time_unit>@<time_unit>
  * Where time_integer is an integer value and time_unit is relative
  * time unit in seconds (s), minutes (m), hours (h) or days (d) etc.
* The steps to specify a relative time modifier are:
  * Indicate the time offset from the current time.
  * Define the time amount, which is a number and a unit.
  * Specify a "snap to" time unit. The time unit indicates the nearest
    or latest time to which your time amount rounds down.
* For example, if you configure this setting to "+2h@h", the token expires at
  the top of the hour, two hours from the current time.
* For more information on relative time identifiers, see "Time Modifiers" in
  the Splunk Enterprise Search Reference Manual.
* The default value indicates that a token never expires. To set token
  expiration, you must set this value to a relative time value.
* Your account must hold the admin role to update this setting.
* This setting is optional.
* Default: +30d

ephemeralExpiration = <relative-time-modifier>
* The relative time when an ephemeral authorization token expires.
* An ephemeral token is identical to a standard authorization token, with the
  following exceptions:
  * The auth system does not keep the token in App Key Value Store.
    This means you cannot modify it after creating it.
  * Ephemeral tokens must always expire, meaning they cannot be given an
    expiration of "never".
  * Currently, ephemeral tokens can only be created using REST.
* The syntax for using time modifiers is:
  * [+]<time_integer><time_unit>@<time_unit>
  * Where time_integer is an integer value and time_unit is relative
  * time unit in seconds (s), minutes (m), hours (h) or days (d) etc.
* The steps to specify a relative time modifier are:
  * Indicate the time offset from the current time.
  * Define the time amount, which is a number and a unit.
  * Specify a "snap to" time unit. The time unit indicates the nearest
    or latest time to which your time amount rounds down.
* For example, if you configure this setting to "+2h@h", the token expires at
  the top of the hour, two hours from the current time.
* For more information on relative time identifiers, see "Time Modifiers" in
  the Splunk Enterprise Search Reference Manual.
* To set ephemeral token expiration, you must set this value to a relative time
  value.
* Your account must hold the admin role to update this setting.
* This setting is optional.
* Maximum: +6h
* Default: +1h

disabled = <boolean>
* Disables and enables Splunk token authorization.
* Default: true

[capability::accelerate_datamodel]
* Lets a user enable or disable data model acceleration.

[capability::accelerate_search]
* Lets a user enable or disable acceleration for reports.
* The assigned role must also be granted the 'schedule_search' capability.

[capability::admin_all_objects]
* Lets a user access all objects in the system, such as user objects and
  knowledge objects.
* Lets a user bypass any Access Control List (ACL) restrictions, similar
  to the way root access in a *nix environment does.
* the Splunk platform checks this capability when accessing manager pages and objects.

[capability::edit_own_objects]
* Lets a user edit the knowledge objects or entities for configuration endpoints
  that they own.

[capability::list_all_objects]
* Lets a user list all configuration settings for the configuration endpoints.
* This capability prevents unauthorized access to configuration endpoints.

[capability::edit_tokens_settings]
* Lets a user access all token auth settings in the system, such as turning the
  the feature on/off and system-wide expiration.
* Splunk checks this capability when accessing manager pages and objects.

[capability::change_authentication]
* Lets a user change authentication settings through the authentication endpoints.
* Lets the user reload authentication.

[capability::change_own_password]
* Lets a user change their own password. You can remove this capability
  to control the password for a user.

[capability::list_tokens_scs]
* Lets a user retrieve a Splunk Cloud Services (SCS) token for an SCS service with which this
  Splunk Cloud deployment has been configured to communicate.

[capability::delete_by_keyword]
* Lets a user use the 'delete' command.
* NOTE: The 'delete' command does not actually delete the raw data on disk.
  Instead, it masks the data (via the index) from showing up in search results.

[capability::delete_messages]
* Lets a user delete system messages that appear in the UI navigation bar.

[capability::edit_log_alert_event]
* Lets a user log an event when an alert condition is met. Also lets the user
  select the "Log an event" option for an alert action in Splunk Web.

[capability::dispatch_rest_to_indexers]
* Lets a user dispatch the REST search command to indexers.

[capability::edit_authentication_extensions]
* Lets a user change the authentication extensions through the
  authentication endpoints.

[capability::edit_bookmarks_mc]
* Lets a user add bookmark URLs within the Monitoring Console.

[capability::edit_deployment_client]
* Lets a user edit the deployment client.
* Lets a user edit a deployment client admin endpoint.

[capability::edit_deployment_server]
* Lets a user edit the deployment server.
* Lets a user edit a deployment server admin endpoint.
* Lets a user change or create remote inputs that are pushed to the
  forwarders and other deployment clients.

[capability::list_dist_peer]
* Lets a user list/read peers for distributed search.

[capability::edit_dist_peer]
* Lets a user add and edit peers for distributed search.
* Supercedes list_dist_peer also allows list/read

[capability::edit_encryption_key_provider]
* Lets a user view and edit keyprovider properties when using
  the Server-Side Encryption (SSE) feature for a remote storage volume.

[capability::request_pstacks]
* Lets a user trigger pstacks generation of the main splunkd process
  using a REST endpoint.

[capability::edit_watchdog]
* Lets a user reconfigure watchdog settings using a REST endpoint.

[capability::edit_forwarders]
* Lets a user edit settings for forwarding data, including settings
  for SSL, backoff schemes, and so on.
* Also used by TCP and Syslog output admin handlers.

[capability::edit_health]
* Lets a user disable or enable health reporting for a feature in the splunkd
  health status tree through the server/health-config/{feature_name} endpoint.

[capability::edit_health_subset]
* Lets a user disable or enable health reporting for a feature in the
  "health_subset" view of the health status tree.
* Actions are performed through the server/health-config/{feature_name}
  endpoint.

[capability::edit_httpauths]
* Lets a user edit and end user sessions through the httpauth-tokens endpoint.

[capability::edit_indexer_cluster]
* Lets a user edit or manage indexer clusters.

[capability::edit_indexerdiscovery]
* Lets a user edit settings for indexer discovery, including settings
  for master_uri, pass4SymmKey, and so on.
* Also used by Indexer Discovery admin handlers.

[capability::edit_ingest_rulesets]
 * Lets a user add, edit, and delete ingest action rule sets
   through the data/ingest/rulesets endpoint.

[capability::edit_input_defaults]
* Lets a user change the default hostname for input data through the server
  settings endpoint.

[capability::edit_local_apps]
* Lets a user edit apps on the local Splunk instance through the
  local apps endpoint.
* For full access to app management, also add the 'install_apps'
  capability to the role.
* To enable enforcement of the "install_apps" capability, see the
  "enable_install_apps" setting in limits.conf.

[capability::edit_monitor]
* Lets a user add inputs and edit settings for monitoring files.
* Also used by the standard inputs endpoint as well as the oneshot input
  endpoint.

[capability::edit_modinput_journald]
* Lets the user add and edit journald inputs. 
* This input is not available on Windows.

[capability::edit_modinput_winhostmon]
* Lets a user add and edit inputs for monitoring Windows host data.

[capability::edit_modinput_winnetmon]
* Lets a user add and edit inputs for monitoring Windows network data.

[capability::edit_modinput_winprintmon]
* Lets a user add and edit inputs for monitoring Windows printer data.

[capability::edit_modinput_perfmon]
* Lets a user add and edit inputs for monitoring Windows performance.

[capability::edit_modinput_admon]
* Lets a user add and edit inputs for monitoring Active Directory (AD).

[capability::edit_roles]
* Lets a user edit roles.
* Lets a user change the mappings from users to roles.
* Used by both user and role endpoints.

[capability::edit_roles_grantable]
* Lets a user edit roles and change user-to-role mappings for a limited
  set of roles.
* To limit this ability, also assign the 'edit_roles_grantable' capability
  and configure the 'grantableRoles' setting in authorize.conf.
  	* For example:
		grantableRoles = role1;role2;role3
        This configuration lets a user create roles using the subset of
        capabilities that the user has in their 'grantable_roles' setting.

[capability::edit_scripted]
* Lets a user create and edit scripted inputs.

[capability::edit_search_head_clustering]
* Lets a user edit and manage search head clustering.

[capability::edit_search_concurrency_all]
* Lets a user edit settings related to maximum concurrency of searches.

[capability::edit_search_concurrency_scheduled]
* Lets a user edit settings related to concurrency of scheduled searches.

[capability::edit_search_scheduler]
* Lets a user disable and enable the search scheduler.

[capability::edit_search_schedule_priority]
* Lets a user assign a search a higher-than-normal schedule priority.

[capability::edit_search_schedule_window]
* Lets a user edit a search schedule window.

[capability::edit_search_server]
* Lets a user edit general distributed search settings like timeouts,
  heartbeats, and deny lists.

[capability::edit_server]
* Lets a user edit general server and introspection settings, such
  as the server name, log levels, and so on.
* This capability also inherits the ability to read general server
  and introspection settings.

[capability::edit_server_crl]
* Lets a user reload Certificate Revocation Lists (CRLs) within Splunk.
* A CRL is a list of digital certificates that have been revoked by the
  issuing certificate authority (CA) before their scheduled expiration
  date and should no longer be trusted.

[capability::edit_sourcetypes]
* Lets a user create and edit sourcetypes.

[capability::edit_splunktcp]
* Lets a user change settings for receiving TCP input from another Splunk
  instance.

[capability::edit_splunktcp_ssl]
* Lets a user view and edit SSL-specific settings for Splunk TCP input.

[capability::edit_splunktcp_token]
* Lets a user view or edit splunktcptokens. The tokens can be used on a
  receiving system to only accept data from forwarders that have been
  configured with the same token.

[capability::edit_tcp]
* Lets a user change settings for receiving general TCP inputs.

[capability::edit_telemetry_settings]
* Lets a user change settings for opting in and sending telemetry data.

[capability::edit_token_http]
* Lets a user create, edit, display, and remove settings for HTTP token input.
* Enables the HTTP Events Collector feature, which is a way to send data to
  Splunk Enterprise and Splunk Cloud.

[capability::edit_tokens_all]
* Lets a user issue tokens to all users.

[capability::edit_tokens_own]
* Lets a user issue tokens to themself.

[capability::edit_udp]
* Lets a user change settings for UDP inputs.

[capability::edit_user]
* Lets a user create, edit, or remove other users.
* Also lets a user manage certificates for distributed search.
* To edit the roles of a user, you must hold roles whose combined capabilities
  either match or exceed the capabilities of the roles that you want to edit
  for the user.
* To let users grant additional roles, assign the
  'edit_roles_grantable' capability and configure the
  'grantableRoles' setting in authorize.conf.
	* Example: grantableRoles = role1;role2;role3

[capability::edit_view_html]
* Lets a user create, edit, or otherwise modify HTML-based views.

[capability::edit_web_settings]
* Lets a user change the settings for web.conf through the system settings
  endpoint.

[capability::export_results_is_visible]
* Lets a user show or hide the Export button in Splunk Web.
* Disable this setting to hide the Export button and prevent users with
  this role from exporting search results.

[capability::get_diag]
* Lets the user generate a diag on a remote instance through the
  /streams/diag endpoint.

[capability::get_metadata]
* Lets a user use the metadata search processor.

[capability::get_typeahead]
* Enables typeahead for a user, both the typeahead endpoint and the
  'typeahead' search processor.

[capability::indexes_edit]
* Lets a user change any index settings such as file size and memory limits.

[capability::input_file]
* Lets a user add a file as an input through the inputcsv command (except for
  dispatch=t mode) and the inputlookup command.

[capability::install_apps]
* Lets a user install, uninstall, create, and update apps on the local
  Splunk platform instance through the apps/local endpoint.
* For full access to app management, also add the 'edit_local_apps'
  capability to the role.
* To enable enforcement of the "install_apps" capability, see the
  "enable_install_apps" setting in limits.conf.

[capability::license_tab]
* DEPRECATED.
* Lets a user access and change the license.
* Replaced with the 'license_edit' capability.

[capability::license_edit]
* Users with this capability can access and change license attributes and related information.

[capability::license_read]
* Users with this capability can access license attributes and related information.

[capability::license_view_warnings]
* Lets a user see if they are exceeding limits or reaching the expiration
  date of their license.
* License warnings are displayed on the system banner.

[capability::list_accelerate_search]
* This capability is a subset of the 'accelerate_search' capability.
* This capability grants access to the summaries that are required to run accelerated reports.
* Users with this capability, but without the 'accelerate_search' capability, can run,
  but not create, accelerated reports.

[capability::list_deployment_client]
* Lets a user list the deployment clients.

[capability::list_deployment_server]
* Lets a user list the deployment servers.

[capability::list_pipeline_sets]
* Lets a user list information about pipeline sets.

[capability::list_forwarders]
* Lets a user list settings for data forwarding.
* Used by TCP and Syslog output admin handlers.

[capability::list_health]
* Lets a user monitor the health of various Splunk features
  (such as inputs, outputs, clustering, and so on) through REST endpoints.

[capability::list_health_subset]
* Lets a user monitor the health of a subset of Splunk features (such as search
  scheduler) through REST endpoints.
* These features are more oriented towards the end user, rather than the Splunk
  administrator.

[capability::list_httpauths]
* Lets a user list user sessions through the httpauth-tokens endpoint.

[capability::list_indexer_cluster]
* Lets a user list indexer cluster objects such as buckets, peers, and so on.

[capability::list_indexerdiscovery]
* Lets a user view settings for indexer discovery.
* Used by indexer discovery handlers.

[capability::list_ingest_rulesets]
* Lets a user view the list of ingest action rule sets
  through the data/ingest/rulesets endpoint.

[capability::list_inputs]
* Lets a user view the list of inputs including files, TCP, UDP, scripts, and so on.

[capability::list_introspection]
* Lets a user read introspection settings and statistics for indexers, search,
  processors, queues, and so on.

[capability::list_search_head_clustering]
* Lets a user list search head clustering objects such as artifacts, delegated
  jobs, members, captain, and so on.

[capability::list_search_scheduler]
* Lets a user list search scheduler settings.

[capability::list_settings]
* Lets a user list general server and introspection settings such as the server
  name and log levels.

[capability::list_metrics_catalog]
* Lets a user list metrics catalog information such as the metric names,
  dimensions, and dimension values.

[capability::edit_metrics_rollup]
* Lets a user create/edit metrics rollup defined on metric indexes.

[capability::list_storage_passwords]
* Lets a user access the /storage/passwords endpoint.
* Lets the user perform GET operations.
* The 'admin_all_objects' capability must be added to the role in order for the user to
  perform POST operations to the /storage/passwords endpoint.

[capability::list_token_http]
* Lets a user display settings for HTTP token input.

[capability::list_tokens_all]
* Lets a user view all tokens.

[capability::list_tokens_own]
* Lets a user view their own tokens.

[capability::never_lockout]
* Allows a user's account to never lockout.

[capability::never_expire]
* Allows a user's account to never expire.

[capability::output_file]
* Lets a user create file outputs, including the 'outputcsv' command (except for
  dispatch=t mode) and the 'outputlookup' command.

[capability::pattern_detect]
* Controls ability to see and use the Patterns tab in the Search view.

[capability::request_remote_tok]
* Lets a user get a remote authentication token.
* Used for distributing search to old 4.0.x Splunk instances.
* Also used for some distributed peer management and bundle replication.

[capability::rest_apps_management]
* Lets a user edit settings for entries and categories in the Python remote
  apps handler.
* See restmap.conf.spec for more information.

[capability::rest_apps_view]
* Lets a user list various properties in the Python remote apps handler.
* See restmap.conf.spec for more info

[capability::rest_properties_get]
* Lets a user get information from the services/properties endpoint.

[capability::rest_properties_set]
* Lets a user edit the services/properties endpoint.

[capability::restart_splunkd]
* Lets a user restart the Splunk platform through the server control handler.

[capability::rtsearch]
* Lets a user run real-time searches.

[capability::run_collect]
* Lets a user run the 'collect' command.

[capability::run_dump]
* Lets a user run the 'dump' command.

[capability::run_custom_command]
* Lets a user run custom search commands.

[capability::run_mcollect]
* Lets a user run the 'mcollect' and 'meventcollect' commands.

[capability::run_msearch]
* Lets a user run the 'mpreview' and 'msearch' commands.

[capability::rest_access_server_endpoints]
* Lets a user run the 'rest' command and access 'services/server/' endpoints.

[capability::run_sendalert]
* Lets a user run the 'sendalert' command.

[capability::run_debug_commands]
* Lets a user run debugging commands, for example 'summarize'.

[capability::run_walklex]
* Lets a user run the 'walklex' command even if they have a role with a search filter.

[capability::run_commands_ignoring_field_filter]
* Lets a user run commands that return index information even when a
  'fieldFilter' is configured for that user's role.
* Some commands can return sensitive index information to which a role
  with a 'fieldFilter' should not have access.
* The following commands require this capability for roles configured with a
  'fieldFilter':  walklex, typeahead, tstats, mstats, mpreview.

[capability::schedule_rtsearch]
* Lets a user schedule real-time saved searches.
* You must enable the 'scheduled_search' and 'rtsearch' capabilities for the role.

[capability::schedule_search]
* Lets a user schedule saved searches, create and update alerts, and
  review triggered alert information.

[capability::metric_alerts]
* Lets a user create and update the new metric alerts.

[capability::search]
* Lets a user run a search.

[capability::search_process_config_refresh]
* Lets a user manually flush idle search processes through the
  'refresh search-process-config' CLI command.

[capability::use_file_operator]
* Lets a user use the 'file' command.
* The 'file' command is DEPRECATED.

[capability::upload_lookup_files]
* Lets a user upload files which can be used in conjunction with lookup definitions.

[capability::upload_mmdb_files]
* Lets a user upload mmdb files, which are used for iplocation searches.

[capability::web_debug]
* Lets a user access /_bump and /debug/** web debug endpoints.

[capability::edit_field_filter]
* Lets a user use an API to update role-based 'fieldFilter' configurations.

[capability::edit_statsd_transforms]
* Lets a user define regular expressions to extract manipulated dimensions out of
  metric_name fields in statsd metric data using the
  services/data/transforms/statsdextractions endpoint.
* For example, dimensions can be mashed inside a metric_name field like
  "dimension1.metric_name1.dimension2" and you can use regular expressions to extract it.

[capability::edit_metric_schema]
* Lets a user define the schema of the log data that must be converted
  to metric format using the services/data/metric-transforms/schema endpoint.

[capability::list_workload_pools]
* Lets a user list and view workload pool and workload status information through
  the workloads endpoint.

[capability::edit_workload_pools]
* Lets a user create and edit workload pool and workload configuration information
  (except workload rule) through the workloads endpoint.

[capability::select_workload_pools]
* Lets a user select a workload pool for a scheduled or ad-hoc search.

[capability::list_workload_rules]
* Lets a user list and view workload rule information from the workloads/rules
  endpoint.

[capability::edit_workload_rules]
* Lets a user create and edit workload rules through the workloads/rules endpoint.

[capability::list_workload_policy]
* Lets a user view workload_policy.conf file settings through the workloads/policy endpoint.
* For now, it is used to view 'admission_rules_enabled' setting under
  stanza [search_admission_control].
* admission_rules_enabled = 1 means the admission rules are enabled in
  [[/manager/system/workload_management|Admission Rules UI]]

[capability::edit_workload_policy]
* Lets a user edit workload_policy.conf file settings through the workloads/policy endpoint.
* For now, it used to change 'admission_rules_enabled' setting under
  stanza [search_admission_control].
* admission_rules_enabled = 1 means the admission rules are enabled in
  [[/manager/system/workload_management|Admission Rules UI]]

[capability::apps_restore]
* Lets a user restore configurations from a backup archive through
  the apps/restore endpoint.

[capability::edit_global_banner]
* Lets a user enable/edit a global banner visible to all users on every page.

[capability::edit_kvstore]
* Lets a user execute KV Store administrative commands through the KV Store REST endpoints.

[capability::list_cascading_plans]
* Lets a user view the generated knowledge bundle replication plans if the chosen replication
  policy in distsearch.conf is set to 'cascading'.

[capability::list_remote_output_queue]
* Lets a user view the configuration details of a configured remote output queue for Splunk Cloud
  and Splunk Cloud Services(SCS) instances.

[capability::list_remote_input_queue]
* Lets a user view the configuration details of a configured remote input queue for Splunk Cloud
  and Splunk Cloud Services(SCS) instances.

[capability::edit_manager_xml]
* Lets a user create and edit XML views using the /data/ui/manager REST endpoint.

[capability::merge_buckets]
* Lets a user merge buckets using cluster-merge-buckets CLI for clustered environments

[capability::read_internal_libraries_settings]
* Lets a user read the 'quarantined/status' REST endpoint and also view
  the Internal Libraries Settings page in Splunk Web.

[capability::edit_web_features]
* Lets a user write to the '/web-features' REST endpoint.


