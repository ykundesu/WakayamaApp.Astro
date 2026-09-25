# Third-party notices

- `assets/materialcommunityicons-source.ttf` is the Material Design Icons font distributed with `@expo/vector-icons` in the original application. `public/fonts/icons.woff2` is a modified subset of that font (only the codepoints in `src/platform/icon-glyphs.json`, converted to WOFF2). Font license: Apache 2.0; see `licenses/MaterialDesign.txt` and `licenses/Apache-2.0.txt`. Source: https://github.com/Templarian/MaterialDesign-Webfont
- The icon glyph mapping originates from react-native-vector-icons. See `licenses/react-native-vector-icons.txt` (MIT, Joel Arvidsson).
- The application's existing icon and screen components were carried over from https://github.com/ykundesu/WakayamaKosenApp .
- Runtime/build dependencies retain the license files distributed in their npm packages. `package-lock.json` records exact dependency versions. React Native is a development dependency used for type declarations; Vite aliases runtime imports to React Native Web.
- School documents, third-party figures and API data are fetched at runtime and are not licensed under this repository's MIT license.
