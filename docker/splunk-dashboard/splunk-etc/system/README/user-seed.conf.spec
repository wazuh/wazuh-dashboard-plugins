#   Version 9.0.3
#
# Specification for user-seed.conf.  Allows configuration of Splunk's
# initial username and password.  Currently, only one user can be configured
# with user-seed.conf.
#
# Specification for user-seed.conf.  Allows configuration of Splunk's initial username and password.
# Currently, only one user can be configured with user-seed.conf.
#
# To set the default username and password, place user-seed.conf in 
# $SPLUNK_HOME/etc/system/local. You must restart Splunk to enable configurations.
# If the $SPLUNK_HOME/etc/passwd file is present, the settings in this file (user-seed.conf) are not used.
#
# Use HASHED_PASSWORD for a more secure installation. To hash a clear-text password,
# use the 'splunk hash-passwd' command then copy the output to this file.
#
# If a clear text password is set (not recommended) and last character is '\', it should
# be followed by a space for value to be read correctly. Password does not include extra
# space at the end, it is required to ignore the special meaning of backslash in conf file.
#
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
# To learn more about configuration files (including precedence) please see the documentation 
# located at http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

[user_info]
* Default is Admin.

USERNAME = <string> 
          * Username you want to associate with a password.
          * Default is Admin.

PASSWORD = <password>
          * Password you wish to set for that user.
          * Password must meet complexity requirements.

HASHED_PASSWORD = <password hash>
          * Password hash you wish to set for that user.
