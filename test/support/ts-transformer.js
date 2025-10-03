const crypto = require('node:crypto');
// eslint-disable-next-line n/no-unpublished-require -- transformer runs in tests and depends on dev tooling
const ts = require('typescript');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.Node16,
  esModuleInterop: true,
  resolveJsonModule: true,
  sourceMap: true,
};

module.exports = {
  process(src, filename) {
    const transpiled = ts.transpileModule(src, {
      compilerOptions,
      fileName: filename,
    });

    const code = transpiled.outputText.replaceAll('import.meta.url', '__filename');

    return {
      code,
      map: transpiled.sourceMapText ?? null,
    };
  },
  getCacheKey(sourceText, sourcePath, transformOptions) {
    return crypto
      .createHash('sha1')
      .update(sourceText)
      .update('\0', 'utf8')
      .update(sourcePath)
      .update('\0', 'utf8')
      .update(JSON.stringify(transformOptions))
      .update('\0', 'utf8')
      .digest('hex');
  },
};
