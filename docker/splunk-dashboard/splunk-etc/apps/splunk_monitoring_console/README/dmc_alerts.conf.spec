# This file describes the dmc_alert_data_templates.conf file that is included
# with the Splunk Monitoring Console.
# 
# dmc_alert.conf is meant to correspond with default/savedsearches.conf
#
# Modifying either of these files incongruently will affect the alert editing 
# functionality in the DMC alerts setup page
#

# ---- Alert Data Templates ----
# In some cases, we want to enable the user to be able to singly edit thresholds in the
# preconfigured DMC alerts without having to directly modify the search string for those
# alerts. This requires a templating of each such alert's search string, description
# string, and editable parameters. The template data for this editing, which is used in
# the DMC alerts setup page, is stored in the following stanzas, titled by the name of
# saved search in default/savedsearches.conf.

[<DMC-Alert-Name>]
parameter_labels = <threshold-identifier> (<threshold-unit>), <threshold-identifier> (<threshold-unit>), ...
	* This comma-separated list labels the all the parameters that can edited as a threshold for this preconfigured dmc alert
	* Each threshold is labeled by the a name, a minimal description of the parameter being edited, and the unit for that parameter in parentheses
	* This list's order matches the the order in which the parameters appear in the alert description, from beginning to end

parameter_values = <threshold-current-value>, <threshold-current-value>, ...
	* A comma-separated list of the most recent value for each of the parameters that can edited as a threshold for this alert
	* Each value must be numerical and within the valid range of possible values for this parameter
	* This list's order matches the the order in which the parameters appear in the alert description, from beginning to end

parameter_ranges = [><threshold-min-value>|<threshold-min-value>-<threshold-max-value>], [><threshold-min-value>|<threshold-min-value>-<threshold-max-value>], ..
	* A comma-separated list of the valid range of values for each of the parameters that can be edited as a threshold for this alert
	* There are 2 possible ways to specify the range for each parameter
		* If the parameter has only a lower bound, the format should be 
			* ><threshold-min-value>
			* where the threshold-min-value is the numerical lower bound
		* If the parameter has both a lower bound and an upper bound, the format shoould be
			* <threshold-min-value>-<threshold-max-value>
			* where the threshold-min-value is the numerical lower bound and threshold-max-value is the numerical upper bound
	* This list's order matches the the order in which the parameters appear in the alert description, from beginning to end

param_to_search_conversion = <operator> <operand>|<operator> <operand>..., <operator> <operand>|<operator> <operand>..., ...
	* In some cases, the value displayed in the alert's description may not match exactly to the value that needs to be in the search string
	* This is a comma-separated list of conversion specifiers, one to be applied to the corresponding current value for each threshold parameter in order to get it into the correct form for the search string
	* Each conversion specifier is represented as a series of mathematical operations separated by a pipe, |, where the output of each previous operation serves as the input for the next operation.
		* Each operator is specified in the following format: <operator> <operand>
		* Given an input, the operator specifies what operation should be performed on that input with the numerical operand as the second input
		* Currently only + and * (addition and multiplication) operators are supported
		* The initial input to a conversion specifier is the description string value for the same threshold parameter
	* This list's order matches the the order in which the parameters appear in the alert description, from beginning to end

description_template = <alert-description-template-string>
	* This string is a template of the original description string for the corresponding alert in the dmc saved searches conf file. 
	* Rather than storing the threshold parameter values in the string directly, the string instead has placeholder where each parameter should go.
	* The placeholders are formatted: {<parameter-occurrence-number>}
		* The parameter-occurrence-number is the number that represents the order in which the parameter occurs in the description string
		* Order numbering starts from 0

search_template = <alert-search-template-string>
	* This string is a template of the original search string for the corresponding alert in the dmc saved searches conf file. 
	* Rather than storing the threshold parameter values in the string directly, the string instead has placeholder where each parameter should go.
	* The placeholders are formatted: {<parameter-occurrence-number>}
		* The parameter-occurrence-number is the number that represents the order in which the parameter occurs in the description string
		* Order numbering starts from 0

enabled_for_cloud = [True| False]
    *This boolean value is used to enable or disable alerts for the cloud environment
    * True to enable False to disable

enabled_for_light = [True| False]
    *This boolean value is used to enable or disable alerts for product Light
    * True to enable False to disable

is_editable = [True| False]
    * This value allows a alert to be editable when set to true.