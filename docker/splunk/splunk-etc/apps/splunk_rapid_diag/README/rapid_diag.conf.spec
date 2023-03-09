# This file contains configuration settings that the app uses to run.

# Restart required text - file changes:
# You must restart Splunk software after you make changes to this file.

[logging]
log_level = [DEBUG|INFO|WARN|ERROR|EXCEPTION]
* The level at which RapidDiag should write to its log file. 
* RapidDiag writes logs at the severity level that you configure with 
  'log_level', and any higher levels. For example, if you configure 
  'log_level = WARN', RapidDiag writes logs at the WARN, ERROR, and 
  EXCEPTION severity levels.
* Logging levels increase in order of severity. Lower levels provide more 
  information, but increase log file size.
  * DEBUG     - Detailed information for diagnosing problems.
  * INFO      - Confirmation that things are working as expected.
  * WARN      - A warning of a recoverable fault or a problem that might
                occur in the future.
  * ERROR     - A problem that is causing the software to not run as expected.
  * EXCEPTION - A serious error that indicates the program might be unable
                to continue running.
* Default: INFO

[tools]
basepath = <string>
* The path to where the utility should be located.
* If you do not specify 'basepath', the app looks in the directories that 
  the '$PATH' operating system environment variable defines for the utility.
* Default: $SPLUNK_HOME/etc/apps/splunk_rapid_diag/bin/tools

[general]
# Use the [general] section to specify general settings for the RapidDiag app.
outputpath = <string>
* The location where the app stores data.
* Default: $SPLUNK_HOME/var/run/splunk/splunk_rapid_diag

[collectors]
startup_timeout = <positive decimal>
* The amount of time, in seconds, that a snapshot-based data collector 
  waits to terminate data collection if that collection has not completed.
* Default: 300

startup_poll_interval = <positive decimal>
* The amount of time, in seconds, that a data collector waits between 
  attempts to determine whether or not data collection has completed.
* Default: 0.2

[threadpool]
###
# This app uses worker threads to execute diagnostic tasks concurrently. 
# The thread pool manages the number of available threads for task 
# execution. The app has an upper and a lower thread pool size limit. If 
# task load increases, the app creates a new worker thread in the thread 
# pool for waiting tasks, as long as it has not reached the upper thread 
# pool size limit. Use the [threadpool] stanza to manage the number of 
# initially available and maximum number of threads that the app can use 
# for executing diagnostic tasks.
###

threadpool_size_soft_limit = <positive integer>
* The initial number of worker threads in the thread pool.
* RapidDiag uses threads to concurrently execute diagnostic-related tasks.
* Default: 5

threadpool_size_hard_limit = <positive integer>
* The maximum number of worker threads that the RapidDiag app can use to
  execute diagnostic-related tasks.
* If the number of executing tasks exceeds this number, any new tasks must 
  wait for an existing task to complete before RapidDiag can create another
  worker thread to service the tasks.
* RapidDiag processes tasks in a wait state in the order they arrive, and 
  waiting tasks queue indefinitely.
* If you configure this setting to be less than 
  'threadpool_size_soft_limit', the software sets it at 15.
* Default: 15