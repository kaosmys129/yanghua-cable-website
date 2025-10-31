import { mergeConfig, type UserConfig, type PluginOption } from 'vite';
import fs from 'node:fs';
import { createRequire } from 'node:module';

// Inject PrismJS by inlining local node_modules files to avoid external network
// dependencies and guarantee the `Prism` global is available BEFORE Strapi admin
// bundles that reference it.
export default (config: UserConfig) => {
  const require = createRequire(import.meta.url);
  const read = (mod: string) => fs.readFileSync(require.resolve(mod), 'utf-8');

  const core = read('prismjs/components/prism-core.min.js');
  const markup = read('prismjs/components/prism-markup.min.js');
  const keepMarkup = read('prismjs/plugins/keep-markup/prism-keep-markup.min.js');

  const injectPrismPlugin: PluginOption = {
    name: 'inject-prism-global-inline',
    transformIndexHtml() {
      return [
        { tag: 'script', children: core, injectTo: 'head' },
        { tag: 'script', children: markup, injectTo: 'head' },
        { tag: 'script', children: keepMarkup, injectTo: 'head' },
      ];
    },
  };

  return mergeConfig(config, {
    plugins: [injectPrismPlugin],
    resolve: {
      alias: { '@': '/src' },
    },
  });
};