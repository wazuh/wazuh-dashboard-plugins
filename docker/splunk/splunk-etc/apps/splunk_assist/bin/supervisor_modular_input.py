import asyncio
import logging
import os
import signal

from assist.util import append_lib_to_pythonpath, get_platform

append_lib_to_pythonpath()

from assist.context import Context
from assist import supervisor, constants
from assist.supervisor.supervisor_cmd import DaemonCmd, SupervisorSecrets
from assist.serverinfo import is_assist_prerequisites_met, environment_for_subprocess, is_assist_enabled, \
    is_search_head, is_management_port_enabled
from assist.supervisor.context import build_daemon_cmd, build_supervisor_secrets, SecretError, binary_path, \
    package_home
from assist.logging import setup_logging, logger_name, LogOutput
from assist.modular_input import BaseModularInput


async def _poll_for_updates(log: logging.Logger, supervisor_path_ref: str):
    while asyncio.get_event_loop().is_running():
        supervisor_path = binary_path(log)
        if supervisor_path != supervisor_path_ref:
            log.info("Supervisor path has changed, old=%s, new=%s", supervisor_path_ref, supervisor_path)
            os.kill(os.getpid(), signal.SIGTERM)
            break
        await asyncio.sleep(15)

async def _run_supervisor(log: logging.Logger, cmd: DaemonCmd, secret: SupervisorSecrets):
    log.info("Supervisor using environment=%s", secret.scs_environment)
    supervisor_env = environment_for_subprocess(log)

    supervisor_path = binary_path(log)

    asyncio.create_task(_poll_for_updates(log, supervisor_path))
    await supervisor.run(log, cmd, secret, supervisor_env)


def should_run(log: logging.Logger, session_key: str):
    if not is_management_port_enabled(log):
        return False

    sud = is_assist_enabled(log, session_key)
    sh = is_search_head(log, session_key)
    log.debug("should run test, sh=%s, sud=%s", sh, sud)
    return sh and sud


class SplunkAssistSupervisor(BaseModularInput):
    title = 'Splunk Assist Supervisor'
    description = 'Manages and Executes Splunk Assist Packages'
    app = 'Splunk Assist'
    name = 'Splunk Assist'
    logger: logging.Logger = setup_logging(name=logger_name(__file__), output=LogOutput.FILE)

    def extra_arguments(self):
        return [
        ]


    def do_test(self):
        self.logger.info("Test executed")

    def do_run(self, input_config):
        ctx = Context.new(self.logger)
        if not should_run(self.logger, self.session_key):
            self.logger.debug("Assist Supervisor will not run, not search head")
            return

        try:
            secret = build_supervisor_secrets(self.logger, self.session_key)
        except SecretError:
            self.logger.info("Assist Supervisor cannot start, missing required secrets")
            return

        if not is_assist_prerequisites_met(ctx, self.session_key):
            self.logger.info("Assist Supervisor will not run, prerequisites missing")
            return

        try:
            supervisor_home = package_home()
            cmd = build_daemon_cmd(self.logger, self.session_key, supervisor_home)
        except (OSError, RuntimeError) as e:
            self.logger.error("Assist Supervisor error=%s", str(e))
            return


        if get_platform() == constants.WINDOWS:
            self.logger.debug("Assist Supervisor using proactor event loop")
            loop = asyncio.ProactorEventLoop()
        else:
            loop = asyncio.new_event_loop()

        asyncio.set_event_loop(loop)

        loop.run_until_complete(_run_supervisor(self.logger, cmd, secret))

        self.logger.info("Assist Supervisor exit")


if __name__ == '__main__':
    worker = SplunkAssistSupervisor()
    worker.execute()
