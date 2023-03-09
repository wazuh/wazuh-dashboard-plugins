#   Version 9.0.3
#
# This file contains the set of attributes and values you can expect to find in
# the SPLUNK_HOME/etc/instance.cfg file; the instance.cfg file is not to be
# modified or removed by user.  LEAVE THE instance.cfg FILE ALONE.
#

#
# GLOBAL SETTINGS
# The [general] stanza defines global settings.
#
[general]

guid = <GUID in all-uppercase>
* This setting formerly (before 5.0) belonged in the [general] stanza of
  server.conf file.

* Splunk expects that every Splunk instance will have a unique string for this
  value, independent of all other Splunk instances.  By default, Splunk will
  arrange for this without user intervention.

* Currently used by (not exhaustive):
  * Clustering environments, to identify participating nodes.
  * Splunk introspective searches (Splunk on Splunk, Deployment Monitor,
    etc.), to identify forwarders.

* At startup, the following happens:

  * If server.conf has a value of 'guid' AND instance.cfg has no value of
    'guid', then the value will be erased from server.conf and moved to
    instance.cfg file.

  * If server.conf has a value of 'guid' AND instance.cfg has a value of
    'guid' AND these values are the same, the value is erased from
    server.conf file.

  * If server.conf has a value of 'guid' AND instance.cfg has a value of 'guid'
    AND these values are different, startup halts and error is shown.  Operator
    must resolve this error.  We recommend erasing the value from server.conf
    file, and then restarting.

  * If you are hitting this error while trying to mass-clone Splunk installs,
    please look into the command 'splunk clone-prep-clear-config';
    'splunk help' has help.

* See http://www.ietf.org/rfc/rfc4122.txt for how a GUID (a.k.a. UUID) is
  constructed.

* The standard regexp to match an all-uppercase GUID is
  "[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}".
