/**
 * vitest.config.ts
 * ----------------
 *
 * One config for all four wrappers. Uses `jsdom` so there is a DOM to
 * mount components into; each suite mocks its core at the module
 * boundary (Web Audio + Canvas + Fetch are not in jsdom), except the
 * sounds `integration` suite, which drives the real runtime with a fake
 * engine, and the DOM-free `@arraypress/waveform-sounds/render` entry,
 * which is always the real one. Suites live in `test/<name>/`.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'jsdom',
		globals: false,
	},
});
