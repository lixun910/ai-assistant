const esbuild = require('esbuild');

const tailwindPlugin = require('esbuild-plugin-tailwindcss').default;

const watch = false;

esbuild.build({
  entryPoints: ['src/index.ts', 'src/index.css'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  sourcemap: true,
  loader: { '.css': 'css' },
  outdir: 'dist',
  splitting: false,
  metafile: true,
  assetNames: '[name]',
  plugins: [
    tailwindPlugin({
      config: './tailwind.config.js',
    }),
  ],
  external: [
    'react',
    'react-dom',
  ],
}).then(() => {
  if (watch) {
    console.log('Watching for changes...');
  }
});
