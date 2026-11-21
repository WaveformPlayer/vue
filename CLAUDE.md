# CLAUDE.md — @arraypress/waveform-vue

Vue 3 components for the waveform family, one sub-path per core:
`./player` (`WaveformPlayer`), `./bar` (`WaveformBar`, `WaveformBarTrigger`),
`./playlist` (`WaveformPlaylist`), `./sounds` (`WaveformSounds`). Merged in
2.0 from `waveform-{player,bar,playlist,sounds}-vue`. No root entry, on
purpose: each sub-path `import()`s its core lazily and bundlers resolve every
`import()` at build time, so one entry would fail to build without all four
cores. The cores are optional peers.

## Commands
- `npm test` — vitest + jsdom, all suites in `test/<name>/`.
- `npm run typecheck` — `tsc --noEmit` (TS 7), incl. `test/**/types.typecheck.ts`
  and `expectTypeOf` assertions. Must be 0 errors.
- `npm run lint` — Biome, recommended preset, formatter off.
- `npm run build` — tsdown, one isolated ESM build per sub-path into
  `dist/<name>/` (`index.js` + `index.d.ts`). No CommonJS since 2.0.
- `npm run test:pack` — packs the tarball into throwaway consumers (cores
  from npm, or packed from a temporary `file:` devDependency): exports vs tarball, ESM-only, every sub-path imports,
  tsc NodeNext + Bundler, and a player-only consumer that bundles `./player`
  but not `./bar`. Run it whenever you touch `exports`, `files`, the build
  or a `.d.ts`.

## Dependencies
- **devDependencies on the cores are the published ranges** (`^2.1.0`;
  `-bar` `^2.0.0`), resolved
  from registry.npmjs.org (no `link: true` lock entries, real directories in
  `node_modules`). The drift tests read the installed cores, and the
  peer-range tests check each devDependency is a `^2.x` range at least the
  peer floor. For cross-repo work before a core release, a devDependency can
  temporarily be `file:../waveform-<name>` (the peer-range tests fail while
  it is); switch it back and re-resolve the lock before publishing:
  `rm -rf node_modules/@arraypress/waveform-<name>` then
  `npm install --save-dev @arraypress/waveform-<name>@^2.x.y` (a plain
  `npm install` after editing package.json keeps the `link: true` entry).
- Peers: each core optional (`peerDependenciesMeta`), `^2.0.0` except
  `-playlist` and `-sounds` at `^2.1.0` (the playlist's `/no-autoinit`
  entry; `pickRenderOptions`, `destroy({ restore })`); `vue`
  `^3.5.0` — Vue 3.5+ only (`useId()` in `./sounds` is 3.5 API).
- `typesVersions` is kept for TypeScript's `node10` resolution, which ignores
  `exports`; every sub-path's `.d.ts` imports only the cores' root entries.

## Forwarding rules — one per sub-path

Prop **types** flow from the cores (`Omit<>` of their options); runtime
forwarding does not. Vue registers props at runtime, so **a TS type alone is
not a prop**: without a runtime declaration the value falls through as an
attribute and never reaches the core.

### player — `src/player/WaveformPlayer.ts` (three edits per option)
1. A runtime prop declaration in `props`
   (`<key>: { type: String as PropType<Union>, default: undefined }`; a named
   union from the core's exported types, or derived as
   `NonNullable<WaveformPlayerOptions['key']>` when the core has none).
2. `set('<key>', p.<key>)` in `buildLibraryOptions`.
3. `props.<key>,` in the `watch(() => [...])` remount array.

