#
# THIS FILE IS A COPY OF $SPLUNK_SOURCE/python-site/splunk/vix/erp_launcher.py
#

import os
import re
import sys
import time
import splunk.entity as en
import splunk.clilib.cli_common as cli_common
import collections
from subprocess import Popen, PIPE
import traceback
import json
import vixutils_duplicate as vixutils
from distutils import spawn
from threading import Thread
import splunkio_duplicate as splunkio
import datetime
from builtins import map

if sys.version_info >= (3, 0):
    from io import StringIO
    import queue
    from shlex import quote
else:
    import Queue as queue
    from StringIO import StringIO
    from pipes import quote

messageQueue = queue.Queue()
END_MSG = 'THE END'
SUDO_BASH_COMMAND = os.path.join(os.environ['SPLUNK_HOME'], 'etc', 'apps', 'splunk_archiver', 'java-bin', 'jars', 'sudobash')
INDEXER_ARCHIVER_LOCATION_PREFIX = os.path.join(os.environ['SPLUNK_HOME'], 'var', 'run', 'searchpeers')

def _putNamesInVixMap(vix):
    for name, kvs in vix.items():
        kvs['name'] = name
    return vix

def _processVixes(entity):
    d = _entityToDict(entity)
    strippedVixes = _stripVixPrefix(d)
    return _putNamesInVixMap(strippedVixes)

def _stripVixPrefix(vix):
    ret = {}
    for name, kvs in vix.items():
        ret[name] = {}
        for k, v in kvs.items():
            if k.startswith('vix.'):
                ret[name][k.replace('vix.', '', 1)] = v
            else:
                ret[name][k] = v
    return ret

def _getServerId(ses):
    serverInfo =  en.getEntities('/server/info/server-info', sessionKey=ses, count=0)['server-info']
    serverName = 'unknown'
    if 'serverName' in serverInfo:
        serverName = serverInfo['serverName']
    if 'guid' in serverInfo:
        return serverInfo['guid'], serverName
    elif 'unknown' != serverName:
        return serverName, serverName
    else:
        raise Exception('Could not get any server id from indexer')

def _getRequiredArgs(serverId, sessionKey):
    args = {}
    args['splunk.server.uuid'] = serverId
    args['splunk.server.uri'] = cli_common.getMgmtUri()
    args['splunk.server.auth.token'] = sessionKey
    return args

def _getProviderEnv(providerMap):
    env = {}
    for k,v in providerMap.items():
        if isinstance(k, basestring) and k.startswith('env.'):
            envName = k.strip('env.')
            env[envName] = v
    return env

def _getVixCommand(providerMap):
    commands = {}
    for k,v in providerMap.items():
        if k.startswith('command'):
            if k == 'command':
                commands['command.arg.0'] = v
            else:
                commands[k] = v

    commandsByArgOrder = collections.OrderedDict(sorted(commands.items(),
                                                        key=lambda t: int(t[0].split('.')[2])))
    return [v for k, v in commandsByArgOrder.items()]

def _killQuietly(proc):
    try:
        proc.kill()
    except:
        pass

def _parseRaw(raw):
    try:
        return json.loads(raw)
    except:
        return {'_raw':raw}

def _entityToDict(entity):
    m = {}
    for k, v in entity.items():
        if isinstance(v, (en.Entity, dict)):
            m[k] = _entityToDict(v)
        else:
            m[k] = v
    m.pop('eai:acl', None)
    return m

ENV_VAR_PATTERN = re.compile(r'\$\w+')
# Similar logic to that used by PropertiesMap::expandEnvironmentVariables(),
# except this function also allows us to respect any environment variables
# that have been configured using vix.env in conf.
def _expandAllEnvVars(vixEnv, s):
    def expand(match):
        # Trim $.
        varName = match.group()[1:]
        if varName in vixEnv:
            return vixEnv[varName]
        elif varName in os.environ:
            return os.environ[varName]
        return match.group()
    return ENV_VAR_PATTERN.sub(expand, s)

