from pathlib import Path

workspace_dir = Path(__file__).parent.parent

data_dir = workspace_dir / "tools" / "data"

kickbacks_tsv_file = data_dir / "kickbacks.tsv"
cults_tsv_file = data_dir / "cults.tsv"
kickback_faces_tsv_file = data_dir / "kickback_faces.tsv"

nhk_dir = data_dir / "nhk"

data_geojson_dir = data_dir / "geojson"
chouchoume_dir = data_geojson_dir / "町丁目"
senkyoku_porigon_json_file = data_geojson_dir / "s0001" / "senkyoku289polygon.json"
n03_20240101_geojson_file = data_geojson_dir / "N03-20240101.geojson"

assets_dir = workspace_dir / "src" / "assets"
districts_json_file = assets_dir / "districts.json"
blocks_json_file = assets_dir / "blocks.json"
block_names_json_file = assets_dir / "block_names.json"
candidates_json_file = assets_dir / "candidates.json"
kickbacks_json_file = assets_dir / "kickbacks.json"
cults_json_file = assets_dir / "cults.json"
parties_json_file = assets_dir / "parties.json"

layers_dir = assets_dir / "layers"

layer_geojson_districts_json_file = layers_dir / "geojson_districts.json"
layer_geojson_blocks_json_file = layers_dir / "geojson_blocks.json"
layer_text_district_names_json_file = layers_dir / "text_district_names.json"
layer_text_block_names_json_file = layers_dir / "text_block_names.json"
layer_icon_district_kickbacks_json_file = layers_dir / "icon_district_kickbacks.json"
layer_icon_block_kickbacks_json_file = layers_dir / "icon_block_kickbacks.json"