import json

import paths
import shapely
import utils

kickbacks = json.loads(paths.kickbacks_json_file.read_text(encoding="utf-8"))
features = json.loads(paths.layer_geojson_blocks_json_file.read_text(encoding="utf-8"))[
    "features"
]

districts = []

for feature in features:
    geometry_type = feature["geometry"]["type"]
    properties = feature["properties"]
    geometry = shapely.from_geojson(json.dumps(feature, ensure_ascii=False))
    centroid = (
        geometry.centroid
        if geometry_type == "Polygon"
        else max(geometry.geoms, key=lambda g: g.area).centroid
    )
    districts.append(
        {
            "b": properties["bid"],
            "a": geometry.area,
            "p": [centroid.x, centroid.y],
        }
    )

paths.layer_text_block_names_json_file.write_text(
    json.dumps(
        utils.normalize(districts),
        ensure_ascii=False,
        separators=(",", ":"),
    ),
    encoding="utf-8",
)
