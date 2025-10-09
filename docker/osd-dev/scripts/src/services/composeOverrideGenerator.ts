import { existsSync, unlinkSync } from 'fs';
import { GenerateOverrideOptions, EnvironmentPaths } from '../types/config';
import {
  DASHBOARD_ENTRYPOINT_PATH,
  OVERRIDE_COMPOSE_FILE,
  PROFILES,
  SECURITY_PLUGIN_REPO_NAME,
  WAZUH_DOWNLOADS_TMPFS_PATH,
  WAZUH_DOWNLOADS_TMPFS_OPTS,
} from '../constants/app';
import { writeFile } from '../utils/io';
import { toRepositoryEnvVar } from '../utils/envUtils';
import { ComposeOverrideError } from '../errors';
import { msgRepositoryPathNotResolved } from '../constants/messages';
import type { Logger } from '../utils/logger';

export function generateOverrideFile(
  options: GenerateOverrideOptions,
  _envPaths: EnvironmentPaths,
  log: Logger,
): string | null {
  const {
    externalRepositories,
    repositoryEnvMap,
    useDashboardFromSource,
    includeSecurityPlugin,
  } = options;
  const shouldGenerate =
    useDashboardFromSource || externalRepositories.length > 0;

  if (!shouldGenerate) {
    if (existsSync(OVERRIDE_COMPOSE_FILE)) {
      unlinkSync(OVERRIDE_COMPOSE_FILE);
      log.info('Removed previous compose override file.');
    } else {
      log.info('No dynamic compose override required.');
    }
    return null;
  }

  const messages: string[] = [];
  if (useDashboardFromSource) messages.push('dashboard sources mode');
  if (externalRepositories.length > 0)
    messages.push(`external repositories: ${externalRepositories.join(', ')}`);
  log.info(`Generating compose override for ${messages.join(' and ')}`);

  let content = 'services:\n';

  if (useDashboardFromSource) {
    content += '  dashboard-src-installer:\n';
    content += '    volumes:\n';
    content += "      - '${SRC_DASHBOARD}:/home/node/kbn'\n";
  }

  content += '  osd:\n';
  const volumeEntries: string[] = [];

  if (useDashboardFromSource) {
    content += '    depends_on:\n';
    content += '      dashboard-src-installer:\n';
    content += '        condition: service_completed_successfully\n';
    content += '    image: node:${NODE_VERSION}\n';
    content += '    profiles:\n';
    content += `      - '${PROFILES.DASHBOARD_SRC}'\n`;
    content += "    entrypoint: ['/bin/bash', '/entrypoint.sh']\n";
    content += '    working_dir: /home/node/kbn\n';
    content += '    tmpfs:\n';
    content += `      - ${WAZUH_DOWNLOADS_TMPFS_PATH}:${WAZUH_DOWNLOADS_TMPFS_OPTS}\n`;

    volumeEntries.push("      - '${SRC_DASHBOARD}:/home/node/kbn'");
    if (includeSecurityPlugin) {
      volumeEntries.push(
        `      - '\${SRC_SECURITY_PLUGIN}:/home/node/kbn/plugins/${SECURITY_PLUGIN_REPO_NAME}'`,
      );
    }
    volumeEntries.push(
      `      - ${DASHBOARD_ENTRYPOINT_PATH}:/entrypoint.sh:ro`,
    );
  }

  for (const repo of externalRepositories) {
    volumeEntries.push(`      - '${repo}:/home/node/kbn/plugins/${repo}'`);
  }

  if (volumeEntries.length > 0) {
    content += '    volumes:\n';
    content += `${volumeEntries.join('\n')}\n`;
  }

  if (externalRepositories.length > 0) {
    content += 'volumes:\n';
    for (const repo of externalRepositories) {
      const repoPath = repositoryEnvMap.get(toRepositoryEnvVar(repo));
      if (!repoPath) {
        throw new ComposeOverrideError(msgRepositoryPathNotResolved(repo));
      }
      content += `  ${repo}:\n`;
      content += `    driver: local\n`;
      content += `    driver_opts:\n`;
      content += `      type: none\n`;
      content += `      o: bind\n`;
      content += `      device: ${repoPath}\n`;
    }
  }

  writeFile(OVERRIDE_COMPOSE_FILE, content);
  return OVERRIDE_COMPOSE_FILE;
}
