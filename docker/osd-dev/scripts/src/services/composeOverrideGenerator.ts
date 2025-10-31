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
    useIndexerFromPackage,
  } = options;
  const shouldGenerate =
    useDashboardFromSource ||
    externalRepositories.length > 0 ||
    useIndexerFromPackage;

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
  if (useIndexerFromPackage) {
    messages.push('indexer from package');
  }
  log.info(`Generating compose override for ${messages.join(' and ')}`);

  let content = 'services:\n';

  if (useDashboardFromSource) {
    content += '  dashboard-src-installer:\n';
    content += '    volumes:\n';
    content += "      - '${SRC_DASHBOARD}:/home/node/kbn'\n";
  }

  const volumeEntries: string[] = [];

  content += '  osd:\n';

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

  if (useIndexerFromPackage) {
    // TODO: review if it is possible removing the merged volumes that are not used
    content += `
  os1:
    depends_on:
      idpsetup:
        condition: service_completed_successfully
        required: false
      generator:
        condition: service_healthy
    build:
      context: ./indexer
    image: wazuh-indexer-pkg:\${IMAGE_INDEXER_PACKAGE_TAG:-latest}
    profiles:
      - ${PROFILES.SERVER}
      - ${PROFILES.SAML}
      - ${PROFILES.STANDARD}
      - ${PROFILES.DASHBOARD_SRC}
      - ${PROFILES.SERVER_LOCAL} # server profile to use the local packages with agents deb and rpm
      - ${PROFILES.SERVER_LOCAL_RPM} # server profile to use the local packages with agent rpm
      - ${PROFILES.SERVER_LOCAL_DEB} # server profile to use the local packages with agent deb
      - ${PROFILES.SERVER_LOCAL_WITHOUT} # server profile to use the local packages without agent
    environment:
      - OPENSEARCH_PATH_CONF=/etc/wazuh-indexer
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536 # maximum number of open files for the OpenSearch user, set to at least 65536 on modern systems
        hard: 65536
    volumes:
      - wi_certs:/etc/wazuh-indexer/certs/
      - ./config/\${OSD_MAJOR}/os/opensearch.yml:/etc/wazuh-indexer/opensearch.yml
      - os_logs:/var/log/os1
      - os_data:/var/lib/os1
    ports:
      - 9200:9200
      - 9300:9300
    networks:
      - os-dev
      - mon
    entrypoint: ['bash', '/entrypoint.sh']
    healthcheck:
      test: [
          'CMD-SHELL',
          "curl -v --cacert /etc/wazuh-indexer/certs/ca.pem https://os1:9200 2>&1 | grep -q '401'",
        ]
      interval: 1s
      timeout: 5s
      retries: 120
`;
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
