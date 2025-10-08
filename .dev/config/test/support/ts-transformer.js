const crypto = require('node:crypto');
const ts = require('typescript');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  esModuleInterop: true,
};

module.exports = {
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions,
    });

    return { code: outputText };
  },
  getCacheKey(sourceText, sourcePath) {
    return crypto
      .createHash('md5')
      .update(sourceText + '\0' + sourcePath + '\0' + JSON.stringify(compilerOptions))
      .digest('hex');
  },
};
