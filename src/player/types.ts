/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-vue/player`.
 *
 * The shared option surface — `WaveformStyle`, `ColorPreset`,
 * `AudioMode`, `AudioPreload`, `ButtonAlign`, `WaveformMarker`,
 * `WaveformPeaks`, and the full per-option list behind
 * `WaveformPlayerProps` — is owned by the core library and re-exported
 * / extended here rather than re-declared. The core's declarations,
 * generated from its TypeScript source since 2.0, are the single source
 * of truth, so these types can never drift out of sync with it.
 *
 * This module only adds the Vue-specific surface:
 *
 *   - `WaveformPlayerProps` — the option surface accepted as component
 *     props (the core options minus the callback fields, which Vue
 *     surfaces as `@event` emits instead).
 *   - `WaveformPlayerExpose` — the imperative API exposed through a
 *     template `ref` (`loadTrack`, `seekTo`, `setVolume`, …).
 *
 * @see {@link https://github.com/WaveformPlayer/waveform-player} — core library
 */
import type {
	WaveformLoopEventDetail,
	WaveformPlayer,
	WaveformPlayerOptions,
	WaveformRateChangeEventDetail,
	WaveformSeekEventDetail,
	WaveformVolumeChangeEventDetail,
} from '@arraypress/waveform-player';

/**
 * Shared option types re-exported from the core library so consumers
 * importing them from this package keep working. These are the
 * single-source-of-truth definitions shipped by
 * `@arraypress/waveform-player` — not local copies.
 */
export type {
	WaveformStyle,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformMarker,
	WaveformPeaks,
	AudioCrossOrigin,
	WaveformSeekEventDetail,
	WaveformRateChangeEventDetail,
	WaveformVolumeChangeEventDetail,
	WaveformLoopEventDetail,
} from '@arraypress/waveform-player';

/**
 * The option surface accepted by `<WaveformPlayer>` as props.
 *
 * Derived from the core library's `WaveformPlayerOptions` so every
 * library option is a typed prop automatically and stays in sync as
 * the core evolves. The core's lifecycle callbacks are omitted — Vue
 * surfaces those as `@load`, `@play`, `@pause`, `@end`,
 * `@timeupdate`, and `@error` emits instead (see `WaveformPlayerEmits`).
 * `onNextTrack` / `onPreviousTrack` stay: they are real function props
 * (bind them as `@next-track` / `@previous-track`), because the wrapper
 * must know whether one is supplied — the core shows the lock-screen skip
 * button whenever it is.
 *
 * `waveform` takes a number array, compact `wp1:` peaks (the 2.0 core's
 * base64url string, about a quarter of the size of a JSON array), a
 * `.json` peaks URL or a JSON array string. `duration`, `downloadUrl` and
 * `downloadName` are per-track: the component remounts when `url` changes,
 * so set each together with the `url` it belongs to.
 *
 * `class`, `style`, and `id` are intentionally not listed: Vue's
 * attribute fall-through applies them to the root element
 * automatically (the base class `wfp-host` is always present and
 * merges with any consumer `class`). The core's own `style` — a
 * shorthand alias for `waveformStyle` — is omitted so it can't be
 * mistaken for that attribute; use `waveformStyle`.
 */
export type WaveformPlayerProps = Omit<
	WaveformPlayerOptions,
	'style' | 'onLoad' | 'onPlay' | 'onPause' | 'onEnd' | 'onError' | 'onTimeUpdate'
>;

/**
 * Events emitted by `<WaveformPlayer>`. The first six map to the core
 * library's same-named option callback and forward its arguments, ending
 * with the live `WaveformPlayer` instance. `seek`, `ratechange`,
 * `volumechange` and `loop` (core 2.0) carry the `detail` of the core's
 * `waveformplayer:<name>` event, which includes `player` and `url`; they
 * come from the player's own `<audio>`, so they fire in self mode only.
 *
 * ```vue
 * <WaveformPlayer @play="onPlay" @timeupdate="onTick" @volumechange="(d) => save(d.volume)" />
 * ```
 */
export interface WaveformPlayerEmits {
	/** Fired once after the player's `onLoad`. */
	(e: 'load', instance: WaveformPlayer): void;
	/** Fired when playback starts. */
	(e: 'play', instance: WaveformPlayer): void;
	/** Fired when playback pauses. */
	(e: 'pause', instance: WaveformPlayer): void;
	/** Fired when the track ends. */
	(e: 'end', instance: WaveformPlayer): void;
	/** Fired on each progress frame. */
	(e: 'timeupdate', currentTime: number, duration: number, instance: WaveformPlayer): void;
	/** Fired on audio load / playback error. */
	(e: 'error', error: Error, instance: WaveformPlayer): void;
	/** Fired when the audio lands on a new position (any seek, and a whole-track loop's wrap). */
	(e: 'seek', detail: WaveformSeekEventDetail): void;
	/** Fired when the playback rate changes. */
	(e: 'ratechange', detail: WaveformRateChangeEventDetail): void;
	/** Fired when the volume or muted state changes. */
	(e: 'volumechange', detail: WaveformVolumeChangeEventDetail): void;
	/** Fired when the loop state changes (`loop`, and the section `start` / `end` or `null`). */
	(e: 'loop', detail: WaveformLoopEventDetail): void;
}

/**
 * Imperative API exposed through a template `ref`. Lets consumers
 * drive the player directly — useful for "play this track when X
 * happens" flows where wiring everything through props is awkward.
 *
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { WaveformPlayer, type WaveformPlayerExpose } from '@arraypress/waveform-vue/player';
 * const player = ref<WaveformPlayerExpose>();
 * </script>
 * <template>
 *   <WaveformPlayer ref="player" url="/audio/track.mp3" />
 *   <button @click="player?.seekTo(60)">Jump to 1:00</button>
 * </template>
 * ```
 *
 * Each method is a thin pass-through to the underlying
 * `WaveformPlayer` instance. If the instance hasn't mounted yet (the
 * core loads asynchronously) the calls are no-ops.
 */
export interface WaveformPlayerExpose {
	/** Start playback. Returns the native `play()` promise in self-mode. */
	play(): Promise<void> | undefined;
	/** Pause playback. */
	pause(): void;
	/** Toggle play / pause. */
	togglePlay(): void;
	/** Seek to a specific time in seconds. Self-mode only. */
	seekTo(seconds: number): void;
	/** Seek to a percentage of total duration (0..1). Self-mode only. */
	seekToPercent(percent: number): void;
	/** Set output volume (0..1). Self-mode only. */
	setVolume(volume: number): void;
	/** Set playback rate (0.25..4 — the core clamps to that range). Self-mode only. */
	setPlaybackRate(rate: number): void;
	/** External-mode only: push the play/pause state into the player. */
	setPlayingState(playing: boolean): void;
	/** External-mode only: push the current playback position into the player. */
	setProgress(currentTime: number, duration: number): void;
	/** Load a new track without remounting the component. */
	loadTrack(
		url: string,
		title?: string,
		artist?: string,
		options?: Record<string, unknown>
	): Promise<void>;
	/** Underlying `WaveformPlayer` instance, for the full core API. */
	readonly instance: WaveformPlayer | null;
}
