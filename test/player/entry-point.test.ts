import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

/**
 * Pins the peer floor that the `/no-autoinit` entry point depends on.
 *
 * The runtime half of this guard lives in the behaviour suite, which mocks the
 * package root with a factory that throws: if the component ever imports the
 * scanning entry again, every mount test fails with that message. This half
 * covers the other way it can break — the right import against a core too old
 * to have the subpath, which resolves to nothing at mount, in the browser, at
 * the consumer's site rather than here.
 */

describe('core entry point', () => {
	it('declares a peer floor that actually has the subpath', () => {
		// `/no-autoinit` landed in core 1.27.0; 2.0 keeps it (and the 2.0
		// options and events this component forwards need 2.0 anyway).
		expect(pkg.peerDependencies['@arraypress/waveform-player']).toBe('^2.0.0');
	});

	it('the installed core exports the subpath', async () => {
		const corePkg = (await import('@arraypress/waveform-player/package.json')).default as {
			exports: Record<string, unknown>;
		};
		expect(corePkg.exports['./no-autoinit']).toBeDefined();
	});
});
