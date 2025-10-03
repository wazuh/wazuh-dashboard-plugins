import { existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { EnvironmentPaths, ScriptConfig } from '../types/config';

export function runDockerCompose(
  config: ScriptConfig,
  profiles: string[],
  composeFiles: string[],
  envPaths: EnvironmentPaths
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
          execSync(`/bin/bash ${envPaths.createNetworksScriptPath}`, { stdio: 'inherit' });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[ERROR] Failed to create docker networks');
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
      throw new Error('Action must be up | down | stop | start | manager-local-up');
  }

  // eslint-disable-next-line no-console
  console.log(`[INFO] Running: docker ${composeArgs.join(' ')}`);
  return new Promise((resolve) => {
    const child = spawn('docker', composeArgs, { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export function printAgentEnrollmentHint(config: ScriptConfig): void {
  if (config.action !== 'up' || config.mode !== 'server') return;

  const projectName = process.env.COMPOSE_PROJECT_NAME || '';
  const osVersion = process.env.OS_VERSION || '';
  const wazuhStack = process.env.WAZUH_STACK || '';

  // eslint-disable-next-line no-console
  console.log();
  console.log('**************WARNING**************');
  console.log('The agent version must be a published one. This uses only released versions.');
  console.log('If you need to change de version, edit the command as you see fit.');
  console.log('***********************************');
  console.log('1. (Optional) Enroll an agent (Ubuntu 20.04):');
  console.log(
    `docker run --name ${projectName}-agent-$(date +%s) --network os-dev-${osVersion} --label com.docker.compose.project=${projectName} --env WAZUH_AGENT_VERSION=${wazuhStack} -d ubuntu:20.04 bash -c '`
  );
  console.log('  apt update -y');
  console.log('  apt install -y curl lsb-release');
  console.log('  curl -so \\wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb \\');
  console.log(
    '    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_\\${WAZUH_AGENT_VERSION}-1_amd64.deb \\'
  );
  console.log(
    "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb"
  );
  console.log();
  console.log('  /etc/init.d/wazuh-agent start');
  console.log('  tail -f /var/ossec/logs/ossec.log');
  console.log(`'`);
  console.log();
}

