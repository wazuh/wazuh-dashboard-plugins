# pylint: disable=missing-function-docstring,missing-class-docstring
import os
import sys
from typing import Optional, List

import logger_manager as log

_LOGGER = log.setup_logging("detach_process")
IS_LINUX = sys.platform.startswith('linux')

# some packages are available only on Linux :(
if IS_LINUX:
    import resource # pylint: disable=import-error

class DetachProcess:
    @staticmethod
    def _grandchild_become_independent(pipe_to_parent : Optional[int]) -> int:
        # replacing standard input, output, and error by /dev/null
        devnull_fd = os.open(os.devnull, os.O_RDWR)
        if pipe_to_parent is None:
            os.dup2(devnull_fd, 0)
        else:
            os.dup2(pipe_to_parent, 0)
        os.dup2(devnull_fd, 1)
        os.dup2(devnull_fd, 2)

        # closing all open file descriptors
        for fd in range(3, resource.getrlimit(resource.RLIMIT_NOFILE)[0]):
            try:
                os.close(fd)
            except OSError:
                pass

        os.chdir("/")
        os.setsid()
        os.umask(0o27)

        return 0

    @staticmethod
    def _child_create_independent_grandchild(pipe_to_parent : int, stdin : Optional[str]) -> int: # pylint: disable=inconsistent-return-statements
        pipe_to_child : Optional[int] = None
        pipe_to_grandchild : Optional[int] = None
        if stdin is not None:
            pipe_to_child, pipe_to_grandchild = os.pipe()
        try:
            grandchild_pid = os.fork()
            if grandchild_pid == 0:
                return DetachProcess._grandchild_become_independent(pipe_to_child)
            # The father of the grandchild knows the grandchild's PID! push it through the pipe.
            # It is also disposable in a double-fork decouple, so make it exit quietly here.
            msg = str(grandchild_pid) + '\n'
            with os.fdopen(pipe_to_parent, "w") as file_p:
                file_p.write(msg)
            if pipe_to_grandchild is not None and stdin is not None:
                # ideally we'd select on the child's file descriptor to make sure they want to read...
                # writing without checking may cause everything to block if the OS buffer is too small and the
                # child doesn't want to read. the alternatives are to build a protocol for talking to children,
                # or to pass the pipe to grandchild back to the caller so they will figure out what to do. Probably
                # better. TODO check this in the future.
                with os.fdopen(pipe_to_grandchild, "w") as file_p:
                    file_p.write(stdin)
                    file_p.flush()
            os._exit(0)  # pylint: disable=protected-access
        except Exception: # pylint: disable=broad-except
            os._exit(1)  # pylint: disable=protected-access
        finally:
            try:
                if pipe_to_child is not None:
                    os.close(pipe_to_child)
                if pipe_to_grandchild is not None:
                    os.close(pipe_to_grandchild)
            except OSError:
                pass

    @staticmethod
    def _create_independent_process(stdin : Optional[str]) -> int:
        # we want to get the grandchild's PID through this pipe
        read_p, write_p = os.pipe()
        try:
            child_pid = os.fork()
            if child_pid == 0:
                return DetachProcess._child_create_independent_grandchild(write_p, stdin)
            # I am the grandparent and I want to return my grandchild's PID. It should be posted through the pipe.
            with os.fdopen(read_p) as read_f:
                grandchild_pid = int(read_f.readline().strip())
            return grandchild_pid
        finally:
            try:
                os.close(read_p)
                os.close(write_p)
            except OSError:
                pass

    @staticmethod
    def spawnv_detached_with_stdin(filepath : str, args : List[str], stdin : Optional[str] = None) -> int:
        """ Same as os.spawnv(), except we don't take a mode: it's always os.P_DETACH, meaning that the subprocess is
        detached from the parent.
        """

        _LOGGER.info("spawnv_detached: '%s'" , "' '".join(a for a in args if not 'auth' in a))
        pid = DetachProcess._create_independent_process(stdin)
        if pid == 0:
            sys.stdout.flush()
            os._exit(os.execv(filepath, args)) # pylint: disable=protected-access
        return pid
