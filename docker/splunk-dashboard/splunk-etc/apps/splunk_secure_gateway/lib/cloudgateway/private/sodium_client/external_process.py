"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import os
import sys
import tempfile
import subprocess
import platform
import hashlib
from os.path import join, stat

from cloudgateway.private.sodium_client.errors import SodiumProcessError

MAC = 'Darwin'
LINUX = 'Linux'
WINDOWS = 'Windows'

executables = {
    MAC: 'libsodium-server-mac',
    LINUX: 'libsodium-server-linux',
    WINDOWS: 'libsodium-server-win.exe'
}


def start():
    return __init__()


def __hash_file(file_path):
    exe_contents = open(file_path, "r") if sys.version_info < (3, 0) else open(file_path, "rb")
    return __sha256_hex(exe_contents.read())[:8]


def __sha256_hex(input):
    """
    Utility method to get sha256 hash of a string
    :return: a hex string of the sha256 hash
    """
    return hashlib.sha256(input).hexdigest()


def __init__():
    pwd = os.path.dirname(os.path.realpath(__file__))
    home = os.path.expanduser("~")
    tmp = tempfile.gettempdir()

    executable = executables[platform.system()]

    base_path = join(pwd, executable)

    file_hash = __hash_file(base_path)

    dir_preferences = []

    if os.getenv('SPLUNK_HOME'):
        splunk_bin = join(os.getenv('SPLUNK_HOME'), 'bin')
        dir_preferences += [splunk_bin]

    dir_preferences += [home, pwd, tmp]

    for target_dir in dir_preferences:
        try:
            proc = __start_process(base_path, target_dir, file_hash)
            return proc
        except OSError:
            pass

    sys.stderr.write("Could not find a directory for libsodium process, tried: %s" % dir_preferences)
    raise SodiumProcessError()


def __start_process(base_executable, target_dir, sodium_client_hash):
    abs_executable = join(target_dir, 'libsodium-server.%s' % sodium_client_hash)

    if not os.path.isfile(abs_executable):
        copy = 'cp'
        if platform.system() == WINDOWS:
            copy = 'copy'

        copy_cmd = '{0} "{1}" "{2}"'.format(copy, base_executable, abs_executable)
        os.system(copy_cmd)

        os.chmod('%s' % abs_executable, stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR)

    proc = subprocess.Popen(abs_executable, stdout=subprocess.PIPE, stdin=subprocess.PIPE)
    return proc
