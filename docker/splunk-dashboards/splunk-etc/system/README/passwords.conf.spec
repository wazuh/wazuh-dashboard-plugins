#   Version 9.0.3
#
# This file maintains the credential information for a given app in Splunk Enterprise.
#
# There is no global, default passwords.conf. Instead, anytime a user creates
# a new user or edit a user onwards hitting the storage endpoint
# will create this passwords.conf file which gets replicated
# in a search head clustering enviornment.
# Note that passwords.conf is only created from 6.3.0 release.
#
# You must restart Splunk Enterprise to reload manual changes to passwords.conf.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles


[credential:<realm>:<username>:]
password = <password>
* The password that corresponds to the given username for the given realm.
* NOTE: The realm is optional.
* The password can be in clear text, however when saved from splunkd the
  password will always be encrypted.
