from pathlib import Path
import json

workspace_dir = Path(__file__).parent.parent

geojson_dir = workspace_dir / "tools" / "geojson" / "町丁目"

features = [
    f
    for g in geojson_dir.glob("静岡県浜松市*.geojson")
    for f in json.loads(g.read_text(encoding="utf-8"))["features"]
]

(geojson_dir / "静岡県浜松市.json").write_text(
    json.dumps(
        {
            "type": "FeatureCollection",
            "features": features,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    ),
    encoding="utf-8",
)
