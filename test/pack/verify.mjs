/**
 * End-to-end verification of the published package's sub-paths.
 *
 * The vitest suites import `src/`, so they stay green even when the
 * *shipped* artifacts are wrong — a sub-path missing from `exports`, a
 * declaration file left out of `files`, a build that lets one sub-path
 * reach another's core. All of that is invisible until someone installs
 * the package for real, so this packs the tarball and installs it into
 * two throwaway consumers:
 *
 *   A. vue + all four cores. Every sub-path resolves under plain Node as
 *      ESM *and* CJS with exactly its expected names; the bare package
 *      name does not resolve (there is no root entry); TypeScript
 *      (NodeNext and Bundler) finds every sub-path's declarations.
 *   B. vue + ONLY `@arraypress/waveform-player`. `./player` imports in
 *      Node and bundles with rolldown; `./bar` does NOT bundle, because
 *      its core is missing — the reason the package has one sub-path per
 *      core instead of one combined entry.
 *
 * Nothing here reads the repo's `src/`; every assertion runs against
 * files that came out of the tarball.
 *
 *   npm run test:pack
 *
 * Exit code is 1 if any check fails.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const PKG_ROOT = path.resolve(import.meta.dirname, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
const { rolldown } = await import(createRequire(path.join(PKG_ROOT, 'package.json')).resolve('rolldown'));
const TSC = path.join(PKG_ROOT, 'node_modules', '.bin', 'tsc');

/** The runtime names each sub-path must export (same as the 1.x packages). */
const EXPECTED = {
	player: ['WaveformPlayer', 'default'],
	bar: ['WaveformBar', 'WaveformBarTrigger'],
	playlist: ['WaveformPlaylist', 'default'],
	sounds: ['WaveformSounds', 'default'],
};
/** One exported type per sub-path, for the TypeScript resolution check. */
const A_TYPE = {
	player: 'WaveformPlayerProps',
	bar: 'WaveformBarConfig',
	playlist: 'WaveformPlaylistProps',
	sounds: 'WaveformSoundsProps',
};

