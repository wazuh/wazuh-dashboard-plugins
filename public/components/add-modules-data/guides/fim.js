/*
* Wazuh app - Vulnerabilities interactive extension guide
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import { webDocumentationLink } from "../../../../common/services/web_documentation";
import { i18n } from '@kbn/i18n';

const sysCheckName = i18n.translate("wazuh.components.addModule.guide.sysCheckName", {
	defaultMessage: "Integrity monitoring",
});
const sysCheckTag = i18n.translate(
	"wazuh.components.addModule.guide.sysCheckTag",
	{
		defaultMessage: "sysCheck",
	}
);
const sysCheckDescp = i18n.translate(
	"wazuh.components.addModule.guide.sysCheckDescp",
	{
		defaultMessage: "Configuration options for file integrity monitoring.",
	}
);
const sysCheckCate = i18n.translate("wazuh.components.addModule.guide.sysCheckCate", {
	defaultMessage: "Security information management",
});

const title = i18n.translate("wazuh.components.addModule.guide.titleMonitoring", {
	defaultMessage: "Directories/files to monitoring",
});
const titleDescp = i18n.translate("wazuh.components.addModule.guide.titleDescp", {
	defaultMessage:
		"Add or remove directories to be monitored. You can add multiple directories with different monitoring configurations.",
});
const directoriesName = i18n.translate("wazuh.components.addModule.guide.directoriesName", {
	defaultMessage: "directories",
});
const directoriesDescp = i18n.translate("wazuh.components.addModule.guide.directoriesDescp", {
	defaultMessage: "Use this option to add or remove directories to be monitored. The directories must be comma separated.All files and subdirectories within the noted directories will also be monitored.Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\\.).This is to be set on the system to be monitored (or in the agent.conf, if appropriate).",
});
const commaPlace = i18n.translate(
	"wazuh.components.addModule.guide.commaPlace",
	{
		defaultMessage: "Any directory comma separated",
	}
);
const realtimeName = i18n.translate("wazuh.components.addModule.guide.realtimeName", {
	defaultMessage: "realtime",
});
const realtimeDescp = i18n.translate("wazuh.components.addModule.guide.realtimeDescp", {
	defaultMessage: "This will enable real-time/continuous monitoring on Linux (using the inotify system calls) and Windows systems.Real time only works with directories, not individual files.",
});
const whoDataName = i18n.translate("wazuh.components.addModule.guide.whoDataName", {
	defaultMessage: "who-data",
});
const whoDataDescp = i18n.translate("wazuh.components.addModule.guide.whoDataDescp", {
	defaultMessage:
		"This will enable who-data monitoring on Linux and Windows systems.",
});

const reportName = i18n.translate("wazuh.components.addModule.guide.reportName", {
	defaultMessage: "report_changes",
});
const reportDescp = i18n.translate("wazuh.components.addModule.guide.reportDescp", {
	defaultMessage:
		"Report file changes. This is limited to text files at this time.",
});

const checkAllName = i18n.translate("wazuh.components.addModule.guide.checkAllName", {
	defaultMessage: "check_all",
});
const checkAllDescp = i18n.translate(
	"wazuh.components.addModule.guide.checkAllDescp",
	{
		defaultMessage: "All attributes with the prefix check_ will be activated.",
	}
);

const checkSumName = i18n.translate("wazuh.components.addModule.guide.checkSumName", {
	defaultMessage: "check_sum",
});
const checkSumDescp = i18n.translate("wazuh.components.addModule.guide.checkSumDescp", {
	defaultMessage: 'Check the MD5, SHA-1 and SHA-256 hashes of the files.Same as using check_md5sum="yes", check_sha1sum="yes" and check_sha256sum="yes" at the same time.',
});

const checkMd5Name = i18n.translate("wazuh.components.addModule.guide.checkMd5Name", {
	defaultMessage: "check_md5sum",
});
const checkMd5Descp = i18n.translate("wazuh.components.addModule.guide.checkMd5Descp", {
	defaultMessage: "Check only the MD5 hash of the files.",
});

const check_sha256sumName = i18n.translate("wazuh.components.addModule.guide.check_sha256sumName", {
	defaultMessage: "check_sha256sum",
});
const check_sha256sumDescp = i18n.translate("wazuh.components.addModule.guide.check_sha256sumDescp", {
	defaultMessage: "Check only the SHA-256 hash of the files.",
});

const check_sizeName = i18n.translate("wazuh.components.addModule.guide.check_sizeName", {
	defaultMessage: "check_size",
});
const check_sizeDescp = i18n.translate("wazuh.components.addModule.guide.check_sizeDescp", {
	defaultMessage: "Check the size of the files.",
});

const check_ownerName = i18n.translate("wazuh.components.addModule.guide.check_ownerName", {
	defaultMessage: "check_owner",
});
const check_ownerDescp = i18n.translate("wazuh.components.addModule.guide.check_ownerDescp", {
	defaultMessage: "Check the owner of the files.On Windows, uid will always be 0.",
});

const check_groupName = i18n.translate("wazuh.components.addModule.guide.check_groupName", {
	defaultMessage: "check_group",
});
const check_groupDescp = i18n.translate("wazuh.components.addModule.guide.check_groupDescp", {
	defaultMessage: "Check the group owner of the files/directories.Available for UNIX. On Windows, gid will always be 0 and the group name will be blank.",
});

const check_permName = i18n.translate("wazuh.components.addModule.guide.check_permName", {
	defaultMessage: "check_perm",
});
const check_permDescp = i18n.translate("wazuh.components.addModule.guide.check_permDescp", {
	defaultMessage: "Check the permission of the files/directories. On Windows, a list of denied and allowed permissions will be given for each user or group since version 3.8.0.Only works on NTFS partitions on Windows systems.",
});

const check_attrsName = i18n.translate("wazuh.components.addModule.guide.check_attrsName", {
	defaultMessage: "check_attrs",
});
const check_attrsDescp = i18n.translate("wazuh.components.addModule.guide.check_attrsDescp", {
	defaultMessage: "Check the attributes of the files.Available for Windows",
});

const check_mtimeName = i18n.translate("wazuh.components.addModule.guide.check_mtimeName", {
	defaultMessage: "check_mtime",
});
const check_mtimeDescp = i18n.translate("wazuh.components.addModule.guide.check_mtimeDescp", {
	defaultMessage: "Check the modification time of a file.",
});

const check_inodeName = i18n.translate("wazuh.components.addModule.guide.check_inodeName", {
	defaultMessage: "check_inode",
});
const check_inodeDescp = i18n.translate("wazuh.components.addModule.guide.check_inodeDescp", {
	defaultMessage: "Check the file inode.Available for UNIX. On Windows, inode will always be 0.",
});

const restrictName = i18n.translate("wazuh.components.addModule.guide.restrictName", {
	defaultMessage: "restrict",
});
const restrictDescp = i18n.translate("wazuh.components.addModule.guide.restrictDescp", {
	defaultMessage: "Limit checks to files containing the entered string in the file name.Any directory or file name (but not a path) is allowed",
});
const restrictPlace = i18n.translate(
	"wazuh.components.addModule.guide.restrictPlace",
	{
		defaultMessage: "sregex",
	}
);
const restrictError = i18n.translate(
	"wazuh.components.addModule.guide.restrictError",
	{
		defaultMessage:
			"Any directory or file name (but not a path) is allowed",
	}
);

const tagsMonitor = i18n.translate("wazuh.components.addModule.guide.tagsDescp", {
	defaultMessage: "Add tags to alerts for monitored directories.",
});

const recursion_levelName = i18n.translate("wazuh.components.addModule.guide.recursion_levelName", {
	defaultMessage: "recursion_level",
});
const recursion_levelDescp = i18n.translate("wazuh.components.addModule.guide.recursion_levelDescp", {
	defaultMessage: "Limits the maximum level of recursion allowed.",
});
const  recursion_levelPlace = i18n.translate(
	"wazuh.components.addModule.guide. recursion_levelPlace",
	{
		defaultMessage: "Any integer between 0 and 320",
	}
);
const  recursion_levelError = i18n.translate(
	"wazuh.components.addModule.guide. recursion_levelError",
	{
		defaultMessage:
			"Any integer between 0 and 320",
	}
);
const follow_symbolic_linkName = i18n.translate("wazuh.components.addModule.guide.follow_symbolic_linkName", {
	defaultMessage: "follow_symbolic_link",
});
const follow_symbolic_linkDescp = i18n.translate("wazuh.components.addModule.guide.follow_symbolic_linkDescp", {
	defaultMessage: "Follow symbolic links (directories or files). The default value is “no”. The setting is available for UNIX systems.If set, realtime works as usual (with symbolic links to directories, not files).",
});
const title1 = i18n.translate("wazuh.components.addModule.guide.ignoreDirectories", {
	defaultMessage: "Ignore directories and/or files",
});
const title1Descp = i18n.translate("wazuh.components.addModule.guide.listOfFiles", {
	defaultMessage: "List of files or directories to be ignored. You can add multiple times this option. These files and directories are still checked, but the results are ignored.",
});
const ignoreName = i18n.translate("wazuh.components.addModule.guide.ignoreName", {
	defaultMessage: "ignore",
});
const ignoreDescp = i18n.translate(
	"wazuh.components.addModule.guide.ignoreDescp.fim",
	{
		defaultMessage: "File or directory to be ignored.",
	}
);
const ignorePlace = i18n.translate(
	"wazuh.components.addModule.guide.ignorePlace.fim",
	{
		defaultMessage: "File/directory path",
	}
);
const sregexName = i18n.translate("wazuh.components.addModule.guide.sregexName", {
	defaultMessage: "type",
});
const sregexDescp = i18n.translate(
	"wazuh.components.addModule.guide.sregexDescp",
	{
		defaultMessage: "This is a simple regex pattern to filter out files so alerts are not generated.",
	}
);
const sregexPlace = i18n.translate(
	"wazuh.components.addModule.guide.sregexPlace",
	{
		defaultMessage: "sregex",
	}
);
const sregexDefault = i18n.translate(
	"wazuh.components.addModule.guide.sregexDefault",
	{
		defaultMessage: "sregex",
	}
);
const title2 = i18n.translate("wazuh.components.addModule.guides.fim.notCompute", {
	defaultMessage: "Not compute",
});
const title2Descp = i18n.translate("wazuh.components.addModule.guide.title2Descp", {
	defaultMessage: "List of files to not compute the diff. You can add multiple times this option. It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts..",
});
const nodiffName = i18n.translate("wazuh.components.addModule.guide.nodiffName", {
	defaultMessage: "nodiff",
});
const nodiffDescp = i18n.translate(
	"wazuh.components.addModule.guide.nodiffDescp",
	{
		defaultMessage: "File to not compute the diff.",
	}
);
const nodiffPlace = i18n.translate(
	"wazuh.components.addModule.guide.nodiffPlace",
	{
		defaultMessage: "File path",
	}
);
const nodiffError = i18n.translate(
	"wazuh.components.addModule.guide.nodiffError",
	{
		defaultMessage:
			"Any file name. e.g. /etc/ssl/private.key",
	}
);
const title3 = i18n.translate("wazuh.components.addModule.guide.fim.scan", {
	defaultMessage: "Scan day",
});
const title3Descp = i18n.translate("wazuh.components.addModule.guide.title3Descp", {
	defaultMessage: "Day of the week to run the scans. You can add multiple times this option.",
});
const scan_dayName = i18n.translate("wazuh.components.addModule.guide.scan_dayName", {
	defaultMessage: "scan_day",
});
const scan_dayDescp = i18n.translate(
	"wazuh.components.addModule.guide.scan_dayDescp",
	{
		defaultMessage: "Day of the week to run the scans.",
	}
);
const weakDaysName = i18n.translate('wazuh.components.addModule.guide.weakDaysName', {
	defaultMessage: 'sunday',
});
const weakDays1Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays1Name',
	{
		defaultMessage: 'monday',
	},
);
const weakDays2Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays2Name',
	{
		defaultMessage: 'tuesday',
	},
);
const weakDays3Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays3Name',
	{
		defaultMessage: 'wednesday',
	},
);
const weakDays4Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays4Name',
	{
		defaultMessage: 'thursday',
	},
);
const weakDays5Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays5Name',
	{
		defaultMessage: 'friday',
	},
);
const weakDays6Name = i18n.translate(
	'wazuh.components.addModule.guide.weakDays6Name',
	{
		defaultMessage: 'saturday',
	},
);
const weakDaysDefault = i18n.translate('wazuh.components.addModule.guide.weakDaysDefault', {
	defaultMessage: 'sunday',
});
const weakDaysError = i18n.translate('wazuh.components.addModule.guide.weakDaysError', {
	defaultMessage: 'Day of the week.',
});
const title4 = i18n.translate("wazuh.components.addModule.guide.windowRegistry", {
	defaultMessage: "Windows registry",
});
const title4Descp = i18n.translate("wazuh.components.addModule.guide.windowOption", {
	defaultMessage: "Use this option to monitor specified Windows registry entries. You can add multiple times this option.",
});
const winName = i18n.translate("wazuh.components.addModule.guide.winName", {
	defaultMessage: "windows_registry",
});
const winDescp = i18n.translate(
	"wazuh.components.addModule.guide.winDescp",
	{
		defaultMessage: "Use this option to monitor specified Windows registry entries',info: 'New entries will not trigger alerts, only changes to existing entries.",
	}
);
const winPlace = i18n.translate("wazuh.components.addModule.guide.winPlace", {
	defaultMessage: "Windows registry entry",
});
const archName = i18n.translate("wazuh.components.addModule.guide.archName", {
	defaultMessage: "arch",
});
const archDescp = i18n.translate(
	"wazuh.components.addModule.guide.archDescp",
	{
		defaultMessage: "Select the Registry view depending on the architecture.",
	}
);
const text1 = i18n.translate(
	"wazuh.components.addModule.guide.bitText",
	{
		defaultMessage: "32bit",
	}
);
const text2 = i18n.translate(
	"wazuh.components.addModule.guide.fim.bit",
	{
		defaultMessage: "64bit",
	}
);
const text3 = i18n.translate(
	"wazuh.components.addModule.guide.text3",
	{
		defaultMessage: "both",
	}
);
const tagsName = i18n.translate("wazuh.components.addModule.guide.tagsName", {
	defaultMessage: "tags",
});
const tagsDescp = i18n.translate("wazuh.components.addModule.guide.monitorEntries", {
	defaultMessage: "Add tags to alerts for monitored registry entries.",
});
const tagsPlace = i18n.translate("wazuh.components.addModule.guide.tagsPlace", {
	defaultMessage:
		"Tags list separated by commas",
});
const title5 = i18n.translate("wazuh.components.addModule.guide.title5", {
	defaultMessage: "Registry ignore",
});
const title5Descp = i18n.translate("wazuh.components.addModule.guide.title5Descp", {
	defaultMessage: "List of registry entries to be ignored.",
});
const registry_ignoreName = i18n.translate("wazuh.components.addModule.guide.registry_ignoreName", {
	defaultMessage: "registry_ignore",
});
const registry_ignoreDescp = i18n.translate("wazuh.components.addModule.guide.registry_ignoreDescp", {
	defaultMessage:
		"List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.",
});
const registry_ignorePlace = i18n.translate("wazuh.components.addModule.guide.registry_ignorePlace", {
	defaultMessage: "Any registry entry.",
});
const registry_ignoreError = i18n.translate("wazuh.components.addModule.guide.registry_ignoreError", {
	defaultMessage:
		"Any registry entry.",
});
const title6 = i18n.translate("wazuh.components.addModule.guide.title6", {
	defaultMessage: "Other settings",
});
const frequencyName = i18n.translate("wazuh.components.addModule.guide.frequencyName", {
	defaultMessage: "frequency",
});
const frequencyDescp = i18n.translate("wazuh.components.addModule.guide.frequencyDescp", {
	defaultMessage:
		"Frequency that the syscheck will be run (in seconds).",
});
const frequencyPlace = i18n.translate("wazuh.components.addModule.guide.frequencyPlace", {
	defaultMessage: "Time in seconds.",
});
const frequencyError = i18n.translate("wazuh.components.addModule.guide.frequencyError", {
	defaultMessage:
		"A positive number, time in seconds.",
});
const scan_timeName = i18n.translate("wazuh.components.addModule.guide.scan_timeName", {
	defaultMessage: "scan_time",
});
const scan_timeDescp = i18n.translate("wazuh.components.addModule.guide.scan_timeDescp", {
	defaultMessage:
		"Time to run the scans. Times may be represented as 9pm or 8:30.",
});
const scan_timePlace = i18n.translate("wazuh.components.addModule.guide.scan_timePlace", {
	defaultMessage: "Time of day",
});
const scan_timeInfo = i18n.translate("wazuh.components.addModule.guide.scan_timeInfo", {
	defaultMessage: "This may delay the initialization of real-time scans.",
});
const scan_timeError = i18n.translate("wazuh.components.addModule.guide.scan_timeError", {
	defaultMessage:
		"Time of day represented as 9pm or 8:30",
});
const scan_timeWar = i18n.translate("wazuh.components.addModule.guide.scan_timeWar", {
	defaultMessage:
		"This may delay the initialization of real-time scans.",
});
const auto_ignoreName = i18n.translate("wazuh.components.addModule.guide.auto_ignoreName", {
	defaultMessage: "auto_ignore",
});
const auto_ignoreDescp = i18n.translate("wazuh.components.addModule.guide.auto_ignoreDescp", {
	defaultMessage:
		"Specifies whether or not syscheck will ignore files that change too many times (manager only).",
});
const auto_ignoreInfo = i18n.translate("wazuh.components.addModule.guide.auto_ignoreInfo", {
	defaultMessage: "It is valid on: server and local.",
});
const frequency1Name = i18n.translate("wazuh.components.addModule.guide.frequency1Name", {
	defaultMessage: "frequency",
});
const frequency1Descp = i18n.translate("wazuh.components.addModule.guide.frequency1Descp", {
	defaultMessage:
		"Number of times the alert can be repeated in the 'timeframe' time interval..",
});
const frequency1Error = i18n.translate("wazuh.components.addModule.guide.frequency1Error", {
	defaultMessage:
		"Any number between 1 and 99.",
});
const timeframeName = i18n.translate("wazuh.components.addModule.guide.timeframeName", {
	defaultMessage: "timeframe",
});
const timeframeDescp = i18n.translate("wazuh.components.addModule.guide.timeframeDescp", {
	defaultMessage:
		"Time interval in which the number of alerts generated by a file accumulates.",
});
const timeframePlace = i18n.translate("wazuh.components.addModule.guide.timeframePlace", {
	defaultMessage: "Time in seconds",
});
const timeframeError = i18n.translate("wazuh.components.addModule.guide.timeframeError", {
	defaultMessage:
		"Any number between 1 and 43200.",
});
const alert_new_filesName = i18n.translate("wazuh.components.addModule.guide.alert_new_filesName", {
	defaultMessage: "alert_new_files",
});
const alert_new_filesDescp = i18n.translate("wazuh.components.addModule.guide.alert_new_filesDescp", {
	defaultMessage:
		"Specifies if syscheck should alert when new files are created.",
});
const alert_new_filesInfo = i18n.translate("wazuh.components.addModule.guide.alert_new_filesInfo", {
	defaultMessage: "It is valid on: server and local.",
});
const scan_on_startName = i18n.translate("wazuh.components.addModule.guide.scan_on_startName", {
	defaultMessage: "scan_on_start",
});
const scan_on_startDescp = i18n.translate("wazuh.components.addModule.guide.scan_on_startDescp", {
	defaultMessage:
		"Specifies if syscheck scans immediately when started",
});
const allow_remote_prefilter_cmdName = i18n.translate("wazuh.components.addModule.guide.allow_remote_prefilter_cmdName", {
	defaultMessage: "allow_remote_prefilter_cmd",
});
const allow_remote_prefilter_cmdDescp = i18n.translate("wazuh.components.addModule.guide.allow_remote_prefilter_cmdDescp", {
	defaultMessage:
		"Allows prefilter_cmd option apply in remote configuration (agent.conf).",
});
const allow_remote_prefilter_cmdInfo = i18n.translate("wazuh.components.addModule.guide.allow_remote_prefilter_cmdInfo", {
	defaultMessage: "This option only can be activate from the agent side, in its own ossec.conf.",
});
const prefilter_cmdName = i18n.translate("wazuh.components.addModule.guide.prefilter_cmdName", {
	defaultMessage: "prefilter_cmd",
});
const prefilter_cmdDescp = i18n.translate("wazuh.components.addModule.guide.prefilter_cmdDescp", {
	defaultMessage:
		"Run to prevent prelinking from creating false positives.",
});
const prefilter_cmdInfo = i18n.translate("wazuh.components.addModule.guide.prefilter_cmdInfo", {
	defaultMessage: "This option may negatively impact performance as the configured command will be run for each file checked.This option is ignored when defined at agent.conf if allow_remote_prefilter_cmd is set to no at ossec.conf.",
});
const skip_nfsName = i18n.translate("wazuh.components.addModule.guide.skip_nfsName", {
	defaultMessage: "skip_nfs",
});
const skip_nfsDescp = i18n.translate("wazuh.components.addModule.guide.skip_nfsDescp", {
	defaultMessage:
		"Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.",
});
const skip_devName = i18n.translate("wazuh.components.addModule.guide.skip_devName", {
	defaultMessage: "skip_dev",
});
const skip_devDescp = i18n.translate("wazuh.components.addModule.guide.skip_devDescp", {
	defaultMessage:
		"Specifies if syscheck should scan the /dev directory. (Works on Linux and FreeBSD).",
});
const skip_sysName = i18n.translate("wazuh.components.addModule.guide.skip_sysName", {
	defaultMessage: "skip_sys",
});
const skip_sysDescp = i18n.translate("wazuh.components.addModule.guide.skip_sysDescp", {
	defaultMessage:
		"Specifies if syscheck should scan the /sys directory. (Works on Linux).",
});
const skip_procName = i18n.translate("wazuh.components.addModule.guide.skip_procName", {
	defaultMessage: "skip_proc",
});
const skip_procDescp = i18n.translate("wazuh.components.addModule.guide.skip_procDescp", {
	defaultMessage:
		"Specifies if syscheck should scan the /proc directory. (Works on Linux and FreeBSD).",
});
const windows_audit_intervalName = i18n.translate("wazuh.components.addModule.guide.windows_audit_intervalName", {
	defaultMessage: "windows_audit_interval",
});
const windows_audit_intervalDescp = i18n.translate("wazuh.components.addModule.guide.windows_audit_intervalDescp", {
	defaultMessage:
		"This option sets the frequency in seconds with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.",
});
const windows_audit_intervalPlace = i18n.translate("wazuh.components.addModule.guide.windows_audit_intervalPlace", {
	defaultMessage: "Time in seconds",
});
const windows_audit_intervalError = i18n.translate("wazuh.components.addModule.guide.windows_audit_intervalError", {
	defaultMessage:
		"Any number from 1 to 9999.",
});
const process_priorityName = i18n.translate("wazuh.components.addModule.guide.process_priorityName", {
	defaultMessage: "process_priority",
});
const process_priorityDescp = i18n.translate("wazuh.components.addModule.guide.process_priorityDescp", {
	defaultMessage:
		"Set the nice value for Syscheck process.",
});
const process_priorityInfo = i18n.translate("wazuh.components.addModule.guide.process_priorityInfo", {
	defaultMessage: 'The "niceness" scale in Linux goes from -20 to 19, whereas -20 is the highest priority and 19 the lowest priority.',
});
const process_priorityPlace = i18n.translate("wazuh.components.addModule.guide.process_priorityPlace", {
	defaultMessage: "Time in seconds",
});
const process_priorityError = i18n.translate("wazuh.components.addModule.guide.process_priorityError", {
	defaultMessage:
		"Integer number between -20 and 19.",
});
const max_epsName = i18n.translate("wazuh.components.addModule.guide.max_epsName", {
	defaultMessage: "max_eps",
});
const max_epsDescp = i18n.translate("wazuh.components.addModule.guide.max_epsDescp", {
	defaultMessage:
		"Set the maximum event reporting throughput. Events are messages that will produce an alert.",
});
const max_epsInfo = i18n.translate("wazuh.components.addModule.guide.max_epsInfo", {
	defaultMessage: "0 means disabled.",
});
const max_epsPlace = i18n.translate("wazuh.components.addModule.guide.max_epsPlace", {
	defaultMessage: "Process priority",
});
const max_epsError = i18n.translate("wazuh.components.addModule.guide.max_epsError", {
	defaultMessage:
		"Integer number between 0 and 1000000.",
});
const databaseName = i18n.translate("wazuh.components.addModule.guide.databaseName", {
	defaultMessage: "database",
});
const databaseDescp = i18n.translate("wazuh.components.addModule.guide.databaseDescp", {
	defaultMessage:
		"Specify where is the database going to be stored.",
});
const text4 = i18n.translate("wazuh.components.addModule.guide.fim.disk", {
	defaultMessage: "disk",
});
const text5 = i18n.translate("wazuh.components.addModule.guide.fim.memory", {
	defaultMessage: "memory",
});
const synchronizationName = i18n.translate("wazuh.components.addModule.guide.synchronizationName", {
	defaultMessage: "synchronization",
});
const synchronizationDescp = i18n.translate("wazuh.components.addModule.guide.synchronizationDescp", {
	defaultMessage:
		"The database synchronization settings will be configured inside this tag.",
});
const SpecifiesName = i18n.translate("wazuh.components.addModule.guide.SpecifiesName", {
	defaultMessage: "enabled",
});
const SpecifiesDescp = i18n.translate("wazuh.components.addModule.guide.SpecifiesDescp", {
	defaultMessage:
		"Specifies whether there will be periodic inventory synchronizations or not.",
});
const intervalName = i18n.translate("wazuh.components.addModule.guide.intervalName", {
	defaultMessage: "interval",
});
const intervalDescp = i18n.translate(
	"wazuh.components.addModule.guide.intervalDescp",
	{
		defaultMessage: "Specifies the initial number of seconds between every inventory synchronization. If synchronization fails the value will be duplicated until it reaches the value of max_interval.",
	}
);
const intervalDefault = i18n.translate(
	"wazuh.components.addModule.guide.intervalDefault300",
	{
		defaultMessage: "300s",
	}
);
const intervalError = i18n.translate(
	"wazuh.components.addModule.guide.intervalError",
	{
		defaultMessage:
			"Any number greater than or equal to 0. Allowed sufixes (s, m, h, d).",
	}
);
const max_intervalName = i18n.translate("wazuh.components.addModule.guide.max_intervalName", {
	defaultMessage: "max_interval",
});
const max_intervalDescp = i18n.translate(
	"wazuh.components.addModule.guide.max_intervalDescp",
	{
		defaultMessage: "Specifies the maximum number of seconds between every inventory synchronization.",
	}
);
const max_intervalDefault = i18n.translate(
	"wazuh.components.addModule.guide.max_intervalDefault",
	{
		defaultMessage: "1h",
	}
);
const max_intervalError = i18n.translate(
	"wazuh.components.addModule.guide.max_intervalError",
	{
		defaultMessage:
			"Any number greater than or equal to 0. Allowed sufixes (s, m, h, d).",
	}
);
const response_timeoutName = i18n.translate("wazuh.components.addModule.guide.response_timeoutName", {
	defaultMessage: "response_timeout",
});
const response_timeoutDescp = i18n.translate(
	"wazuh.components.addModule.guide.response_timeoutDescp",
	{
		defaultMessage: "Specifies the time elapsed in seconds since the agent sends the message to the manager and receives the response. If the response is not received in this interval, the message is marked as unanswered (timed-out) and the agent may start a new synchronization session at the defined interval.",
	}
);
const response_timeoutError = i18n.translate(
	"wazuh.components.addModule.guide.response_timeoutError",
	{
		defaultMessage:
			"Any number greater than or equal to 0.",
	}
);
const queue_sizeName = i18n.translate("wazuh.components.addModule.guide.queue_sizeName", {
	defaultMessage: "queue_size",
});
const queue_sizeDescp = i18n.translate(
	"wazuh.components.addModule.guide.queue_sizeDescp",
	{
		defaultMessage: "Specifies the queue size of the manager synchronization responses.",
	}
);
const queue_sizeError = i18n.translate(
	"wazuh.components.addModule.guide.queue_sizeError",
	{
		defaultMessage:
			"Integer number between 2 and 1000000.",
	}
);

const maxSynchronization = i18n.translate(
	"wazuh.components.addModule.guide.maxSynchronization",
	{
		defaultMessage: "Set the maximum synchronization message throughput.",
	}
);

const max_epsErrorDescription = i18n.translate(
	"wazuh.components.addModule.guide.max_epsErrorDescription",
	{
		defaultMessage:
			"Integer number between 0 and 1000000. 0 means disabled.",
	}
);
const whodataName = i18n.translate("wazuh.components.addModule.guide.whodataName", {
	defaultMessage: "whodata",
});
const whodataDescp = i18n.translate(
	"wazuh.components.addModule.guide.whodataDescp",
	{
		defaultMessage: "The Whodata options will be configured inside this tag.",
	}
);
const restart_auditName = i18n.translate("wazuh.components.addModule.guide.restart_auditName", {
	defaultMessage: "restart_audit",
});
const restart_auditDescp = i18n.translate(
	"wazuh.components.addModule.guide.restart_auditDescp",
	{
		defaultMessage: "Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.",
	}
);
const audit_keyName = i18n.translate("wazuh.components.addModule.guide.audit_keyName", {
	defaultMessage: "audit_key",
});
const audit_keyDescp = i18n.translate(
	"wazuh.components.addModule.guide.audit_keyDescp",
	{
		defaultMessage: "Set up the FIM engine to collect the Audit events using keys with audit_key. Wazuh will include in its FIM baseline those events being monitored by Audit using audit_key. For those systems where Audit is already set to monitor folders for other purposes, Wazuh can collect events generated as a key from audit_key. This option is only available for Linux systems with Audit.",
	}
);
const audit_keyInfo = i18n.translate(
	"wazuh.components.addModule.guide.audit_keyInfo",
	{
		defaultMessage: "Audit allow inserting spaces inside the keys, so the spaces inserted inside the field <audit_key> will be part of the key.",
	}
);
const audit_keyPlace = i18n.translate(
	"wazuh.components.addModule.guide.audit_keyPlace",
	{
		defaultMessage: "Any string separated by commas",
	}
);
const audit_keyError = i18n.translate(
	"wazuh.components.addModule.guide.audit_keyError",
	{
		defaultMessage:
			"Any string separated by commas",
	}
);
const startup_healthcheckName = i18n.translate("wazuh.components.addModule.guide.startup_healthcheckName", {
	defaultMessage: "startup_healthcheck",
});
const startup_healthcheckDescp = i18n.translate(
	"wazuh.components.addModule.guide.startup_healthcheckDescp",
	{
		defaultMessage: "This option allows to disable the Audit health check during the Whodata engine starting. This option is only available for Linux systems with Audit.",
	}
);
const startup_healthcheckWar = i18n.translate(
	"wazuh.components.addModule.guide.startup_healthcheckWar",
	{
		defaultMessage: "The health check ensures that the rules required by Whodata can be set in Audit correctly and also that the generated events can be obtained. Disabling the health check may cause functioning problems in Whodata and loss of FIM events.",
	}
);
const check_sha1sumName = i18n.translate("wazuh.components.addModule.guide.check_sha1sumName", {
	defaultMessage: "check_sha1sum",
});
const check_sha1sumDescp = i18n.translate("wazuh.components.addModule.guide.check_sha1sumDescp", {
	defaultMessage: 'Check only the SHA-1 hash of the files.',
});
export default {
	id: 'fim',
	xml_tag: sysCheckTag,
	name: sysCheckName,
	description: sysCheckDescp,
	category: sysCheckCate,
	documentation_link: webDocumentationLink(
		'user-manual/reference/ossec-conf/syscheck.html',
	),
	icon: 'filebeatApp',
	avaliable_for_manager: true,
	avaliable_for_agent: true,
	steps: [
		{
			title: title,
			description: titleDescp,
			elements: [
				{
					name: directoriesName,
					description: directoriesDescp,
					type: 'input',
					required: true,
					removable: true,
					repeatable: true,
					repeatable_insert_first: true,
					repeatable_insert_first_properties: {
						removable: false,
					},
					placeholder: commaPlace,
					default_value: '/etc,/usr/bin,/usr/sbin,/bin,/sbin',
					attributes: [
						{
							name: realtimeName,
							description: realtimeDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: whoDataName,
							description: whoDataDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: reportName,
							description: reportDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: checkAllName,
							description: checkAllDescp,
							type: 'switch',
							default_value: true,
						},
						{
							name: checkSumName,
							description: checkSumDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_sha1sumName,
							description: check_sha1sumDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: checkMd5Name,
							description: checkMd5Descp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_sha256sumName,
							description: check_sha256sumDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_sizeName,
							description: check_sizeDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_ownerName,
							description: check_ownerDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_groupName,
							description: check_groupDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_permName,
							description: check_permDescp,
							type: 'switch',
							default_value: false,
							agent_os: 'windows',
						},
						{
							name: check_attrsName,
							description: check_attrsDescp,
							type: 'switch',
							default_value: false,
							agent_os: 'windows',
						},
						{
							name: check_mtimeName,
							description: check_mtimeDescp,
							type: 'switch',
							default_value: false,
						},
						{
							name: check_inodeName,
							description: check_inodeDescp,
							type: 'switch',
							default_value: false,
							agent_os: 'linux',
						},
						{
							name: restrictName,
							description: restrictDescp,
							type: 'input',
							placeholder: restrictPlace,
							default_value: 'sregex',
							field_read_only: true,
							validate_error_message: restrictError,
						},
						{
							name: tagsName,
							description: tagsMonitor,
							type: 'input',
							placeholder: 'Tags list separated by commas',
						},
						{
							name: recursion_levelName,
							description: recursion_levelDescp,
							type: 'input-number',
							default_value: '',
							values: { min: 0, max: 320 },
							placeholder: recursion_levelPlace,
							validate_error_message: recursion_levelError,
						},
						{
							name: follow_symbolic_linkName,
							description: follow_symbolic_linkDescp,
							type: 'switch',
							default_value: false,
							agent_os: 'linux',
						},
					],
				},
			],
		},
		{
			title: title1,
			description: title1Descp,
			elements: [
				{
					name: ignoreName,
					description: ignoreDescp,
					type: 'input',
					removable: true,
					required: true,
					repeatable: true,
					placeholder: ignorePlace,
					attributes: [
						{
							name: sregexName,
							description: sregexDescp,
							type: 'input',
							placeholder: sregexPlace,
							default_value: sregexDefault,
							field_read_only: true,
						},
					],
				},
			],
		},
		{
			title: title2,
			description: title2Descp,
			elements: [
				{
					name: nodiffName,
					description: nodiffDescp,
					type: 'input',
					placeholder: nodiffPlace,
					required: true,
					removable: true,
					repeatable: true,
					validate_error_message: nodiffError,
					attributes: [
						{
							name: sregexName,
							description:sregexDescp,
							type: 'input',
							placeholder: sregexPlace,
							default_value: sregexDefault,
							field_read_only: true,
						},
					],
				},
			],
		},
		{
			title:title3,
			description: title3Descp,
			elements: [
				{
					name: scan_dayName,
					description: scan_dayDescp,
					type: 'select',
					removable: true,
					required: true,
					repeatable: true,
					values: [
						{ value: 'sunday', text: weakDaysName },
						{ value: 'monday', text: weakDays1Name },
						{ value: 'tuesday', text: weakDays2Name },
						{ value: 'wednesday', text: weakDays3Name },
						{ value: 'thursday', text: weakDays4Name },
						{ value: 'friday', text: weakDays5Name },
						{ value: 'saturday', text: weakDays6Name },
					],
					default_value: weakDaysDefault,
					validate_error_message: weakDaysError,
				},
			],
		},
		{
			title: title4,
			description: title4Descp,
			elements: [
				{
					name: winName,
					description: winDescp,
					type: 'input',
					placeholder: winPlace,
					default_value: 'HKEY_LOCAL_MACHINE\\Software',
					required: true,
					repeatable: true,
					removable: true,
					agent_os: 'windows',
					attributes: [
						{
							name: archName,
							description: archDescp,
							type: 'select',
							values: [
								{ value: '32bit', text: text1 },
								{ value: '64bit', text: text2 },
								{ value: 'both', text: text3},
							],
							default_value: '32bit',
						},
						{
							name: tagsName,
							description: tagsDescp,
							type: 'input',
							placeholder: tagsPlace,
						},
					],
				},
			],
		},
		{
			title: title5,
			description: title5Descp,
			elements: [
				{
					name: registry_ignoreName,
					description: registry_ignoreDescp,
					type: 'input',
					placeholder: registry_ignorePlace,
					validate_error_message: registry_ignoreError,
					toggeable: true,
					attributes: [
						{
							name: archName,
							description:
								archDescp,
							type: 'select',
							values: [
								{ value: '32bit', text: text1 },
								{ value: '64bit', text: text2 },
								{ value: 'both', text: text3 },
							],
							default_value: '32bit',
						},
						{
							name: tagsName,
							description:tagsDescp,
							type: 'input',
							placeholder: sregexPlace,
						},
					],
				},
			],
		},
		{
			title: title6,
			description: '',
			elements: [
				{
					name: frequencyName,
					description: frequencyDescp,
					type: 'input-number',
					required: true,
					default_value: 43200,
					values: { min: 1 },
					placeholder: frequencyPlace,
					validate_error_message: frequencyError,
				},
				{
					name: scan_timeName,
					description: scan_timeDescp,
					info: scan_timeInfo,
					type: 'input',
					placeholder: scan_timePlace,
					validate_error_message: scan_timeError,
					validate_regex:
						/^(((0?[1-9]|1[012])(:[0-5][0-9])?am)|(((0?[0-9])|(1[0-9])|(2[0-4]))(:[0-5][0-9])?pm))|(((0?[0-9])|(1[012])|(2[0-4])):([0-5][0-9]))$/,
					warning: '',
				},
				{
					name: auto_ignoreName,
					description: auto_ignoreDescp,
					info: auto_ignoreInfo,
					type: 'switch',
					agent_type: 'manager',
					show_attributes: true,
					attributes: [
						{
							name: frequency1Name,
							description: frequency1Descp,
							type: 'input-number',
							required: true,
							values: { min: 1, max: 99 },
							default_value: 10,
							validate_error_message: frequency1Error,
						},
						{
							name: timeframeName,
							description: timeframeDescp,
							type: 'input-number',
							required: true,
							placeholder: timeframePlace,
							values: { min: 1, max: 43200 },
							default_value: 3600,
							validate_error_message: timeframeError,
						},
					],
				},
				{
					name: alert_new_filesName,
					description: alert_new_filesDescp,
					info: alert_new_filesInfo,
					type: 'switch',
					default_value: true,
				},
				{
					name: scan_on_startName,
					description: scan_on_startDescp,
					type: 'switch',
					default_value: true,
				},
				{
					name: allow_remote_prefilter_cmdName,
					description:allow_remote_prefilter_cmdDescp,
					info: allow_remote_prefilter_cmdInfo,
					type: 'switch',
					default_value: false,
				},
				{
					name: prefilter_cmdName,
					description:
						prefilter_cmdDescp,
					info: prefilter_cmdInfo,
					type: 'input',
					placeholder: 'Command to prevent prelinking.',
				},
				{
					name: skip_nfsName,
					description:
					 skip_nfsDescp,
					type: 'switch',
					default_value: true,
				},
				{
					name: skip_devName,
					description:
					 skip_devDescp,
					type: 'switch',
					default_value: true,
				},
				{
					name: skip_sysName,
					description:
						skip_sysDescp,
					type: 'switch',
					default_value: true,
				},
				{
					name: skip_procName,
					description:
						skip_procDescp,
					type: 'switch',
					default_value: true,
				},
				{
					name: windows_audit_intervalName,
					description:
						windows_audit_intervalDescp,
					type: 'input-number',
					values: { min: 1, max: 9999 },
					default_value: 300,
					placeholer: windows_audit_intervalPlace,
					validate_error_message: windows_audit_intervalError,
					agent_os: 'windows',
				},
				{
					name: process_priorityName,
					description: process_priorityDescp,
					info:process_priorityInfo,
					type: 'input-number',
					placholder: process_priorityPlace,
					default_value: 10,
					values: { min: -20, max: 19 },
					validate_error_message:process_priorityError,
				},
				{
					name: max_epsName,
					description:
						max_epsDescp,
					info:max_epsInfo,
					type: 'input-number',
					placholder:max_epsPlace,
					default_value: 100,
					values: { min: 0, max: 1000000 },
					validate_error_message: max_epsError,
				},
				{
					name: databaseName,
					description:databaseDescp,
					type: 'select',
					default_value: 'disk',
					values: [
						{ value: 'disk', text: text4 },
						{ value: 'memory', text: text5 },
					],
				},
				{
					name: synchronizationName,
					description:
						synchronizationDescp,
					show_options: true,
					options: [
						{
							name: SpecifiesName,
							description:
								SpecifiesDescp,
							type: 'switch',
							default_value: true,
							required: true,
						},
						{
							name: intervalName,
							description:
								intervalDescp,
							type: 'input',
							default_value: intervalDefault,
							required: true,
							validate_error_message:
								intervalError,
							validate_regex: /^[1-9]\d*[s|m|h|d]$/,
						},
						{
							name: max_intervalName,
							description:
								max_intervalDescp,
							type: 'input',
							default_value: max_intervalDefault,
							required: true,
							validate_error_message:
								max_intervalError,
							validate_regex: /^[1-9]\d*[s|m|h|d]$/,
						},
						{
							name: response_timeoutName,
							description:
								response_timeoutDescp,
							type: 'input-number',
							default_value: 30,
							required: true,
							values: { min: 0 },
							validate_error_message: response_timeoutError,
						},
						{
							name:queue_sizeName,
							description:
								queue_sizeDescp,
							type: 'input-number',
							default_value: 16384,
							required: true,
							values: { min: 0, max: 1000000 },
							validate_error_message:queue_sizeError,
						},
						{
							name: max_epsName,
							description: maxSynchronization,
							info: max_epsInfo,
							type: 'input-number',
							default_value: 10,
							required: true,
							values: { min: 0, max: 1000000 },
							validate_error_message: max_epsErrorDescription,
						},
					],
				},
				{
					name: whoDataName,
					description:
						whoDataDescp,
					options: [
						{
							name: restart_auditName,
							description:
								restart_auditDescp,
							type: 'switch',
							default_value: true,
						},
						{
							name: audit_keyName,
							description:
								audit_keyDescp,
							info: audit_keyInfo,
							type: 'input',
							placeholder: audit_keyPlace,
							validate_error_message: audit_keyError,
							agent_os: 'linux',
						},
						{
							name: startup_healthcheckName,
							description:
								startup_healthcheckDescp,
							warning:
								startup_healthcheckWar,
							type: 'switch',
							default_value: true,
							agent_os: 'linux',
						},
					],
				},
			],
		},
	],
};
