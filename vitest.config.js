import path from 'node:path';
import {createRequire} from 'node:module';
import {defineConfig} from 'vitest/config';

const require = createRequire(import.meta.url);
const babelCliDirectory = path.dirname(
  require.resolve('@babel/cli/package.json'),
);
const babel = require(path.resolve(babelCliDirectory, '../core'));
const presetReact = require.resolve('@babel/preset-react');

const transformJsxInJavaScript = {
  name: 'transform-jsx-in-javascript',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) return null;

    const result = await babel.transformAsync(code, {
      filename: id,
      presets: [presetReact],
      sourceMaps: true,
    });

    return {code: result.code, map: result.map};
  },
};

export default defineConfig({
  plugins: [transformJsxInJavaScript],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