const results = [];
const check = (name, ok, detail = '') => {
	results.push({ name, ok });
	console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok || !detail ? '' : `\n      ${detail}`}`);
};
const run = (cmd, args, cwd) =>
	execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
/** Run, and return [ok, stdout-or-stderr] instead of throwing. */
const attempt = (cmd, args, cwd) => {
	try {
		return [true, run(cmd, args, cwd)];
	} catch (err) {
		return [false, `${err.stdout ?? ''}${err.stderr ?? ''}`.trim()];
	}
};
/** `^x.y.z || ^a.b.c` → the newest range, as an install spec. */
const peer = (name) => `${name}@${pkg.peerDependencies[name]}`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'waveform-vue-pack-'));

/** A consumer project with the tarball and the given packages installed. */
function consumer(dir, tarball, deps) {
	const root = path.join(tmp, dir);
	fs.mkdirSync(root);
	fs.writeFileSync(
		path.join(root, 'package.json'),
		JSON.stringify({ name: `consumer-${dir}`, private: true, type: 'module' })
	);
	run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', tarball, ...deps], root);
	return root;
}

/**
 * Bundle `source` from inside `cwd` with rolldown; returns [ok, message].
 * An import rolldown cannot resolve only warns there (it is left external),
 * but it fails the build in Vite and webpack, so it counts as a failure here.
 */
async function bundle(cwd, source) {
	const entry = path.join(cwd, `entry-${Math.random().toString(36).slice(2)}.js`);
	fs.writeFileSync(entry, source);
	const unresolved = [];
	try {
		const build = await rolldown({
			input: entry,
			cwd,
			platform: 'browser',
			onLog: (_level, log) => {
				if (log.code === 'UNRESOLVED_IMPORT') unresolved.push(log.message.split('\n')[0]);
			},
		});
		const { output } = await build.generate({ format: 'esm' });
		await build.close();
		if (unresolved.length) return [false, unresolved.join('; ')];
		return [true, `${output.length} chunk(s)`];
	} catch (err) {
		return [false, String(err.message ?? err).split('\n')[0]];
	}
}

try {
	// ---- Pack ------------------------------------------------------------------
	console.log('\nPacking…');
	// npm <= 11 prints an array; npm 12 an object keyed by package name.
	const packJson = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', tmp], PKG_ROOT));
	const packed = Array.isArray(packJson) ? packJson : Object.values(packJson);
	const tarball = path.join(tmp, packed[0].filename);
	const shipped = new Set(packed[0].files.map((f) => f.path));

	const targets = new Set();
	const collect = (v) => {
		if (typeof v === 'string') targets.add(v.replace(/^\.\//, ''));
		else for (const x of Object.values(v)) collect(x);
	};
	collect(pkg.exports);
	collect(pkg.typesVersions);

	console.log(`\nTarball (${packed[0].filename}, ${packed[0].files.length} files)`);
	for (const t of [...targets].sort()) check(`ships ${t}`, shipped.has(t));
	check(
		'ships nothing outside dist/, README.md, LICENSE, package.json',
		[...shipped].every((f) => /^(dist\/|README\.md$|LICENSE$|package\.json$)/.test(f)),
		[...shipped].filter((f) => !/^(dist\/|README\.md$|LICENSE$|package\.json$)/.test(f)).join(', ')
	);

	// ---- A. Every core installed ----------------------------------------------
	console.log('\nConsumer A: vue + all four cores');
	const a = consumer('all', tarball, [
		peer('vue'),
		peer('@arraypress/waveform-player'),
		peer('@arraypress/waveform-bar'),
		peer('@arraypress/waveform-playlist'),
		// The newest range the peer admits.
		`@arraypress/waveform-sounds@${pkg.peerDependencies['@arraypress/waveform-sounds'].split('||').pop().trim()}`,
	]);
	for (const [name, names] of Object.entries(EXPECTED)) {
		const spec = `${pkg.name}/${name}`;
		const esm = attempt('node', ['--input-type=module', '-e',
			`const m = await import(${JSON.stringify(spec)}); console.log(JSON.stringify(Object.keys(m).sort()));`], a);
		check(`ESM import('${spec}') → ${names.join(', ')}`, esm[0] && esm[1].trim() === JSON.stringify(names), esm[1]);
		const cjs = attempt('node', ['--input-type=commonjs', '-e',
			`console.log(JSON.stringify(Object.keys(require(${JSON.stringify(spec)})).sort()))`], a);
		check(`CJS require('${spec}') → ${names.join(', ')}`, cjs[0] && cjs[1].trim() === JSON.stringify(names), cjs[1]);
	}
	const root = attempt('node', ['--input-type=module', '-e', `await import(${JSON.stringify(pkg.name)})`], a);
	check(`no root entry: import('${pkg.name}') fails with ERR_PACKAGE_PATH_NOT_EXPORTED`,
		!root[0] && root[1].includes('ERR_PACKAGE_PATH_NOT_EXPORTED'), root[1]);

	// TypeScript: every sub-path's declarations resolve, for ESM and CJS consumers.
	const imports = Object.entries(A_TYPE)
		.map(([name, type]) => `import type { ${type} } from '${pkg.name}/${name}';\nexport type T_${name} = ${type};`)
		.join('\n');
	fs.writeFileSync(path.join(a, 'esm.mts'), imports);
	fs.writeFileSync(path.join(a, 'cjs.cts'), imports);
	fs.writeFileSync(path.join(a, 'bundler.ts'), imports);
	const base = ['--noEmit', '--strict', '--skipLibCheck', 'false', '--lib', 'ES2022,DOM'];
	const nodenext = attempt(TSC, [...base, '--module', 'nodenext', '--moduleResolution', 'nodenext', 'esm.mts', 'cjs.cts'], a);
	check('tsc NodeNext (.mts + .cts) resolves every sub-path', nodenext[0], nodenext[1]);
	const bundler = attempt(TSC, [...base, '--module', 'esnext', '--moduleResolution', 'bundler', 'bundler.ts'], a);
	check('tsc Bundler resolves every sub-path', bundler[0], bundler[1]);

	// ---- B. Only the player core ----------------------------------------------
	console.log('\nConsumer B: vue + @arraypress/waveform-player only');
	const b = consumer('player-only', tarball, [peer('vue'), peer('@arraypress/waveform-player')]);
	const others = ['bar', 'playlist', 'sounds'].map((n) => `@arraypress/waveform-${n}`);
	check('no other core was installed', others.every((p) => !fs.existsSync(path.join(b, 'node_modules', p))));
	const spec = `${pkg.name}/player`;
	const esm = attempt('node', ['--input-type=module', '-e',
		`const m = await import(${JSON.stringify(spec)}); console.log(JSON.stringify(Object.keys(m).sort()));`], b);
	check(`ESM import('${spec}')`, esm[0] && esm[1].trim() === JSON.stringify(EXPECTED.player), esm[1]);
	const cjs = attempt('node', ['--input-type=commonjs', '-e',
		`console.log(JSON.stringify(Object.keys(require(${JSON.stringify(spec)})).sort()))`], b);
	check(`CJS require('${spec}')`, cjs[0] && cjs[1].trim() === JSON.stringify(EXPECTED.player), cjs[1]);
	const ok = await bundle(b, `import { WaveformPlayer } from '${spec}';\nconsole.log(WaveformPlayer);\n`);
	check(`rolldown bundles '${spec}' (its lazy core import resolves)`, ok[0], ok[1]);
	const bad = await bundle(b, `import { WaveformBar } from '${pkg.name}/bar';\nconsole.log(WaveformBar);\n`);
	check(`control: '${pkg.name}/bar' does NOT bundle without its core`, !bad[0], 'it bundled');
	if (!bad[0]) console.log(`      (${bad[1]})`);
} finally {
	fs.rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
