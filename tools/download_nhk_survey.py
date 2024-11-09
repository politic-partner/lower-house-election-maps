import json
import time
from pathlib import Path

import paths
import requests

districts = json.loads(paths.districts_json_file.read_text(encoding="utf-8"))


def download(url: str, path: Path):
    response = requests.get(url)
    response.raise_for_status()
    path.write_bytes(response.content)


def get_response_body(url: str):
    response = requests.get(url)
    response.raise_for_status()
    return response.content


paths.nhk_survey_dir.mkdir(parents=True, exist_ok=True)

download(
    "https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/survey/18852questions.json",
    paths.nhk_survey_dir / "18852questions.json",
)


for district_id in districts.keys():
    download(
        f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/survey/{district_id}.json",
        paths.nhk_survey_dir / f"{district_id}.json",
    )
    time.sleep(0.1)
