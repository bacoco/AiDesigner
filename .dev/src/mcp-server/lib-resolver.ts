import { existsSync } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const requireFromMeta = createRequire(__filename);

let cachedPackageRoot: string | undefined;

function getPackageRoot(): string {
  if (cachedPackageRoot) {
    return cachedPackageRoot;
  }

  let current = __dirname;
  while (true) {
    if (existsSync(path.join(current, "package.json"))) {
      cachedPackageRoot = current;
      return cachedPackageRoot;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Unable to locate package root from ${__dirname}`);
    }

    current = parent;
  }
}

export function resolveFromPackageRoot(...segments: string[]): string {
  return path.resolve(getPackageRoot(), ...segments);
}

const LIB_SEARCH_PATHS: string[][] = [
  ["dist", "mcp", "lib"],
  [".dev", "dist", "mcp", "lib"],
  [".dev", "lib"],
];

export function resolveLibPath(moduleName: string): string {
  for (const segments of LIB_SEARCH_PATHS) {
    const candidatePath = resolveFromPackageRoot(...segments, moduleName);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return resolveFromPackageRoot("lib", moduleName);
}

export async function importLibModule<TModule = unknown>(moduleName: string): Promise<TModule> {
  const modulePath = resolveLibPath(moduleName);
  return import(pathToFileURL(modulePath).href) as Promise<TModule>;
}

export function requireLibModule<TModule = unknown>(moduleName: string): TModule {
  const modulePath = resolveLibPath(moduleName);
  return requireFromMeta(modulePath) as TModule;
}

export async function importFromPackageRoot<TModule = unknown>(
  ...segments: string[]
): Promise<TModule> {
  const modulePath = resolveFromPackageRoot(...segments);
  return import(pathToFileURL(modulePath).href) as Promise<TModule>;
}
