/**
 * test/types.typecheck.ts
 * -----------------------
 *
 * Type-level assertions, checked by `npm run typecheck` (not vitest).
 *
 * The playlist's layout options are typed straight from the installed
 * playlist core. These assertions keep them from silently degrading to
 * `unknown` (the core's options interface has an index signature) or
 * narrowing — for the exported props type AND the component's runtime
 * prop declarations, whose `PropType`s derive from it — and pin the 2.0
 * track input shape and which player options are (not) props.
 */
import type { WaveformPlaylist } from '../../src/playlist/WaveformPlaylist';
import type { WaveformPlaylistProps, WaveformPlaylistTrackInput } from '../../src/playlist/types';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

assert<Equal<WaveformPlaylistProps['layout'], 'list' | 'minimal' | 'hero' | 'grid' | undefined>>();
assert<Equal<WaveformPlaylistProps['showArtist'], boolean | undefined>>();
assert<Equal<WaveformPlaylistProps['coverSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['thumbnailSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['density'], 'comfortable' | 'compact' | undefined>>();
assert<Equal<WaveformPlaylistProps['coverPosition'], 'left' | 'top' | undefined>>();
assert<Equal<WaveformPlaylistProps['barPosition'], 'top' | 'bottom' | undefined>>();

/** The component's public props, as a template / `h()` call sees them. */
type RuntimeProps = InstanceType<typeof WaveformPlaylist>['$props'];

assert<Equal<RuntimeProps['layout'], 'list' | 'minimal' | 'hero' | 'grid' | undefined>>();
assert<Equal<RuntimeProps['density'], 'comfortable' | 'compact' | undefined>>();
assert<Equal<RuntimeProps['coverPosition'], 'left' | 'top' | undefined>>();
assert<Equal<RuntimeProps['barPosition'], 'top' | 'bottom' | undefined>>();

// Track input (2.0): duration in seconds or as a clock string; per-track download target.
assert<Equal<WaveformPlaylistTrackInput['duration'], number | string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['downloadUrl'], string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['downloadName'], string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['waveform'], number[] | string | undefined>>();

// The 2.0 root-level player options the playlist passes on are props…
assert<Equal<WaveformPlaylistProps['showVolume'], boolean | undefined>>();
assert<Equal<WaveformPlaylistProps['volume'], number | null | undefined>>();
assert<Equal<RuntimeProps['showDownload'], boolean | undefined>>();
// …and what it strips, or takes per track, is not.
type NotProps = 'loop' | 'showLoop' | 'lazy' | 'loopLabel' | 'duration' | 'downloadUrl' | 'downloadName' | 'audioMode';
assert<Equal<Extract<keyof WaveformPlaylistProps, NotProps>, never>>();
