#   Version 9.0.3
#
# This file contains all possible options for configuring settings for the
# file classifier in source-classifier.conf.
#
# There is a source-classifier.conf in $SPLUNK_HOME/etc/system/default/ To
# set custom configurations, place a source-classifier.conf in
# $SPLUNK_HOME/etc/system/local/.  For examples, see
# source-classifier.conf.example. You must restart Splunk to enable
# configurations.
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles


ignored_model_keywords = <space-separated list of terms>
* Terms to ignore when generating a sourcetype model.
* To prevent sourcetype "bundles/learned/*-model.xml" files from containing
  sensitive terms (e.g. "bobslaptop") that occur very frequently in your
  data files, add those terms to ignored_model_keywords.

ignored_filename_keywords = <space-separated list of terms>
* Terms to ignore when comparing a new sourcename against a known
  sourcename, for the purpose of classifying a source.

