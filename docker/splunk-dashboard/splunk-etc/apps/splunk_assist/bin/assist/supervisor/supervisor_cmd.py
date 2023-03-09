import enum
import os, os.path
from dataclasses import dataclass
from typing import List, Dict, Optional


class Command(enum.Enum):
    DAEMON = 'daemon'
    ONBOARD = 'onboard'
    DOWNLOAD = 'download'

    def __str__(self):
        return self.value

@dataclass
class OnboardCmd:
    cmd_root: str
    api: str
    app: str

    def to_args(self):
        """
        formats parameters according to
        :return:
        """
        file_path = os.path.dirname(os.path.realpath(__file__))
        exc = os.path.join(file_path, self.cmd_root)
        args_nested = [[f'{exc}'],
                       [str(Command.ONBOARD)],
                       ['--splunk-api', self.api],
                       ['--splunk-app', self.app],
                       ]

        args = [arg_item for arg_group in args_nested for arg_item in arg_group]

        return args

@dataclass
class DownloadCmd:
    cmd_root: str
    api: str
    app: str
    file_url: str
    download_root: str
    sig_url: Optional[str] = None
    sig_pem: Optional[str] = None

    def to_args(self):
        """
        formats parameters according to
        :return:
        """
        file_path = os.path.dirname(os.path.realpath(__file__))
        exc = os.path.join(file_path, self.cmd_root)
        args_nested = [[f'{exc}'],
                       [str(Command.DOWNLOAD)],
                       ['--splunk-api', self.api],
                       ['--splunk-app', self.app],
                       ['--file-url', self.file_url],
                       ['--download-root', self.download_root]
                       ]

        if self.sig_url:
            args_nested.append(['--signature-url', self.sig_url])
        elif self.sig_pem:
            args_nested.append(['--signature-pem', self.sig_pem])

        args = [arg_item for arg_group in args_nested for arg_item in arg_group]

        return args


@dataclass
class OnboardingSecrets:
    deployment_id: str
    license_id: str
    registration_code: str
    splunk_ca_pem: str
    splunk_session_token: str
    splunk_session_token_type: str
    scs_environment: str

    def to_json(self) -> Dict:
        return self.__dict__.copy()


@dataclass
class DaemonCmd:
    cmd_root: str
    api: str
    app: str
    supervisor_id: str
    supervisor_home: str
    roles: List[str]
    splunk_version: str
    cluster_mode: str
    heartbeat_interval: int

    def to_args(self):
        """
        formats parameters according to
        :return:
        """
        file_path = os.path.dirname(os.path.realpath(__file__))
        exc = os.path.join(file_path, self.cmd_root)
        args_nested = [[f'{exc}'],
                       [str(Command.DAEMON)],
                       ['--splunk-api', self.api],
                       ['--splunk-app', self.app],
                       ['--id', self.supervisor_id],
                       ['--home', self.supervisor_home],
                       ['--splunk-version', self.splunk_version],
                       ['--cluster-mode', self.cluster_mode],
                       ['--heartbeat-interval', f'{self.heartbeat_interval}s']
                       ]
        for role in self.roles:
            args_nested.append(['--roles', role])

        args = [arg_item for arg_group in args_nested for arg_item in arg_group]

        return args

@dataclass
class SupervisorSecrets:
    splunk_session_token: str
    splunk_session_token_type: str
    splunk_ca_pem: str
    http_shared_secret: str
    scs_environment: str
    tenant_id: str
    service_principal_id: str
    service_principal_private_key_id: str
    service_principal_private_key_pem: str
    supervisor_group_id: str

    def to_json(self) -> Dict:
        return self.__dict__.copy()
