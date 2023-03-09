#   Version 4.0
import os
import re
import sys
import subprocess
from subprocess import PIPE, STDOUT
from builtins import range
from future.moves.urllib.parse import quote as urllib_quote
import splunk.clilib.cli_common as comm

import splunk.Intersplunk
import splunk.mining.dcutils as dcu

logger    = dcu.getLogger()
mswindows = (sys.platform == "win32")

results,dummyresults,settings = splunk.Intersplunk.getOrganizedResults()

# These values will be sent to the shell script:
# $0 = scriptname
# $1 = number of events returned
# $2 = search terms
# $3 = fully qualified query string
# $4 = name of saved splunk
# $5 = trigger reason (i.e. "The number of events was greater than 1")
# $6 = link to saved search
# $7 = DEPRECATED - empty string argument
# $8 = file where the results for this search are stored(contains raw results)

# 5 corresponds to the 6th arg passed to this python script which includes the
# name of this script and the path where the user's script is located

# The script will also receive args via stdin - currently only the session
# key which it can use to communicate back to splunkd is sent via stdin.
# The format for stdin args is as follows:
# <url-encoded-name>=<url-encoded-value>\n
# e.g.
# sessionKey=0729f8e0d4edf7ae18327da6a9976596
# otherArg=123456
# <eof>


if len(sys.argv) < 10:
    splunk.Intersplunk.generateErrorResults("Missing arguments to operator 'runshellscript', expected at least 10, got %i." % len(sys.argv))
    exit(1)

script   = sys.argv[1]

if not script:
    splunk.Intersplunk.generateErrorResults("Empty string is not a valid script name")
    exit(2)

# Remove possible enclosing single quotes
if script[0] == "'" and script[-1] == "'":
    script = script[1:-1]

sharedStorage = settings.get('sharedStorage', splunk.Intersplunk.splunkHome())

etcSubdir = None
if 'sharedStorage' in settings:
    etcSubdir = os.path.join(sharedStorage, 'etc')
else:
    etcSubdir = os.environ['SPLUNK_ETC']

baseStorage   = os.path.join(sharedStorage, 'var', 'run', 'splunk')
path          = os.path.join(baseStorage, 'dispatch', sys.argv[9], 'results.csv.gz')

# ensure nothing dangerous
# keep this rule in agreement with etc/system/default/restmap.conf for sane UI
# experience in manager when editing alerts (SPL-49225)
if ".." in script or "/" in script or "\\" in script:
    results = splunk.Intersplunk.generateErrorResults('Script location cannot contain "..", "/", or "\\"')
