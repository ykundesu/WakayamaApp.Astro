# サードパーティに関する表記

- `assets/materialcommunityicons-source.ttf` は、元のアプリケーションで `@expo/vector-icons` と共に配布されている Material Design Icons フォントです。`src/platform/icons.woff2` は、そのフォントの修正済みサブセットです（`src/platform/icon-glyphs.json` に含まれるコードポイントのみ抽出し、WOFF2 形式に変換したもの）。フォントのライセンス：Apache 2.0。`licenses/MaterialDesign.txt` および `licenses/Apache-2.0.txt` を参照してください。ソース：https://github.com/Templarian/MaterialDesign-Webfont
- アイコンのグリフマッピングは react-native-vector-icons に由来します。`licenses/react-native-vector-icons.txt` を参照してください（MIT License, Joel Arvidsson）。
- アプリケーションの既存のアイコンおよび画面コンポーネントは、https://github.com/ykundesu/WakayamaKosenApp から引き継がれたものです。
- 実行時およびビルド時の依存関係については、それぞれの npm パッケージ内で配布されているライセンスファイルが適用されます。`package-lock.json` には正確な依存関係のバージョンが記録されています。React Native は型宣言のために使用されている開発依存関係（development dependency）であり、Vite は実行時のインポート先を React Native Web へ別名付け（エイリアス）します。
- 学校のドキュメント、サードパーティの図表、および API データは実行時に取得されるものであり、本リポジトリの MIT ライセンスの適用対象外です。