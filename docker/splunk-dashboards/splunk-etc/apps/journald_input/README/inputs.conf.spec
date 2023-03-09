[journald://<name>]
* This is the systemd-journald input component for Splunk


* A list of fields to retrieve is controlled by "journalctl-include-fields" and "journalctl-exclude-fields"
* parameters. For most fields, they will be selected if they are in one of include-fields AND not in exclude-fields.
* The exceptions are MESSAAGE, CURSOR and _REALTIME_TIMESTAMP, that are treated specially by the system.
* An empty journalctl-include-fields setting will be treated as a direction to emit include all fields. If you want
* all fields except XYZ, you can keep journalctl-include-fields empty, and set journalctl-exclude-fields=XYZ
*
* If the param is not explicitly specified, default value will be used
* we will retrieve MESSAGE,__REALTIME_TIMESTAMP,PRIORITY,_SYSTEMD_UNIT,
*                 _SYSTEMD_CGROUP,_TRANSPORT,_PID,_UID,_MACHINE_ID,_GID,_COMM,_EXE
* If the param is explicitly specified, its value will overwrite default fields, but fields
* MESSAGE, __REALTIME_TIMESTAMP, __CURSOR will be always retrieved, but __REALTIME_TIMESTAMP and __CURSOR will
* be used internally and never sent to Splunk as fields. 
* Fields __MONOTONIC_TIMESTAMP and __SOURCE_REALTIME_TIMESTAMP should always be suppressed to decrease
cardinality of data. Use Splunk event time instead.
journalctl-include-fields = <string>

* Once journalctl-include-fields are retrieved, you can filter which fields to send to Splunk using
* the journalctl-exclude-fields parameter. This filter is more expensive than journalctl-output-fields, 
* as it is not natively supported by API and requires post-processing
journalctl-exclude-fields = <string>


* The following config parameters will be directly mapped to journalctl switches, see journalctl documentation.

* the "matches" concept in journalctl
* for example,   _SYSTEMD_UNIT=avahi-daemon.service _PID=28097 +  _SYSTEMD_UNIT=dbus.service
* will show all messages from Avahi service process with PID 28097 plus all messages
* from the D-Bus service
* www.freedesktop.org/software/systemd/journalctl.html
journalctl-filter = <string>

* -u, show messages for the specified systemd unit
journalctl-unit = <string>

* -t, show messages for the specified syslog identifier SYSLOG_IDENTIFIER
journalctl-identifier = <string>

* -p, filter output by message priorities or priority ranges.
journalctl-priority = <string>

* -b, messages from a specific boot
journalctl-boot = <string>

* --facility, syslog facility
journalctl-facility = <string>

* -g, filter output to entries where the MESSAGE= field matches the specified regular expression.
journalctl-grep = <string>

* --user-unit, show messages for the specified user session unit.
journalctl-user-unit = <string>

* -k, show only kernel messages.
journalctl-dmesg = <string>

* -q, suppresses all informational messages
journalctl-quiet = <string>

* reserved for future use
journalctl-freetext = <string>

