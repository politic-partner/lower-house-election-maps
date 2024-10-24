import json

import paths
import shapely
import utils

features = json.loads(
    paths.layer_geojson_districts_json_file.read_text(encoding="utf-8")
)["features"]

districts = []

for feature in features:
    geometry_type = feature["geometry"]["type"]
    properties = feature["properties"]
    geometry = shapely.from_geojson(json.dumps(feature, ensure_ascii=False))

    match geometry_type:
        case "Polygon":
            centroid = geometry.centroid
            districts.append(
                {
                    "d": properties["did"],
                    "b": properties["bid"],
                    "a": geometry.area,
                    "p": [centroid.x, centroid.y],
                }
            )
        case "MultiPolygon":
            for g in geometry.geoms:
                if g.area < 0.0002:
                    continue
                centroid = g.centroid
                districts.append(
                    {
                        "d": properties["did"],
                        "b": properties["bid"],
                        "a": g.area,
                        "p": [centroid.x, centroid.y],
                    }
                )
        case _:
            print(f"Unsupported geometry type: {geometry_type}")

paths.layer_text_district_names_json_file.write_text(
    json.dumps(
        sorted(utils.normalize(districts), key=lambda d: d["a"], reverse=True),
        ensure_ascii=False,
        separators=(",", ":"),
    ),
    encoding="utf-8",
)
