import { mergeConfig, type UserConfig, Plugin } from 'vite';

// Inject PrismJS core import before any vendor chunks evaluate.
// This ensures global `Prism` is defined before prism components register languages.
export default (config: UserConfig) => {
  const injectPrismPlugin: Plugin = {
    name: 'inject-prism-core',
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        // Prepend a module script that imports Prism core
        const prismImport = '<script type="module">import \"prismjs\";</script>';
        // Insert right after opening <head> for earliest execution
        return html.replace('<head>', `<head>\n  ${prismImport}`);
      },
    },
  };

  return mergeConfig(config, {
    plugins: [injectPrismPlugin],
    optimizeDeps: {
      include: ['prismjs'],
    },
  });
};