# Executes one java process per index. Can be run in parallel.
def _executeJavaProcesses(action, logFileName, indexFilterFunc, providers, vixes, indexes, serverId, serverName, sessionKey):
    # should be: for providerName in providers.iteritems():
    for providerName, providerMap in providers.items():
        # Create the command string that will be run in the shell
        command = _getVixCommand(providerMap)

        # SPL-157759 Ensure that the only command that
        # can be issued is the sudobash command. The arguments to
        # the sudobash command are validated in the script
        if (command[0] != SUDO_BASH_COMMAND and (not(command[0].startswith(INDEXER_ARCHIVER_LOCATION_PREFIX) and (command[0].endswith('sudobash')))) and (not(command[0].startswith(vixutils.getAppBinJars()) and (command[0].endswith('sudobash'))))):
            sys.stderr.write("Invalid command specified: '" + command[0] + "''\n")
            os._exit(1)

        # SPL-193642 prevent execution of an injected command
        args = command[1:]
        vixEnv = _getProviderEnv(providerMap)
        commandstr = command[0] + ' ' + ' '.join(
            map(lambda arg: quote(_expandAllEnvVars(vixEnv, arg)), args))
            
        # Create json that'll be sent to SplunkMR's stdin
        javaArgs = {}
        javaArgs['action'] = action
        javaArgs['args'] = {action: _getRequiredArgs(serverId, sessionKey)}
        providerMap['family'] = 'hadoop'

        providersVixes = [v for k, v in vixes.items() if v['provider'] == providerName]
        providersIndexes = indexes
        if indexFilterFunc:
            providersIndexes = indexFilterFunc(indexes, providersVixes)

        javaArgs['conf'] = {'indexes' : providersVixes,
                            'provider' : providerMap,
                            'splunk-indexes' : providersIndexes}
        jsonArgs = StringIO()
        json.dump(javaArgs, jsonArgs)

        # create environment vars by combining current env with vix configuration
        vixEnv['SPLUNK_LOG_INCLUDE_TIMESTAMP'] = '1' # any splunk truthy value will do
        vixEnv['SPLUNK_LOG_DEBUG'] = providerMap.get('splunk.search.debug', '0')
        myEnv = os.environ.copy()
        myEnv.update(vixEnv)
        # Filter None's. Popen will crash for values set to None.
        myEnv = dict((k,v) for k,v in myEnv.items() if v is not None)

        # Do execute the java process
        proc = None
        stdout = None
        logfile = None
        try:
            if spawn.find_executable(command[0]) is None:
                raise Exception('Could not find command=' + command[0])

            filename = os.path.join(os.environ['SPLUNK_HOME'], 'var', 'log', 'splunk', logFileName)
            logfile = open(filename, 'a')
            proc = _executeJavaProcessWithArgs(commandstr,  myEnv, logfile)
            proc.stdin.write(jsonArgs.getvalue())
            while proc.poll() is None:
                out = proc.stdout.readline()
                if sys.version_info >= (3, 0): out = out.decode()
                outputLine(out, serverName)
            exit = proc.wait()
            stdout, stderr = proc.communicate()
            if sys.version_info >= (3, 0):
                stdout = stdout.decode()
                stderr = stderr.decode()
            for line in stdout:
                outputLine(line, serverName)

        except Exception as e:
            _outputError(e, traceback.format_exc())
        finally:
            if proc is not None:
                _killQuietly(proc)
            if logfile is not None:
                logfile.close()

# Executes the command right in the shell
def _executeJavaProcessWithArgs(command, env, logfile):
    return Popen(command, env=env, shell=True, stdin=PIPE, stderr=logfile, stdout=PIPE)

def _mapValues(fn, m):
    ret = {}
    for k, v in m.items():
        if isinstance(v, dict):
            ret[k] = _mapValues(fn, v)
        elif isinstance(v, basestring):
            ret[k] = fn(v)
        elif isinstance(v, list):
            ret[k] = map(fn, v)
        else:
            ret[k] = v
    return ret

def _replaceSplunkHomeBinJars(s):
    return s.replace('$SPLUNK_HOME/bin/jars', vixutils.getAppBinJars())

def _replaceAllSplunkHomeBinJars(m):
    return _mapValues(_replaceSplunkHomeBinJars, m)

def _outputError(e, tb):
    _message([{'exception':str(e)}, {'traceback':tb}])

def _escape(s):
    return json.dumps(s, ensure_ascii=False)

# Add _raw if it's not there
def _withRaw(message):
    if '_raw' in message:
        return message
    else:
        raw = ''
        for k,v in message.items():
            raw += _escape(k) + '=' + _escape(v) + ' '
        message['_raw'] = raw
        return message

def _withHost(message, serverName):
    if 'host' not in message:
        message['host'] = serverName
    return message

# takes an array of dicts or a dict
def _message(message):
    if message is END_MSG:
        messageQueue.put_nowait(message)
    elif isinstance(message, dict):
        messageQueue.put_nowait(_withRaw(message))
    else:
        for m in message:
            messageQueue.put_nowait(_withRaw(m))

def _getMessages(timeout):
    messages = []
    now = time.time()
    end = now + timeout
    shouldExit = False
    while now < end:
        try:
            message = messageQueue.get(block=True, timeout=max(0, end - now))
            if message is END_MSG:
                shouldExit = True
                break
            else:
                messages.append(message)
        except Empty:
            break
        now = time.time()
    return (messages, shouldExit)

def _messageSH():
    while True:
        try:
            timeout = 1
            messages, shouldExit = _getMessages(timeout)
            splunkio.write(messages)
            if shouldExit:
                break
        except IOError:
            #Calling os._exit here instead of sys.exit because we want to
            #terminate process itself instead of just this thread. No need
            #to cleanup anything since parent process is gone. Also child
            #java process would track byitself if python process is gone.
            os._exit(1)
        except:
            pass

