/**
 * tsdown.config.ts
 * ----------------
 *
 * Build configuration for `@arraypress/waveform-vue`.
 *
 * One entry per sub-path, each built on its own so no chunk is shared:
 *
 *   dist/<name>/index.js    (ESM)  — `import '@arraypress/waveform-vue/<name>'`
 *   dist/<name>/index.cjs   (CJS)  — `require(...)`
 *   dist/<name>/index.d.ts  / index.d.cts — declarations for each
 *
 * Every wrapper `import()`s its core lazily, and bundlers resolve every
 * dynamic import at build time, so a sub-path must never reach another
 * sub-path's core. Separate builds make that structural: each output can
 * only contain its own `import()`.
 *
 * `vue` and the four cores (and their sub-path entries) are externals —
 * they resolve to the consumer's installed copies, never bundled in.
 * Matches the 1.x tsup builds: ES2022, sourcemaps, not minified, and
 * the comment policy of tsup's esbuild (JSDoc dropped, legal and
 * `@__PURE__` annotation comments kept).
 *
 * Declarations: with TypeScript 7.0 the dts plugin selects its `tsgo`
 * generator, which shells out to the `tsgo` CLI. The plugin marks that
 * backend deprecated in favour of TypeScript 7.1's API (it warns on every
 * build); it still produces correct output, checked by `npm run test:pack`
 * and the type-equivalence check. Move to 7.1 once it is `latest`.
 */
import { defineConfig, type UserConfig } from 'tsdown';

const NAMES = ['player', 'bar', 'playlist', 'sounds'] as const;

const shared: UserConfig = {
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	target: 'es2022',
	minify: false,
	platform: 'neutral',
	/* `.js` for ESM and `.cjs` for CJS, as tsup emitted (package is `type: module`). */
	fixedExtension: false,
	outputOptions: {
		/* Each entry has a named export and `default`; CJS gets both as
		 * `exports.*` properties, the shape tsup emitted. `named` states that
		 * (it is what `auto` picks) and silences rolldown's MIXED_EXPORTS. */
		exports: 'named',
		comments: { legal: true, annotation: true, jsdoc: false },
		/* The sources are ES modules, so strict mode is their semantics; the
		 * CJS build must say so, as tsup's did (rolldown's `auto` omits it). */
		strict: true,
	},
	deps: {
		neverBundle: [/^vue(\/|$)/, /^@arraypress\/waveform-(player|bar|playlist|sounds)(\/|$)/],
	},
};

export default defineConfig(
	NAMES.map((name, i) => ({
		...shared,
		entry: { index: `src/${name}/index.ts` },
		outDir: `dist/${name}`,
		/* Clean once, before the first build, not between them. */
		clean: i === 0 ? ['dist'] : false,
	}))
);
