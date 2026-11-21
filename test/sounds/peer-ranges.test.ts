/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic: this sub-path targets
 * `@arraypress/waveform-sounds` 2.0 (generated types in `types/`, whose
 * `/render` markup this wrapper writes for the runtime to adopt — byte-
 * identical to 0.3.1's), and that core's own peer floor on
 * `@arraypress/waveform-player` is 2.0.0.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

/** The lowest version a range accepts: `^x.y.z`, or a `||` union of them. */
const floor = (range: string): number[] => {
	const parts = range.split('||').map((part) => {
		const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(part.trim());
		if (!m) throw new Error(`expected ^x.y.z ranges, got ${range}`);
		return m.slice(1).map(Number);
	});
	return parts.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])[0];
};
const atLeast = (range: string, min: string): boolean => {
	const [a, b] = [floor(range), floor(`^${min}`)];
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('peer dependency floors', () => {
	it('requires waveform-sounds >= 2.0.0', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-sounds'], '2.0.0')).toBe(true);
	});

	it("requires waveform-player >= 2.0.0 (the sounds core's own floor)", () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});

	it('develops against the sibling 2.0 checkout until it is published', () => {
		expect(pkg.devDependencies['@arraypress/waveform-sounds']).toBe('file:../waveform-sounds');
	});
});
