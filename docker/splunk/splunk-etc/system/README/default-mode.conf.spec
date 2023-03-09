#   Version 9.0.3
#
# This file documents the syntax of default-mode.conf for comprehension and
# troubleshooting purposes.

# default-mode.conf is a file that exists primarily for Splunk Support and
# Services to configure the Splunk platform.

# CAVEATS:

# DO NOT make changes to default-mode.conf without coordinating with Splunk
# Support or Services.  End-user changes to default-mode.conf are not
# supported.
#
# default-mode.conf *will* be removed in a future version of the Splunk platform,
# along with the entire configuration scheme that it affects. Any settings present
# in default-mode.conf files will be completely ignored at this point.
#
# Settings in default-mode.conf affect how pieces of code communicate.
# Configuration changes in default-mode.conf might fail to work,
# behave unexpectedly, or harm your deployment. Any changes must be made
# only under the guidance of Splunk Support or Services staff for
# use in a specific deployment of Splunk Enterprise.

# INFORMATION:

# The main value of this spec file is to assist in reading these files for
# troubleshooting purposes.  default-mode.conf was originally intended to
# provide a way to describe the alternate setups used by the Splunk Light
# Forwarder and Splunk Universal Forwarder.

# The only reasonable action is to re-enable input pipelines that are
# disabled by default in those forwarder configurations.  However, keep the
# prior caveats in mind.  Any future means of enabling inputs will have a
# different form when this mechanism is removed.

# SYNTAX:

[pipeline:<string>]
disabled = <boolean>
disabled_processors = <string>


[pipeline:<string>]
* Refers to a particular Splunkd pipeline.
* The set of named pipelines is a splunk-internal design. That does not
  mean that the Splunk design is a secret, but it means it is not external
  for the purposes of configuration.
* Useful information on the data processing system of splunk can be found
  in the external documentation, for example
  http://docs.splunk.com/Documentation/Splunk/latest/Deploy/Datapipeline


disabled = <boolean>
* Whether or not the Splunk platform loads the specified pipeline.
* If set to true on a specific pipeline, the pipeline will not be loaded in
  the system.

disabled_processors = <processor1>, <processor2>
* Processors which normally would be loaded in this pipeline are not loaded
  if they appear in this list.
* The set of named processors is again a Splunk-internal design component.
