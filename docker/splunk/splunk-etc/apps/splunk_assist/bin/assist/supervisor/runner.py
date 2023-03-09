import asyncio
import json
import logging
import os
import subprocess
import sys
from asyncio.subprocess import PIPE
from typing import TextIO, Dict, Tuple

from assist import constants
from assist.logging import level_for_supervisor_log
from assist.modular_input import handle_teardown_signals
from assist.parent_process_monitor import ParentProcessMonitor
from assist.supervisor.supervisor_cmd import DaemonCmd, SupervisorSecrets


async def log_stream(log: logging.Logger, r: asyncio.StreamReader, label: str, pid: int, o: TextIO):
    log.info("Output listener started, label=%s, pid=%s", label, pid)
    while True:
        line = await r.readline()
        if not line:
            log.info("Output listener stopped, label=%s, pid=%s", label, pid)
            break

        level, log_line = level_for_supervisor_log(line.decode(constants.CHARSET_UTF8))
        log.log(level, log_line)

async def _write_secrets(w: asyncio.StreamWriter, secrets: SupervisorSecrets):
    jsn = json.dumps(secrets.to_json())
    w.write(jsn.encode('utf8'))
    await w.drain()

async def run(log: logging.Logger, cmd: DaemonCmd, secrets: SupervisorSecrets, env: Dict):
    supervisor_env = os.environ.copy()

    if env is not None:
        supervisor_env.update(env)

    log.info("Supervisor starting, cmd=%s, env=%s", cmd.to_args(), env.keys())

    exec_cmd = cmd.to_args()
    p = await asyncio.create_subprocess_exec(*exec_cmd, stdin=PIPE, stderr=PIPE, stdout=PIPE, env=supervisor_env)

    log.info("Supervisor started, pid=%s", p.pid)

    await _write_secrets(p.stdin, secrets)
    p.stdin.close()

    stderr_read = asyncio.create_task(log_stream(log, p.stderr, "stderr", p.pid, sys.stderr))
    stdout_read = asyncio.create_task(log_stream(log, p.stdout, "stdout", p.pid, sys.stderr))

    def on_orphan(*args, **kwargs):
        nonlocal stderr_read
        nonlocal stdout_read
        log.info("Supervisor orphaned, terminating subprocess")
        p.terminate()
        stderr_read.cancel()
        stdout_read.cancel()

    handle_teardown_signals(on_orphan)

    monitor = ParentProcessMonitor(log)
    asyncio.create_task(monitor.start(on_orphan))

    result = await asyncio.gather(p.wait(), stderr_read, stdout_read, return_exceptions=True)

    log.info("Supervisor process terminated, returncode=%s, process=%s, stderr=%s, stdout=%s", p.returncode, *result)

    return p
