import json
import time
from pathlib import Path

import paths
import requests


def download(url: str, path: Path):
    response = requests.get(url)
    response.raise_for_status()
    path.write_bytes(response.content)


def get_response_body(url: str):
    response = requests.get(url)
    response.raise_for_status()
    return response.content


candidates = json.loads(paths.candidates_json_file.read_text(encoding="utf-8"))

for candidate_id, candidate in candidates.items():
    download(
        f'https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/photo/{candidate["face_image"]}',
        paths.nhk_faces_dir / f'{candidate["id"]}.jpg',
    )
    time.sleep(0.1)
