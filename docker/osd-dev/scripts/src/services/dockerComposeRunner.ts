import { existsSync } from 'fs';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import { ValidationError } from '../errors';
import type { Logger } from '../utils/logger';
import type { ProcessRunner } from '../types/deps';
import chalk from 'chalk';
import { ACTIONS, SERVICE_NAMES } from '../constants/app';

export function runDockerCompose(
  config: ScriptConfig,
  profiles: string[],
  composeFiles: string[],
  envPaths: EnvironmentPaths,
  log: Logger,
  runner: ProcessRunner,
): Promise<number> {
  const composeArgs = ['compose'];

  for (const profile of profiles) {
    composeArgs.push('--profile', profile);
  }

  for (const file of composeFiles) {
    composeArgs.push('-f', file);
  }

  switch (config.action) {
    case ACTIONS.UP:
      try {
        if (existsSync(envPaths.createNetworksScriptPath)) {
          runner.execSync(`/bin/bash ${envPaths.createNetworksScriptPath}`, {
            stdio: 'inherit',
          });
        }
      } catch (error) {
        log.error('Failed to create docker networks');
      }
      composeArgs.push('up', '-Vd');
      break;
    case ACTIONS.START:
      composeArgs.push('start');
      break;
    case ACTIONS.DOWN:
      composeArgs.push('down', '-v', '--remove-orphans');
      break;
    case ACTIONS.STOP:
      composeArgs.push('-p', process.env.COMPOSE_PROJECT_NAME || '', 'stop');
      break;
    case ACTIONS.MANAGER_LOCAL_UP:
      composeArgs.push(
        '-p',
        process.env.COMPOSE_PROJECT_NAME || '',
        'up',
        '-d',
        SERVICE_NAMES.WAZUH_MANAGER_LOCAL,
      );
      break;
    default:
      throw new ValidationError(
        `Action must be ${Object.values(ACTIONS).join(' | ')}`,
      );
  }

  log.info(`Running: docker ${composeArgs.join(' ')}`);
  return new Promise(resolve => {
    const child = runner.spawn('docker', composeArgs, { stdio: 'inherit' });
    child.on('close', code => resolve(code ?? 1));
  });
}

export function printAgentEnrollmentHint(log: Logger): void {
  const projectName = process.env.COMPOSE_PROJECT_NAME || '';
  const osVersion = process.env.OS_VERSION || '';
  const wazuhStack = process.env.WAZUH_STACK || '';

  if (!projectName || !osVersion) return;

  log.infoPlain('');
  log.infoPlain(chalk.yellow.bold('************* WARNING *************'));
  log.infoPlain(
    chalk.yellow(
      'The agent version must be a published one. This uses only released versions.',
    ),
  );
  log.infoPlain(
    chalk.yellow(
      'If you need to change the version, edit the command as you see fit.',
    ),
  );
  log.infoPlain(chalk.yellow.bold('***********************************'));
  log.infoPlain('');
  log.infoPlain(chalk.cyan.bold('(Optional) Enroll an agent (Ubuntu 20.04):'));
  log.infoPlain('');
  log.infoPlain(`${chalk.green('docker run')} \\`);
  log.infoPlain(
    `  ${chalk.magentaBright('--name')} ${projectName}-agent-$(date +%s) \\`,
  );
  log.infoPlain(`  ${chalk.magentaBright('--network')} os-dev-${osVersion} \\`);
  log.infoPlain(
    `  ${chalk.magentaBright('--label')} ${chalk.underline(
      'com.docker.compose.project',
    )}=${projectName} \\`,
  );
  log.infoPlain(
    `  ${chalk.magentaBright('--env')} ${chalk.underline(
      'WAZUH_AGENT_VERSION',
    )}=${chalk.yellow(wazuhStack)} \\`,
  );
  log.infoPlain(`  ${chalk.magentaBright('-d')} ubuntu:20.04 bash -c '`);
  log.infoPlain(chalk.gray('  apt update -y'));
  log.infoPlain(chalk.gray('  apt install -y curl lsb-release'));
  log.infoPlain(
    chalk.gray('  curl -so \\wazuh-agent-${WAZUH_AGENT_VERSION}.deb \\'),
  );
  log.infoPlain(
    chalk.gray(
      '    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${WAZUH_AGENT_VERSION}-1_amd64.deb \\',
    ),
  );
  log.infoPlain(
    chalk.gray(
      "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-${WAZUH_AGENT_VERSION}.deb",
    ),
  );
  log.infoPlain('');
  log.infoPlain(chalk.gray('  /etc/init.d/wazuh-agent start'));
  log.infoPlain(chalk.gray('  tail -f /var/ossec/logs/ossec.log'));
  log.infoPlain(`'`);
  log.infoPlain('');
}
