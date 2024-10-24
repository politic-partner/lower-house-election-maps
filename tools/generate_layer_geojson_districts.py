import json
from pathlib import Path

import paths
import shapely
import shapely.ops
import utils
from district_mapping import area_expands, prefecture_suffix


def expand(prefix: str, t: dict | list) -> list[str]:
    if isinstance(t, dict):
        return [
            s
            for k, v in t.items()
            for s in (
                expand(f"{prefix}{'' if k.endswith('管内') else k}", v)
                if len(v) > 0
                else [f"{prefix}{k}"]
            )
        ]
    if isinstance(t, list):
        if len(t) == 0:
            return [prefix]
        return [f"{prefix}{v}" for v in t]
    raise ValueError("Invalid type: {type(t)}")


districts = json.loads(paths.districts_json_file.read_text(encoding="utf-8"))
features = utils.normalize(
    json.loads(paths.n03_20240101_geojson_file.read_text(encoding="utf-8"))["features"],
    4,
)

tolerance = 0.001

processed_features = set()
output_features = []
area_to_chomes = {}


def swap_dict_orders(d: dict, key1: str, key2: str):
    d[key1], d[key2] = d[key2], d[key1]


# 除外条件の計算順序を調整するために以下の区域の順序を入れ替える
swap_dict_orders(districts, "52092", "52093")  # 群馬4区, 群馬5区
swap_dict_orders(districts, "52095", "52096")  # 埼玉２区, 埼玉3区
swap_dict_orders(districts, "52125", "52344")  # 東京4区, 東京26区
swap_dict_orders(districts, "52171", "52172")  # 長野1区, 長野2区
swap_dict_orders(districts, "52287", "52288")  # 香川１区, 香川２区
swap_dict_orders(districts, "52296", "52299")  # 福岡１区, 福岡4区
swap_dict_orders(districts, "52317", "52318")  # 大分１区, 大分2区
swap_dict_orders(districts, "52323", "52324")  # 鹿児島１区, 鹿児島2区

# 除外エリア名
exclude_feature_names = {
    "兵庫県姫路市飾磨区須加",
    "千葉県船橋市水面",
    "東京都大田区羽田沖水面",
    "福岡県福岡市東区水面",
    "鹿児島県鹿児島市鹿児島港の水域",
}

for district_id, district in districts.items():
    prefucture = district["prefecture"]

    prefecture_with_suffix = prefecture_suffix[prefucture]

    areas = list(district["areas"])

    def swap_list_elements(lst: list[str], key1: str, key2: str):
        idx1 = lst.index(key1)
        idx2 = lst.index(key2)
        lst[idx1], lst[idx2] = lst[idx2], lst[idx1]

    district_features = []

    for area in areas:
        area_expanded = area_expands.get(area, area)
        if isinstance(area_expanded, str):
            match_feature = None
            for feature in features:
                if id(feature) in processed_features:
                    continue

                properties = feature["properties"]

                feature_prefucture = properties["N03_001"]
                if feature_prefucture != prefecture_with_suffix:
                    continue

                feature_area = "".join(
                    filter(
                        None,
                        (
                            properties["N03_004"],
                            properties["N03_005"],
                        ),
                    )
                )

                if feature_area != area_expanded:
                    continue

                match_feature = feature
                district_features.append(feature)
                processed_features.add(id(feature))

            if match_feature is None:
                print(f"Not found: {prefucture}, {area}")
                continue

        else:
            area_json: Path = paths.chouchoume_dir / area_expanded["json"]
            area_prefix = area_expanded["prefix"]
            included = area_expanded["included"]
            area_features = utils.normalize(
                json.loads(area_json.read_text(encoding="utf-8"))["features"],
                4,
            )

            if len(included) > 0:
                chomes = expand(area_prefix, included)
            else:
                chomes = set(f["properties"]["name"] for f in area_features) - set(
                    c for e in area_expanded["excluded"] for c in area_to_chomes[e]
                )

            for area_expanded in chomes:
                for feature in area_features:
                    feature_name = feature["properties"]["name"]
                    if feature_name in exclude_feature_names:
                        continue

                    if area_expanded[-1] == "*":
                        if not feature_name.startswith(area_expanded[:-1]):
                            continue
                    elif area_expanded != feature_name:
                        continue

                    district_features.append(feature)
            area_to_chomes[area] = chomes

    district_geometry = shapely.GeometryCollection(
        [
            shapely.from_geojson(json.dumps(f, ensure_ascii=False)).buffer(0)
            for f in district_features
        ]
    )

    output_features.append(
        {
            "type": "Feature",
            "geometry": json.loads(
                shapely.to_geojson(
                    shapely.simplify(
                        shapely.ops.unary_union(
                            district_geometry,
                        ),
                        tolerance=tolerance,
                        preserve_topology=False,
                    )
                )
            ),
            "properties": {
                "did": district_id,
                "bid": district["bid"],
            },
        }
    )


paths.layer_geojson_districts_json_file.write_text(
    json.dumps(
        {
            "type": "FeatureCollection",
            "features": utils.normalize(output_features, 4),
        },
        ensure_ascii=False,
        separators=(",", ":"),
    ),
    encoding="utf-8",
)
