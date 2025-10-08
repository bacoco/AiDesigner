const crypto = require('node:crypto');
const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });

    return { code: outputText };
  },
  getCacheKey(sourceText, sourcePath) {
    return crypto
      .createHash('md5')
      .update(sourceText + sourcePath)
      .digest('hex');
  },
};
