import json
import itertools
import shapely.ops
import shapely
import paths
import utils
import re

districts = json.loads(paths.districts_json_file.read_text(encoding="utf-8"))
blocks = json.loads(paths.blocks_json_file.read_text(encoding="utf-8"))
features = utils.normalize(
    json.loads(paths.senkyoku_porigon_json_file.read_text(encoding="utf-8"))["features"]
)

prefecture_name_to_block_id = {
    district["prefecture"]: district["bid"] for district in districts.values()
}

to_block_id = lambda f: prefecture_name_to_block_id[
    re.search(r"^[^1-9]+", f["properties"]["kuname"])[0]
]

output_features = []

for block_id, block_features in itertools.groupby(
    sorted(features, key=to_block_id), key=to_block_id
):
    # shapely.ops.unary_union
    block_geometry = shapely.GeometryCollection(
        [
            shapely.from_geojson(json.dumps(f, ensure_ascii=False)).buffer(0)
            for f in block_features
        ]
    )

    output_features.append(
        {
            "type": "Feature",
            "properties": {
                "bid": block_id,
            },
            "geometry": json.loads(
                shapely.to_geojson(
                    shapely.simplify(
                        shapely.ops.unary_union(
                            block_geometry,
                        ),
                        tolerance=0.001,
                        preserve_topology=False,
                    )
                )
            ),
        }
    )

paths.layer_geojson_blocks_json_file.write_text(
    json.dumps(
        {
            "type": "FeatureCollection",
            "features": utils.normalize(output_features),
        },
        ensure_ascii=False,
        separators=(",", ":"),
    ),
    encoding="utf-8",
)
