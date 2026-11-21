# Changelog

## 2.0.0 — 2026-11-21

One package replaces the four Vue wrappers, and it is built for the 2.0
cores (`@arraypress/waveform-player`, `-bar`, `-playlist` and `-sounds`
2.0).

| Before | Now |
| --- | --- |
| `@arraypress/waveform-player-vue` (0.7.0) | `@arraypress/waveform-vue/player` |
| `@arraypress/waveform-bar-vue` (0.4.0) | `@arraypress/waveform-vue/bar` |
| `@arraypress/waveform-playlist-vue` (0.5.0) | `@arraypress/waveform-vue/playlist` |
| `@arraypress/waveform-sounds-vue` (0.2.1) | `@arraypress/waveform-vue/sounds` |

Each sub-path exports the same components, props, emits, exposed API and
types as the package it replaces, plus the 2.0 additions below. Switching is
a change of import path. There is no root import: each sub-path loads only
its own core with `import()`, so you install only the cores you use.

### Requirements

- **The 2.0 cores.** Every core is an optional peer at `^2.0.0` (was
  `^1.27.0` for the player, `^1.11.0` bar, `^1.8.0` playlist,
  `^0.2.0 || ^0.3.0` sounds). 2.0 cores run on Chrome/Edge 111+, Firefox
  114+ and Safari 16.4+.
- **Vue 3.5+ only** (`vue` peer `^3.5.0`, as before).
- **Node 22.12+** (`engines`, was `>=18.0.0`), as for the cores.
- **ES modules only.** The CommonJS builds (`dist/<name>/index.cjs`,
  `index.d.cts`) and the `require` export conditions are gone, like the
  cores'. Node 22.12+ loads the ES modules through `require()`.
  `typesVersions` stays, so TypeScript's `moduleResolution: "node"`
  (`node10`, which ignores `exports`) still finds every sub-path's types.

### Added — player (`./player`)

- **The 13 options new in the 2.0 core are props**, forwarded only when set
  (so the core's defaults apply otherwise) and remounting the player when
  they change: `duration` (seconds, shown as the total and used for seeks
  until the audio's metadata arrives), `lazy`, `loop`, `showLoop`,
  `loopLabel`, `showVolume`, `volume`, `volumeLabel`, `muteLabel`,
  `showDownload`, `downloadUrl`, `downloadName`, `downloadLabel`.
  `duration`, `downloadUrl` and `downloadName` are per-track: the component
  remounts on a `url` change, so each follows the url it is set with.
- **`@seek`, `@ratechange`, `@volumechange` and `@loop` emits**, each with
  the `detail` of the core's `waveformplayer:<name>` event
  (`WaveformSeekEventDetail`, `WaveformRateChangeEventDetail`,
  `WaveformVolumeChangeEventDetail`, `WaveformLoopEventDetail`, re-exported
  with `AudioCrossOrigin`). They come from the player's own `<audio>`, so
  they fire in self mode only.
- **`waveform` accepts compact `wp1:` peaks**, passed through for the core
  to decode.

### Changed — player

- **Emits are typed.** The component declares its emits with their payload
  types (the six callback emits keep the core's arguments), so `@play`,
  `@timeupdate`, … listeners are typed in templates instead of `any`.

### Added — playlist (`./playlist`)

- **The 2.0 player options the playlist passes to its player are props**:
  `showVolume`, `volume`, `showDownload`, `volumeLabel`, `muteLabel`,
  `downloadLabel`.
- **Track input**: `duration` is seconds or a clock string (`225` or
  `'3:45'`, was a string only); the 2.0 playlist shows it and hands it to the
  player as its `duration`. New `downloadUrl` / `downloadName`, rendered as
  `data-download-url` / `data-download-name`, set that track's download link.
  `waveform` accepts `wp1:` peaks.

### Changed — playlist

- **Not props, because the 2.0 playlist never passes them to its player**:
  `loop`, `showLoop`, `lazy` (it strips them, like `audioMode`) and
  `loopLabel` (it only names the loop button). `duration`, `downloadUrl` and
  `downloadName` are per-track fields of `tracks`, not playlist props.
  `WaveformPlaylistProps` omits all of them.
- Layout props are typed straight from the playlist core; the fallback for
  pre-1.8.0 cores is gone.

### Changed — bar (`./bar`)

- Config keys are unchanged. A trigger's `duration` is documented as seconds
  or a clock string (the 2.0 bar passes it to the player, so the length
  shows before any audio loads), and `waveform` as accepting `wp1:` peaks.
- The ambient `declare module '@arraypress/waveform-bar'` shim is gone: the
  2.0 bar ships its own types, including `Window.WaveformBar`. This package
  declares nothing global, so the two can't conflict.

### Changed — sounds (`./sounds`)

- Built for `@arraypress/waveform-sounds` 2.0. Props, emits and the
  server-rendered markup are unchanged (the SSR output stays byte-identical
  to the core's `renderSounds`).

### Removed

- The CommonJS builds and `require` conditions (see Requirements).
- Compatibility with 1.x cores: the playlist's fallback types and option
  list for pre-1.8.0 playlist cores, and the bar's "1.12.0+, older bars
  ignore it" caveats on `barRadius` and `showTime`.
