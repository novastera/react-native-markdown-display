Implementation Plan: Modernize react-native-markdown-display

Goals
- Update markdown parser to `markdown-it@^14`.
- Remove unmaintained dependencies: `react-native-fit-image`, `prop-types`, and likely `css-to-react-native`.
- Move codebase to TypeScript for type safety and better DX.
- Replace image rendering with `expo-image` (or a fallback that does not rely on unmaintained libs).
- Keep API compatibility where practical; document breaking changes clearly.

Non-goals
- No feature expansion beyond parity with existing render rules.
- No UI framework migration; keep render output compatible with React Native core components.

Current Dependencies (to replace/remove)
- `react-native-fit-image` (image rendering)
- `prop-types` (runtime props validation)
- `css-to-react-native` (convert inline CSS)
- `markdown-it@^10` (upgrade to v14)

Proposed Dependency Set
- `markdown-it@^14`
- `expo-image` (preferred image rendering)
- TypeScript dev tooling (tsconfig, types, linting updates)

Workstreams

1) Dependency Audit and Upgrade
- Upgrade `markdown-it` to `^14` in `package.json`.
- Identify any plugin or API changes required by `markdown-it@14`.
- Remove `prop-types` from dependencies once TypeScript migration is complete.
- Remove `react-native-fit-image` and `css-to-react-native` once replacements are in place.
- Review `markdown-it@14` changelog for behavior changes relevant to parsing,
  especially ESM build changes and security/perf fixes since 10.x.

2) Image Rendering Migration
- Replace `react-native-fit-image` usage in `src/lib/renderRules.js` image rule.
- New image component should:
  - Support `uri` sources.
  - Provide accessibility label when `alt` is present.
  - Respect existing style contract (`styles._VIEW_SAFE_image`).
- Define a fallback strategy for non-Expo users:
  - Option A: expose an injectable Image component via props.
  - Option B: keep RN `Image` as default and allow `expo-image` when available.
- Update documentation to explain image handling and any required installation steps.

3) TypeScript Migration
- Convert `src` to `.ts` / `.tsx` with strict typing.
- Replace PropTypes with interfaces and exported types.
- Update entry points and type exports in `src/index.d.ts` and `src/index.js`.
- Add/adjust `tsconfig.json` for strict mode.
- Add a build step that emits `.d.ts` (and JS) to `dist/`, then remove
  `src/index.d.ts` once declarations are generated.
- Update `package.json` publish fields (`main`, `types`, `exports`, `files`)
  to point at `dist/` outputs.

4) CSS Style Conversion Evaluation
- Find all usages of `convertAdditionalStyles` in `src/lib`.
- Decide on one of:
  - Remove inline CSS support and document this breaking change.
  - Replace `css-to-react-native` with a maintained alternative.
  - Implement a minimal parser for a safe subset of CSS (if required).
- If removed, ensure code paths do not reference the util.

5) API Compatibility and Breaking Changes
- Review public API surfaces (props, render rules, styles).
- Document any changes required by image handling or CSS conversion removal.
- Provide migration guide in README.

6) Tests and Verification
- Add or update snapshot tests for render output (if test setup exists).
- Manually validate:
  - Basic markdown rendering.
  - Links and image rendering.
  - Lists, code blocks, tables.
- Verify React Native 0.79 compatibility.

Markdown-it 10.x -> 14.x Considerations
- 14.x is ESM-first (CJS fallback still available); ensure bundling/imports
  work with RN metro and any consumer tooling.
- 14.x includes fixes for quadratic parsing and table output growth; include
  regression tests with large inputs to confirm no perf regressions.
- 13.x/12.x include multiple security/perf fixes (e.g., linkify, ReDoS, link
  parsing edge cases); ensure markdown-it is the only parser dependency and is
  bumped everywhere it is consumed.
- Typographer behavior changed in 13.x (e.g., `(p)` no longer becomes §);
  verify text output and update docs if users rely on old behavior.
Sources: https://github.com/markdown-it/markdown-it/blob/master/CHANGELOG.md

Implementation Ready Checklist
- `package.json` updated with `markdown-it@^14` and removal targets listed.
- Image rule migration plan agreed (expo-image + fallback strategy).
- Decision recorded for inline CSS handling (`css-to-react-native` replace/remove).
- TypeScript migration scope defined (entry points and public types).
- Breaking changes drafted for README.

Code Review Notes (src/)
- `src/index.js` is the public entry; it exports `FitImage`, `MarkdownIt`,
  `renderRules`, `AstRenderer`, `parser`, and helpers. PropTypes are defined
  on the `Markdown` component.
- `Markdown` component instantiates `MarkdownIt` with `{typographer: true}`
  by default and passes it into `parser`. Memoization is tied to `markdownit`
  and renderer props.
- `src/lib/renderRules.js` uses `react-native-fit-image` for the `image` rule
  and maps `alt` to `accessibilityLabel`.
- `src/lib/AstRenderer.js` uses `convertAdditionalStyles` for inline `style`
  attributes on nodes (string CSS). This is the only runtime user of
  `css-to-react-native`.
- `src/index.d.ts` types include `onLinkPress?: (url: string) => boolean`,
  which should be reconciled with the runtime `openUrl` behavior.

File-by-File Targets (initial)
- `package.json`: dependency updates and removals.
- `src/lib/renderRules.js`: image rule migration.
- `src/lib/util/convertAdditionalStyles.js`: remove or replace.
- `src/index.js`, `src/index.d.ts`: TS entry and types.
- New `tsconfig.json` if not present.

Acceptance Criteria
- Library builds and runs in RN 0.79 with React 18.
- No dependency on unmaintained packages (`react-native-fit-image`, `prop-types`, `css-to-react-native`).
- Fully typed public API with strict TypeScript.
- `markdown-it@14` used with no regressions in core markdown output.

Risks and Mitigations
- Image rendering differences:
  - Mitigate by allowing custom image component injection.
- CSS conversion removal:
  - Mitigate by documenting breaking changes and providing migration examples.
- Markdown-it API changes:
  - Mitigate by targeted audit of parser setup and plugin usage.