else:

    # look for scripts first in the app's bin/scripts/ dir, if that fails try SPLUNK_HOME/bin/scripts
    namespace  = settings.get("namespace", None)
    sessionKey = settings.get("sessionKey", None)
    scriptName = script

    if namespace:
        script = os.path.join(etcSubdir,comm.getAppDir(),namespace,"bin","scripts",scriptName)
        if not os.path.exists(script):
            script = os.path.join(etcSubdir,"apps",namespace,"bin","scripts",scriptName)

    # if we fail to find script in SPLUNK_HOME/etc/apps/<app>/bin/scripts - look in SPLUNK_HOME/bin/scripts
    if not namespace or not os.path.exists(script):
        script = os.path.join(splunk.Intersplunk.splunkHome(),"bin","scripts",scriptName)

    if not os.path.exists(script):
        results = splunk.Intersplunk.generateErrorResults('Cannot find script at ' + script)
    else:
        stdin_data = ''
        cmd_args = sys.argv[1:] # drop 'runshellscript'

        # make sure cmd_args has length of 9
        cmd_args    = cmd_args[:9]
        for i in range(9-len(cmd_args)):
           cmd_args.append("")
        cmd_args[0] = script
        cmd_args[8] = path

        stdin_data = "sessionKey=" + urllib_quote(sessionKey) + "\n"

        # strip any single/double quoting
        for i in range(len(cmd_args)):
            if len(cmd_args[i]) > 2 and ((cmd_args[i][0] == '"' and cmd_args[i][-1] == '"') or (cmd_args[i][0] == "'" and cmd_args[i][-1] == "'")):
                 cmd_args[i] = cmd_args[i][1:-1]

        # python's call(..., shell=True,...)  - is broken so we emulate it ourselves
        shell_cmd   = ["/bin/sh"]
        cmd_args_ms = []

        # by default using cmd.exe shell
        use_cmd_exe = True
        if mswindows:
            # escape all special characters of cmd.exe
            cmd_args_ms = []

            # do not escape the first argument, since this is a script name which was validated above for existence
            # Or the last, else we'll have too much escaping in the path of the results to do even simple things like DIR
            cmd_args_ms.append(cmd_args[0])
            for i in range(1, len(cmd_args) - 1):

                # 1. cmd.exe uses the following characters for escaping other characters: \,%,^. Escape them with themselves, e.g. %->%%, ^->^^, \->\\
                temp = re.sub('([\\\%\^])','\\1\\1', cmd_args[i])

                # 2. cmd.exe will split commandlines on these if thier encountered, drop them
                temp = re.sub('(\\n|\\r|\\t)',' ', temp)

                # 3. Replace double quotes with single quotes (Nested quotes don't seem to work on cmd.exe, no matter how much escaping you do)
                temp = re.sub('(\")', '\'', temp)

                # 4. cmd.exe escapes set &><|'`,;=()[]+~  using ^ and escapes ! with ^^.
                temp = re.sub('([\&\>\<\|\'\`\,\;\=\(\)\[\]\+\~ ])','^\\1', temp) # &><|'`,;=()[]+~
                temp = re.sub('([\!])','^^\\1', temp) # !

                cmd_args_ms.append(temp)

            cmd_args_ms.append(cmd_args[8])
            logger.info(str(cmd_args_ms))
            cmd_args = cmd_args_ms
        else:
            logger.info(str(cmd_args))


        # try to read the interpreter from the first line of the file
        try:
            f = open(script)
            line = f.readline().rstrip("\r\n")
            f.close()
            if line.startswith("#!"):
                use_cmd_exe = False

                # Emulate UNIX rules for "#!" lines:
                # 1. Any whitespace (just space and tab, actually) after
                #    the "!" is ignored.  Also whitespace at the end of
                #    the line is dropped
                # 2. Anything up to the next whitespace is the interpreter
                # 3. If there is anything after this whitespace it's
                #    considered to be the argument to pass to the interpreter.
                #    Note that this parsing is very simple -- no quoting
                #    is interpreted and only one argument is parsed.  This
                #    is to match
                line = line[2:].strip(" \t")
                if line:
                    arg_loc = line.replace("\t", " ").find(" ")
                    if arg_loc == -1:
                        shell_cmd = [ line ]
                    else:
                        # The second half here is incorrect; and will break if
                        # the #! includes more than one arg, on unix,
                        # line.split() would be correct
                        shell_cmd = [ line[0:arg_loc], line[arg_loc + 1:].lstrip(" \t") ]
            elif script.endswith(".py"):
                # Try to support python scripts in a portable way.
                # Note, if the user specified a #!, then that takes precedence
                # (eg, run with system python)
                use_cmd_exe = False # python won't understand the escaped stuff

                if mswindows:
                    python_exe = "python.exe"
                else:
                    python_exe = "python"
                python_path = os.path.join(sharedStorage, "bin", python_exe)
                shell_cmd = [ python_path ]

        except Exception as e:
            pass

        # pass args as env variables too - this is to ensure that args are properly passed in windows
        for i in range(len(cmd_args)):
            os.environ['SPLUNK_ARG_' + str(i)] = cmd_args[i]

        try:
            p = None
            if mswindows and use_cmd_exe:

                # SPL-142755 [Triggering external Windows script failing with
                # [Error 193] %1 is not a valid Win32 application]
                # Quote first argument if it contains a space.
                if cmd_args[0].find(' ') != -1:
                    cmd_args[0] = '"' + cmd_args[0] + '"'

                #
                # Windows cmd.exe only allows 8191 characters on the command line.
                # Including possible additional quotes and spaces, this comes down to 8155
                # Trim down the end of the positional arguments until it's below this.
                if sum(len(arg) for arg in cmd_args) > 8155:
                    results = splunk.Intersplunk.generateErrorResults("Positional arguments for script : " + cmd_args[0] + " are too long, truncating")
                    # Start with the likely long argument (search string)
                    cmd2run_ptr = 2
                    while (sum(len(arg) for arg in cmd_args) > 8155) and cmd2run_ptr < 9:
                        cmd_args[cmd2run_ptr] = "ARGUMENT_TOO_LONG"
                        cmd2run_ptr += 1

                #
                # Need to give Popen a string otherwise it will do its own escaping too
                cmd_args_ms_str = ""
                for i in range(len(cmd_args)):
                    if cmd_args[i].find("^") != -1 or cmd_args[i] == '':
                        cmd_args_ms_str += " \"" + cmd_args[i] + "\" "
                    else:
                        cmd_args_ms_str += cmd_args[i] + " "

                p = subprocess.Popen(cmd_args_ms_str, stdin=PIPE, stdout=PIPE, stderr=STDOUT, shell=False)

            else:
                logger.info("runshellscript: " + str(shell_cmd + cmd_args))
                if mswindows:  # windows doesn't support close_fds param
                    p = subprocess.Popen(shell_cmd + cmd_args, stdin=PIPE, stdout=PIPE, stderr=STDOUT, shell=False)
                else:
                    p = subprocess.Popen(shell_cmd + cmd_args, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True, shell=False)

            if p:
               if sys.version_info >= (3, 0):
                    stdin_data = stdin_data.encode()
               p.communicate(input=stdin_data)
               code = p.returncode
               if code!=0:
                     results = splunk.Intersplunk.generateErrorResults("Script: " + cmd_args[0] + " exited with status code: " + str(code))
        except OSError as e:
            results = splunk.Intersplunk.generateErrorResults('Error while executing script ' + str(e))
splunk.Intersplunk.outputResults( results )
