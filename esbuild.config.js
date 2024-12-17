const esbuild = require('esbuild');
const fs = require('fs');

const tailwindPlugin = require('esbuild-plugin-tailwindcss').default;

const watch = false;

esbuild
  .build({
    entryPoints: ['src/index.ts', 'src/index.css'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    loader: { '.css': 'css' },
    outdir: 'dist',
    splitting: false,
    metafile: true,
    assetNames: '[name]',
    minify: true,
    drop: ['console', 'debugger'],
    plugins: [
      tailwindPlugin({
        config: './tailwind.config.js',
      }),
    ],
    // make react and react-dom external, so that the bundle is smaller
    external: [
      'react',
      'react-dom',
      'echarts',
      '@duckdb/duckdb-wasm',
      'apache-arrow',
      'geoda-wasm',
    ],
  })
  .then((result) => {
    if (watch) {
      console.log('Watching for changes...');
    }
    if (result.metafile) {
      // use https://bundle-buddy.com/esbuild to analyses
      fs.writeFileSync('./dist/metafile.json', JSON.stringify(result.metafile));
    }
  });
