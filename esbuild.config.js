const esbuild = require('esbuild');

const tailwindPlugin = require('esbuild-plugin-tailwindcss').default;

const watch = false;

esbuild.build({
  entryPoints: ['src/index.ts', 'src/index.css'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // outfile: 'dist/index.js',
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
}).then(() => {
  if (watch) {
    // ... watch code ...
  }
});
