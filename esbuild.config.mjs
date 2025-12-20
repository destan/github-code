import * as esbuild from 'esbuild';

// Plugin to import CSS as string
const cssTextPlugin = {
  name: 'css-text',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const fs = await import('fs/promises');
      const css = await fs.readFile(args.path, 'utf8');
      return {
        contents: `export default ${JSON.stringify(css)}`,
        loader: 'js',
      };
    });
  },
};

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'es2023',
  format: 'esm',
  plugins: [cssTextPlugin],
};

// Development build
await esbuild.build({
  ...baseConfig,
  outfile: 'dist/github-code.js',
  sourcemap: true,
});

// Production build
await esbuild.build({
  ...baseConfig,
  outfile: 'dist/github-code.min.js',
  minify: true,
  sourcemap: true,
});

console.log('✓ Build complete');
