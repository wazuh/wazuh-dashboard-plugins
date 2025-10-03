import { existsSync } from 'fs';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import { ValidationError } from '../errors';
import type { Logger } from '../utils/logger';
import type { ProcessRunner } from '../types/deps';

export function runDockerCompose(
  config: ScriptConfig,
  profiles: string[],
  composeFiles: string[],
  envPaths: EnvironmentPaths,
  log: Logger,
  runner: ProcessRunner
): Promise<number> {
  const composeArgs = ['compose'];

  for (const profile of profiles) {
    composeArgs.push('--profile', profile);
  }

  for (const file of composeFiles) {
    composeArgs.push('-f', file);
  }

  switch (config.action) {
    case 'up':
      try {
        if (existsSync(envPaths.createNetworksScriptPath)) {
          runner.execSync(`/bin/bash ${envPaths.createNetworksScriptPath}`, { stdio: 'inherit' });
        }
      } catch (error) {
        log.error('Failed to create docker networks');
      }
      composeArgs.push('up', '-Vd');
      break;
    case 'start':
      composeArgs.push('start');
      break;
    case 'down':
      composeArgs.push('down', '-v', '--remove-orphans');
      break;
    case 'stop':
      composeArgs.push('-p', process.env.COMPOSE_PROJECT_NAME || '', 'stop');
      break;
    case 'manager-local-up':
      composeArgs.push('-p', process.env.COMPOSE_PROJECT_NAME || '', 'up', '-d', 'wazuh.manager.local');
      break;
    default:
      throw new ValidationError('Action must be up | down | stop | start | manager-local-up');
  }

  log.info(`Running: docker ${composeArgs.join(' ')}`);
  return new Promise((resolve) => {
    const child = runner.spawn('docker', composeArgs, { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export function printAgentEnrollmentHint(config: ScriptConfig, log: Logger): void {
  if (config.action !== 'up' || config.mode !== 'server') return;

  const projectName = process.env.COMPOSE_PROJECT_NAME || '';
  const osVersion = process.env.OS_VERSION || '';
  const wazuhStack = process.env.WAZUH_STACK || '';

  log.infoPlain('');
  log.infoPlain('**************WARNING**************');
  log.infoPlain('The agent version must be a published one. This uses only released versions.');
  log.infoPlain('If you need to change de version, edit the command as you see fit.');
  log.infoPlain('***********************************');
  log.infoPlain('1. (Optional) Enroll an agent (Ubuntu 20.04):');
  log.infoPlain(
    `docker run --name ${projectName}-agent-$(date +%s) --network os-dev-${osVersion} --label com.docker.compose.project=${projectName} --env WAZUH_AGENT_VERSION=${wazuhStack} -d ubuntu:20.04 bash -c '`
  );
  log.infoPlain('  apt update -y');
  log.infoPlain('  apt install -y curl lsb-release');
  log.infoPlain('  curl -so \\wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb \\');
  log.infoPlain(
    '    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_\\${WAZUH_AGENT_VERSION}-1_amd64.deb \\'
  );
  log.infoPlain(
    "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb"
  );
  log.infoPlain('');
  log.infoPlain('  /etc/init.d/wazuh-agent start');
  log.infoPlain('  tail -f /var/ossec/logs/ossec.log');
  log.infoPlain(`'`);
  log.infoPlain('');
}