def _checkParentProcess(serverName):
    raw_segment = "Heartbeat from python process to search process"
    while True:
        t = time.time()
        raw = time.strftime("%a, %d %b %Y %H:%M:%S %Z", time.localtime(t)) + " - " + raw_segment
        msg = {'_time':t,'_raw':raw, 'host':serverName}
        _message(msg)
        time.sleep(5)

def _listIndexes(ses, searchStr=None):
    return en.getEntities('/data/indexes', sessionKey=ses, count=0, search=searchStr)

def outputLine(line, serverName):
    """
    Output a single line of text as an event
    :param line: Either JSON, or else arbitrary text
    :param serverName:
    :return:
    """
    if line != '':
        _message(_withHost(_parseRaw(line), serverName))

def listProviders(ses, searchStr=None):
    """
    Get a list of providers from the local server.
    :param ses: Must be an authentication token for a valid Splunk session. Results will depend on the permissions of
                the associated user.
    :param searchStr: Any additional restrictions on which providers should be returned (e.g. "disabled=0")
    :return: A dict from name to provider, represented as nested dicts. Properties will have the "vix." prefix stripped,
             and the name will be added as the property "name".
    """
    providerList = en.getEntities('/data/vix-providers', sessionKey=ses, count=0, search=searchStr)
    return _processVixes(providerList)

def listVixes(ses, searchStr=None):
    """
    Get a list of virtual indexes from the local server.
    :param ses: Must be an authentication token for a valid Splunk session. Results will depend on the permissions of
                the associated user.
    :param searchStr: Any additional restrictions on which virtual indexes should be returned (e.g. "disabled=0")
    :return: A dict from name to virtual indexes, represented as nested dicts. Properties will have the "vix." prefix stripped,
             and the name will be added as the property "name".
    """
    vixList = en.getEntities('/data/vix-indexes', sessionKey=ses, count=0, search=searchStr)
    return _processVixes(vixList)

def launchSplunkMRForIndexes(sessionKey, action, logFileName, providers, vixes, indexFilterFunc):
    """
    Will execute an action on each of a set of providers. Here "action" is meant in the sense of the ERP protocol
    contract, and must have a handler registerd with the SplunkMR java class. This function expects a set of providers
    and virtual indexes of interest to be provided as arguments. A process will be launched for each
    such provider that is associated with at least one such virtual index. The information in the index's provider's
    configuration will be respected, including the actual command that gets run, environment variables, etc. A set of
    (presumably non-virtual) indexes will be provided to the action as well, based on the provided filtering funciton.

    FILTER FUNCTION

    One argument to this method should be a filter function. This is a function that takes 2 arguments.
    --indexes: A dict of indexes obtained from the REST endpoint.
    --vixes: A dict virtual indexes, which will be a subset of the parameter of the same name to the outer function.

     This method should filter the indexes dict to include only those associated with the vixes. If this method is null,
     the list of indexes will not be filtered before being given to the provider's process. As an example, for archiving,
     this method should take a dict of virtual indexes, and return only those (non-virtual) indexes which get archived
     into the former.

    :param sessionKey: An authentication token for a valid Splunk session.
    :param action: A string that is recognized by the SplunkMR class.
    :param logFileName: Name of the file to which the output of the external process will be piped. Will be placed in
                        the <Splunk home>/var/log/splunk dir.
    :param providers: The providers this command should consider, as a map from provider name to a splunk entity,
                      represented as nested json dicts.
    :param vixes: The virtual indexes this command should consider, as a map from index name to a splunk entity,
                  represented as nested json dicts.
    """
    t = None
    try:
        if sessionKey == None:
            return vixutils.generateErrorResults("username/password authorization not given to 'input'.")

        # Expand env variables
        providers = _replaceAllSplunkHomeBinJars(providers)
        vixes = _replaceAllSplunkHomeBinJars(vixes)

        # Get indexes from the REST endpoint
        indexes = _entityToDict(_listIndexes(sessionKey, 'disabled=0'))
        if indexFilterFunc:
            indexes = indexFilterFunc(indexes, vixes.values())

        serverId, serverName = _getServerId(sessionKey)

        # Everything seems ok, start message thread

        t = Thread(target=_messageSH)
        t.setDaemon(True)
        t.start()
        t_parent_checker = Thread(target=_checkParentProcess,kwargs={'serverName':serverName})
        t_parent_checker.setDaemon(True)
        t_parent_checker.start()
        _executeJavaProcesses(action, logFileName, indexFilterFunc, providers, vixes, indexes, serverId, serverName, sessionKey)
    except Exception as e:
        _outputError(e, traceback.format_exc())
    except KeyError as e:
        _outputError(e, traceback.format_exc())
    finally:
        _message(END_MSG)
        if t is not None:
            t.join(10)
        #No need to join t_parent_checker since it is just checking if parent process is alive or not.
        sys.stdout.flush()
