# Python tools

## 手順

1. `download_nhk_xml.py`
2. `generate_nhk_jsons.py`
3. `generate_layer_geojson_districts.py`
3. `generate_layer_geojson_blocks.py`
4. `generate_layer_text_block_names.py`
4. `generate_layer_text_districts_names.py`
5. `generate_kickbacks.py`
5. `generate_cults.py`
5. `generate_nhk_results.py`

## Data

| Path | 出展 |
|-|-|
| `tools/data/kickbacks.tsv` | [政治資金パーティー収入　裏金はおいくらでしたか？（裏金国会議員一覧）](https://clearing-house.org/?p=6069) |
| `tools/data/kickbacks.tsv` | [【一覧】自民党国会議員の"裏金"リスト 88人](https://news.ntv.co.jp/pages/uragane) |
| `tools/data/cults.tsv` | [【衆院選2021】総力特集・カルト候補ぜんぶ載せ！](http://dailycult.blogspot.com/2021/10/2021.html) |
| `tools/data/moonies.tsv` | [自民党、旧統一教会と接点ある国会議員は179人　うち121人を公表　選挙支援の依頼は2人](https://www.tokyo-np.co.jp/article/200852) |
| `tools/data/geojson/s0001/senkyoku289polygon.json` | [市区町村・選挙区 地形データ](https://github.com/smartnews-smri/japan-topography) |
| `tools/data/geojson/町丁目/*.geojson` | [住所LODから行政区画のGeoJSONファイルを作成する方法](https://qiita.com/uedayou/items/806ed80a45ec9855c554) |
| `tools/data/geojson/N03-20240101.geojson` | [国土数値情報 > 行政区域データ: データ基準年 2024年（令和6年）版](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html) |
