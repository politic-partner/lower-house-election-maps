import paths
import datetime
from pathlib import Path
import requests
import json
import time
import xml.etree.ElementTree

time_text = datetime.datetime.now().strftime("%Y%m%d%H%M%S")


def download_and_save(url: str, path: Path):
    response = requests.get(url)
    response.raise_for_status()
    path.write_text(response.text, encoding="utf-8")


def get_response_body(url: str):
    response = requests.get(url)
    response.raise_for_status()
    return response.content


donwload_dir = paths.nhk_flash_dir / time_text
donwload_dir.mkdir(parents=True)

download_and_save(
    "https://www3.nhk.or.jp/news/json16/word/0000304_001.json",
    donwload_dir / "0000304_001.json",
)

download_and_save(
    "https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/mapsk.xml",
    donwload_dir / "mapsk.xml",
)

districts = json.loads(paths.districts_json_file.read_text(encoding="utf-8"))
for district_id, district in districts.items():
    download_and_save(
        f"https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/skh{district_id}.xml",
        donwload_dir / f"skh{district_id}.xml",
    )
    time.sleep(0.1)

blocks = json.loads(paths.blocks_json_file.read_text(encoding="utf-8"))
for block_id, block in blocks.items():
    download_and_save(
        f"https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/hsm{block_id}.xml",
        donwload_dir / f"hsm{block_id}.xml",
    )

    xml_root = xml.etree.ElementTree.fromstring(
        get_response_body(
            f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/menub{block_id}.xml"
        )
    )
    party_ids = [prty.attrib["prtyId"] for prty in xml_root.findall("prty")]
    for party_id in party_ids:
        download_and_save(
            f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/hmb{block_id}_{party_id}.xml",
            donwload_dir / f"hmb{block_id}_{party_id}.xml",
        )

    time.sleep(0.1)


"""
ニュースリード
https://www3.nhk.or.jp/news/json16/word/0000304_001.json


当確情報
https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/mapsk.xml

獲得議席状況
/senkyo-data/database/shugiin/2024/00/18852/xml/ka/jyo18852.xml


小選挙区結果
/senkyo-data/database/shugiin/2024/00/18852/xml/ka/skh52222.xml


比例区結果
https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/hsm01.xml
https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/hsm02.xml
https://www3.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ka/hsm11.xml
"""
