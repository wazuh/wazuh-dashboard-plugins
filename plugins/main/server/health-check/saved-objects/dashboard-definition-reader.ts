import fs from 'fs';
import path from 'path';
import type {
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import { DEFAULT_DEFINITIONS_FOLDER, DEFAULT_EXTENSION } from "./constants";

export interface DashboardDefinitionFromFile {
  filePath: string;
  relativeFilePath: string;
  dashboard: SavedObjectDashboard;
  visualizations: SavedObjectVisualization[];
}

interface DashboardDefinitionReaderOptions {
  folderPath?: string;
  extension?: string;
}

function isDefinitionFile(filePath: string, extension: string) {
  return path.extname(filePath).toLowerCase() === extension.toLowerCase();
}

function collectDefinitionFiles(folderPath: string,
  extension: string,
  accumulator: string[] = []) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      collectDefinitionFiles(absolutePath, extension, accumulator);
      continue;
    }

    if (entry.isFile() && isDefinitionFile(absolutePath, extension)) {
      accumulator.push(absolutePath);
    }
  }

  return accumulator;
}

type DashboardDefinitionSavedObject =
  | SavedObjectVisualization
  | SavedObjectDashboard;

function isSupportedType(type: DashboardDefinitionSavedObject['type'] | string): type is DashboardDefinitionSavedObject['type'] {
  return type === 'visualization' || type === 'dashboard';
}

function parseNdjsonLine(line: string,
  lineNumber: number,
  filePath: string): DashboardDefinitionSavedObject | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  try {
    const parsed = JSON.parse(trimmedLine);
    const type = parsed?.type as string | undefined;

    if (!isSupportedType(type ?? '')) {
      throw new Error(`Unsupported type "${type}"`);
    }

    if (!parsed?.id || !parsed?.attributes) {
      throw new Error('Missing id or attributes');
    }

    return parsed as DashboardDefinitionSavedObject;
  } catch (error) {
    const reason = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(
      `Invalid JSON in ${filePath} at line ${lineNumber}: ${reason}`
    );
  }
}

function parseDefinitionFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  return rawContent
    .split(/\r?\n/)
    .map((line, index) => parseNdjsonLine(line, index + 1, filePath))
    .filter(Boolean) as DashboardDefinitionSavedObject[];
}

function toDashboardDefinitionFromFile(filePath: string,
  rawObjects: DashboardDefinitionSavedObject[]): DashboardDefinitionFromFile {
  const visualizations = rawObjects.filter(
    (obj): obj is SavedObjectVisualization => obj.type === 'visualization'
  );

  const dashboards = rawObjects.filter(
    (obj): obj is SavedObjectDashboard => obj.type === 'dashboard'
  );

  if (dashboards.length === 0) {
    throw new Error(
      `No dashboard object found inside "${path.basename(filePath)}"`
    );
  }

  if (dashboards.length > 1) {
    throw new Error(
      `Expected a single dashboard object in "${path.basename(
        filePath
      )}", found ${dashboards.length}`
    );
  }

  return {
    filePath,
    relativeFilePath: path.relative(process.cwd(), filePath),
    dashboard: dashboards[0],
    visualizations,
  };
}

export const readDashboardDefinitionFiles = (
  options: DashboardDefinitionReaderOptions = {},
): DashboardDefinitionFromFile[] => {
  const folderPath = options.folderPath ?? DEFAULT_DEFINITIONS_FOLDER;
  const extension = options.extension ?? DEFAULT_EXTENSION;

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new Error(
      `Dashboard definitions folder not found: ${path.resolve(folderPath)}`,
    );
  }

  const definitionFiles = collectDefinitionFiles(folderPath, extension).sort();

  return definitionFiles.map(filePath =>
    toDashboardDefinitionFromFile(filePath, parseDefinitionFile(filePath)),
  );
};