Per-track options (`duration`, `downloadUrl`, `downloadName`, plus `url`,
`title`, `waveform`, `markers`, …) follow the url because a `url` change
**remounts** — there is no `loadTrack` path in the component (the exposed
`loadTrack()` passes options straight through). Callbacks `onLoad` …
`onError` are emits; `onNextTrack` / `onPreviousTrack` are function props
(their presence is a remount trigger, since the core shows lock-screen
buttons whenever they're set). The 2.0 events `seek`, `ratechange`,
`volumechange`, `loop` are emits fed by one listener per event on the host
for `waveformplayer:<name>` (target must be the host), payload = the
event's `detail`. The component imports `@arraypress/waveform-player/no-autoinit`,
never the root (which scans the page); the test mocks the root to throw.
`NOT_FORWARDED`: `style` only (Vue's CSS attribute; use `waveformStyle`).

### bar — `src/bar/types.ts` (the type IS the contract)
`config` passes verbatim to `window.WaveformBar.init()`; there is no
per-key allowlist, so a bar option needs only its key in `WaveformBarConfig`.
The type stays hand-written (this package's `.d.ts` must not depend on the
bar's, an optional peer) and `SHARED_CONFIG_KEYS` must stay identical in all
four framework packages. `NOT_TYPED`: the `on*` callbacks (listen for
`waveformbar:*` events). `NOT_IN_DEFAULTS`: `mode` (derived in `init()`).
Never declare `Window.WaveformBar` here — the 2.0 bar's generated types do,
and `WaveformBar.ts` reads the global through a structural cast. Trigger
props map 1:1 to `data-wb-*` in `WaveformBarTrigger.ts`.

### playlist — `src/playlist/WaveformPlaylist.ts` (player pattern, three edits)
Same three edits as the player. Forward a player option only if the
playlist passes it to its player (usually yes). `NOT_FORWARDED` (in
`test/playlist/forwarding-drift.test.ts`, and `Omit`ted from
`WaveformPlaylistProps`): per-track `url`, `src`, `title`, `artist`,
`artwork`, `album`, `markers`, `waveform`, `duration`, `downloadUrl`,
`downloadName` (rendered on each `[data-track]` from `tracks`); `style`;
`audioMode`, `loop`, `showLoop`, `lazy` (the 2.0 playlist strips them);
`loopLabel` (names only the loop button, which never shows). A new
per-track field goes on `WaveformPlaylistTrackInput` and in `renderTracks()`.
The remount watcher uses `flush: 'post'` so the constructor parses the
freshly patched track markup. Imports `@arraypress/waveform-playlist/no-autoinit`,
never the root (since 2.1 it scans the page and registers
`<waveform-playlist>`); the tests mock the root to throw.

### sounds — `src/sounds/WaveformSounds.ts` (three edits)
1. Runtime prop declaration. 2. Its key in `buildOptions()`. 3. `props.<key>`
in the rebuild watcher's `serialize([...])` list — or a live setter watcher
plus an entry in the drift test's `LIVE` map (only `loop`; a live option
that shapes markup is read untracked in `renderView`, or a change would
re-patch the markup under the instance). `NOT_FORWARDED`: none. The host's
`innerHTML` is the core's `renderSounds()` output with the core's
`pickRenderOptions()` (no hand-kept render list) and must stay
byte-identical (`test/sounds/ssr.test.ts`). A rebuild over unchanged markup
destroys with `{ restore: true }`; changed markup is Vue's fresh patch,
which a plain `destroy()` leaves.
`idPrefix` defaults to `ws-${useId()}`. The engine isn't imported here: the
consumer registers `window.WaveformPlayer` or passes `playerClass` (a second
class copy would split `singlePlay`). `playerOptions` pass through; the
2.0 core itself forces `loop`/`showLoop` off and drops per-track keys.

## Drift tests (each must go red for a genuinely unforwarded option)
- `test/player/forwarding-drift.test.ts` + `core-options.ts`: core
  `DEFAULT_OPTIONS` (`src/js/themes.ts`, imported by path) ∪ the keys of
  `WaveformPlayerOptions` in `types/types.d.ts`. Checks forwarded, remounts,
  no stale entries. A new option with a `null` default needs a sample in
  `SAMPLE_OVERRIDES`.
- `test/playlist/forwarding-drift.test.ts` + `option-surface.ts`: both cores'
  `types/types.d.ts`.
- `test/bar/config-drift.test.ts`: the bar's `const DEFAULTS = {` in
  `src/js/core.ts` vs `interface WaveformBarConfig`; `config-types.test.ts`
  also checks the type against the bar's generated `WaveformBarConfig`.
- `test/sounds/forwarding-drift.test.ts` + `option-surface.ts`: the sounds
  core's `types/types.d.ts`, cross-checked against its `DEFAULT_OPTIONS`.

The cores' `exports` maps block `src/` and `types/` (and Vite won't serve a
temporary `file:` symlink's target), so these files are read with
`readFileSync` from the path beside each core's resolved `package.json`,
never a package specifier or `?raw`.

## Conventions
- Components are `defineComponent` + render functions (no SFC compile step).
- Host `class` is frozen at setup and the live fall-through class applied with
  `classList`, because the cores own classes on the host (player, playlist,
  sounds). Don't hand `class` back to Vue's patching.
- Every async `import()` takes a mount token; a stale one bails.
- Changing an option is a family-wide batch — load the `waveform-release`
  skill.
