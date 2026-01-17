Breaking Changes (v8)

1) TypeScript + Build Outputs
- Source has been migrated to TypeScript.
- Published entry points now come from `dist/` (CJS + ESM + `.d.ts`), not `src/`.
- `src/index.d.ts` has been removed in favor of generated declarations.

2) Image Rendering Library
- `react-native-fit-image` has been removed.
- Images now render using `expo-image`.
- The exported `FitImage` symbol is now an alias of `expo-image`'s `Image`
  (for compatibility), not the original `react-native-fit-image` component.

3) Inline CSS Style Support
- `css-to-react-native` has been removed.
- Inline `style` attributes are now parsed by a minimal internal converter.
  Supported values are limited to simple `key:value;` pairs and numeric/`px`
  values. Complex CSS or advanced parsing may behave differently.

4) Markdown-it Upgrade
- `markdown-it` upgraded from 10.x to 14.x, which includes multiple security
  and performance fixes, and an ESM-first build.
- Typographer behavior has changed since 10.x (e.g., `(p)` no longer becomes §).
  Validate any content relying on old typographer output.

5) PropTypes Removal
- `prop-types` has been removed. Runtime prop validation is no longer included.
  Use TypeScript typings for static validation.
