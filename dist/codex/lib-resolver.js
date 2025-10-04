'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.resolveFromPackageRoot = resolveFromPackageRoot;
exports.resolveLibPath = resolveLibPath;
exports.importLibModule = importLibModule;
exports.requireLibModule = requireLibModule;
exports.importFromPackageRoot = importFromPackageRoot;
const node_fs_1 = require('node:fs');
const path = __importStar(require('node:path'));
const node_url_1 = require('node:url');
const node_module_1 = require('node:module');
const requireFromMeta = (0, node_module_1.createRequire)(__filename);
let cachedPackageRoot;
function getPackageRoot() {
  if (cachedPackageRoot) {
    return cachedPackageRoot;
  }
  let current = __dirname;
  while (true) {
    if ((0, node_fs_1.existsSync)(path.join(current, 'package.json'))) {
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
function resolveFromPackageRoot(...segments) {
  return path.resolve(getPackageRoot(), ...segments);
}
// Search paths in order of preference:
// 1. Production build output (dist/mcp/lib) - bundled distribution
// 2. Production bundled tools (dist/mcp/tools) - MCP tool modules
// 3. Development build output (.dev/dist/mcp/lib) - compiled TypeScript
// 4. Development tools (.dev/tools) - MCP tool modules source
// 5. Development lib source (.dev/lib) - original source files
// 6. Fallback to package lib folder (lib) - see resolveLibPath below
const LIB_SEARCH_PATHS = [
  ['dist', 'mcp', 'lib'],
  ['dist', 'mcp', 'tools'],
  ['.dev', 'dist', 'mcp', 'lib'],
  ['.dev', 'tools'],
  ['.dev', 'lib'],
];
function resolveLibPath(moduleName) {
  for (const segments of LIB_SEARCH_PATHS) {
    const candidatePath = resolveFromPackageRoot(...segments, moduleName);
    if ((0, node_fs_1.existsSync)(candidatePath)) {
      return candidatePath;
    }
  }
  return resolveFromPackageRoot('lib', moduleName);
}
async function importLibModule(moduleName) {
  const modulePath = resolveLibPath(moduleName);
  return import((0, node_url_1.pathToFileURL)(modulePath).href);
}
function requireLibModule(moduleName) {
  const modulePath = resolveLibPath(moduleName);
  return requireFromMeta(modulePath);
}
async function importFromPackageRoot(...segments) {
  const modulePath = resolveFromPackageRoot(...segments);
  return import((0, node_url_1.pathToFileURL)(modulePath).href);
}
